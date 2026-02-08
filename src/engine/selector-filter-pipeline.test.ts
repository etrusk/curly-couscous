/**
 * Integration tests for skill filters: pipeline behavior and pool narrowing.
 * Split from selector-filter-integration.test.ts
 */

import { describe, it, expect } from "vitest";
import { evaluateSkillsForCharacter } from "./game-decisions";
import { createCharacter, createSkill } from "./game-test-helpers";

describe("filter integration - pipeline behavior and pool narrowing", () => {
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
});
