/**
 * Tests for trigger AND logic in computeDecisions.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions, evaluateSkillsForCharacter } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("computeDecisions - trigger AND logic", () => {
  it("should pass when all triggers pass (AND logic)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 30,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [
            { type: "enemy_in_range", value: 3 },
            { type: "hp_below", value: 50 },
          ],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.id).toBe("skill1");
  });

  it("should fail when any trigger fails (AND logic)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: -3 }, // Distance 5 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 30,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [
            { type: "enemy_in_range", value: 3 },
            { type: "hp_below", value: 50 },
          ],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });

  it("should pass when triggers array is empty (vacuous truth)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [createSkill({ id: "skill1", damage: 10, triggers: [] })],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.id).toBe("skill1");
  });

  it("should pass when all triggers pass with negated trigger (AND with NOT)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 80,
      maxHp: 100, // 80% - NOT below 50%
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [
            { type: "enemy_in_range", value: 3 },
            { type: "hp_below", value: 50, negated: true },
          ],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.id).toBe("skill1");
  });

  it("should fail when negated trigger fails (AND with NOT)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 30,
      maxHp: 100, // 30% - below 50%, negated makes trigger false
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [
            { type: "enemy_in_range", value: 3 },
            { type: "hp_below", value: 50, negated: true },
          ],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });

  it("should work with ally_hp_below in AND combination", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
      skills: [
        createSkill({
          id: "heal1",
          actionType: "heal",
          healing: 20,
          target: "ally",
          triggers: [
            { type: "ally_in_range", value: 3 },
            { type: "ally_hp_below", value: 50 },
          ],
        }),
      ],
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 }, // Distance 1
      hp: 30,
      maxHp: 100, // 30%
    });
    const state = createGameState({
      tick: 1,
      characters: [character, ally],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.id).toBe("heal1");
  });

  it("should include negated field in failed triggers", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 30,
      maxHp: 100, // 30% - below 50%
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "hp_below", value: 50, negated: true }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    // Skill rejected because HP IS below 50%, negated makes trigger false
    expect(decisions[0]!.action.type).toBe("idle");
    expect(decisions[0]!.evaluations).toBeDefined();
    expect(decisions[0]!.evaluations!.skillEvaluations[0]?.status).toBe(
      "rejected",
    );
    expect(
      decisions[0]!.evaluations!.skillEvaluations[0]?.rejectionReason,
    ).toBe("trigger_failed");
    expect(
      decisions[0]!.evaluations!.skillEvaluations[0]?.failedTriggers?.[0]
        ?.negated,
    ).toBe(true);
  });

  it("should capture negated field in evaluateSkillsForCharacter failedTriggers", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 30,
      maxHp: 100, // 30% - below 50%
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "hp_below", value: 50, negated: true }],
        }),
      ],
    });

    const result = evaluateSkillsForCharacter(character, [character, enemy]);

    expect(result.skillEvaluations[0]?.status).toBe("rejected");
    expect(result.skillEvaluations[0]?.rejectionReason).toBe("trigger_failed");
    expect(result.skillEvaluations[0]?.failedTriggers?.[0]?.type).toBe(
      "hp_below",
    );
    expect(result.skillEvaluations[0]?.failedTriggers?.[0]?.negated).toBe(true);
  });
});
