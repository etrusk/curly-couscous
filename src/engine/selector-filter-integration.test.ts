/**
 * Integration tests for skill filters through evaluateSkillsForCharacter pipeline.
 * Phase 2: SkillFilter type, `filter` field, pre-criterion pool narrowing.
 */

import { describe, it, expect } from "vitest";
import { evaluateSkillsForCharacter } from "./game-decisions";
import { createCharacter, createSkill } from "./game-test-helpers";
import type { Action } from "./types";

function makeAction(
  o: {
    skillId?: string;
    actionType?: Action["type"];
    targetCell?: { q: number; r: number };
  } = {},
): Action {
  const t = o.actionType ?? "attack";
  return {
    type: t,
    skill: createSkill({
      id: o.skillId ?? "s",
      damage: t === "attack" ? 10 : undefined,
      healing: t === "heal" ? 25 : undefined,
    }),
    targetCell: o.targetCell ?? { q: 0, r: 0 },
    targetCharacter: null,
    startedAtTick: 0,
    resolvesAtTick: 1,
  };
}

describe("filter integration via evaluateSkillsForCharacter", () => {
  it("no filter -- skill without filter is selected as before", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [createSkill({ id: "atk", damage: 10, range: 5 })],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
    expect(r.skillEvaluations[0]!.target).toEqual(e);
  });

  it("hp_below filter passes when target HP is at 30%", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 30,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
    expect(r.skillEvaluations[0]!.target!.id).toBe("e");
  });

  it("hp_below filter rejects when target HP is at 80%", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("rejected");
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("hp_above filter passes when target HP is at 80%", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_above", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
  });

  it("hp_above filter rejects when target HP is at 30%", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_above", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 30,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("rejected");
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("filter rejection includes failedFilter context with SkillFilter shape", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.failedFilter).toEqual({
      condition: "hp_below",
      conditionValue: 50,
    });
  });

  it("filter_failed result does not include a target (pre-criterion semantics)", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.target).toBeUndefined();
  });

  it("filter fallthrough -- first skill rejected, second selected", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "a1",
          instanceId: "a1",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
        createSkill({ id: "a2", instanceId: "a2", damage: 10, range: 5 }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("rejected");
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
    expect(r.skillEvaluations[1]!.status).toBe("selected");
    expect(r.selectedSkillIndex).toBe(1);
  });

  it("self-target skills bypass filter (filter is ignored)", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      hp: 80,
      maxHp: 100,
      skills: [
        createSkill({
          id: "heal",
          healing: 25,
          range: 5,
          target: "self",
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const r = evaluateSkillsForCharacter(f, [f]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
  });

  it("trigger passes but filter fails -- rejection is filter_failed", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("rejected");
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
    expect(r.skillEvaluations[0]!.failedTrigger).toBeUndefined();
  });

  it("filter on move skill -- filter checked even though move skips range check", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "mv",
          behavior: "towards",
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 3, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("rejected");
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("filter checked before heal-full-HP -- filter_failed takes precedence", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "heal",
          healing: 25,
          range: 5,
          target: "ally",
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 1, r: 0 },
      hp: 100,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, ally]);
    expect(r.skillEvaluations[0]!.status).toBe("rejected");
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("duplicated skill instances have independent filter configurations", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "lp",
          instanceId: "lp-1",
          name: "Light Punch",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
        createSkill({
          id: "lp",
          instanceId: "lp-2",
          name: "Light Punch",
          damage: 10,
          range: 5,
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("rejected");
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
    expect(r.skillEvaluations[1]!.status).toBe("selected");
    expect(r.selectedSkillIndex).toBe(1);
  });

  it("pre-criterion pool narrowing selects from narrowed pool (multi-candidate)", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          criterion: "nearest",
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const eA = createCharacter({
      id: "eA",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const eB = createCharacter({
      id: "eB",
      faction: "enemy",
      position: { q: 2, r: 0 },
      hp: 30,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, eA, eB]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
    expect(r.skillEvaluations[0]!.target!.id).toBe("eB");
  });

  it("empty filtered pool produces filter_failed when base pool is non-empty", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("no_target produced when base pool is empty (no living enemies)", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const r = evaluateSkillsForCharacter(f, [f]);
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("no_target");
  });

  it("negated filter in pipeline -- NOT hp_below passes when target is above threshold", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50, negated: true },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
  });

  it("channeling filter in pipeline -- passes when enemy is channeling", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 1,
          filter: { condition: "channeling" },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    e.currentAction = makeAction();
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
  });

  it("channeling filter in pipeline -- rejects when enemy is idle", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 1,
          filter: { condition: "channeling" },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("rejected");
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("idle filter in pipeline -- passes when enemy is idle", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 1,
          filter: { condition: "idle" },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
  });

  it("channeling filter with qualifier in pipeline", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          criterion: "nearest",
          filter: {
            condition: "channeling",
            qualifier: { type: "skill", id: "heal" },
          },
        }),
      ],
    });
    const eA = createCharacter({
      id: "eA",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    eA.currentAction = makeAction({ skillId: "heal", actionType: "heal" });
    const eB = createCharacter({
      id: "eB",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    eB.currentAction = makeAction({
      skillId: "heavy-punch",
      actionType: "attack",
    });
    const r = evaluateSkillsForCharacter(f, [f, eA, eB]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
    expect(r.skillEvaluations[0]!.target!.id).toBe("eA");
  });

  it("targeting_me filter in pipeline -- passes when enemy targets evaluator", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 1,
          filter: { condition: "targeting_me" },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    e.currentAction = makeAction({ targetCell: { q: 0, r: 0 } });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
    expect(r.skillEvaluations[0]!.target!.id).toBe("e");
  });

  it("targeting_ally filter in pipeline -- passes when enemy targets an ally", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "targeting_ally" },
        }),
      ],
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 1, r: 0 },
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    e.currentAction = makeAction({ targetCell: { q: 1, r: 0 } });
    const r = evaluateSkillsForCharacter(f, [f, ally, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
    expect(r.skillEvaluations[0]!.target!.id).toBe("e");
  });
});
