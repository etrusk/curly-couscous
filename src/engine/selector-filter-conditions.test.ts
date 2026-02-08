/**
 * Integration tests for skill filters: condition-specific filters.
 * Split from selector-filter-integration.test.ts
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

describe("filter integration - condition-specific filters", () => {
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
