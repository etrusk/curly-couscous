/**
 * Tests for singular trigger evaluation in computeDecisions.
 * Replaces old AND logic tests with singular trigger tests (Phase 1 refactor).
 */

import { describe, it, expect } from "vitest";
import { computeDecisions, evaluateSkillsForCharacter } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("computeDecisions - singular trigger", () => {
  it("should select skill when single trigger passes", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          trigger: { scope: "enemy", condition: "in_range", conditionValue: 3 },
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

  it("should fall through to idle when single trigger fails", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: -3 }, // Distance 5 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          trigger: { scope: "enemy", condition: "in_range", conditionValue: 3 },
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

  it("should select skill with always trigger (default trigger shape)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          trigger: { scope: "enemy", condition: "always" },
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

  it("should select skill when negated trigger passes (NOT hp_below = above threshold)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 80,
      maxHp: 100,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          trigger: {
            scope: "self",
            condition: "hp_below",
            conditionValue: 50,
            negated: true,
          },
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

  it("should fall through to idle when negated trigger fails", () => {
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
      maxHp: 100,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          trigger: {
            scope: "self",
            condition: "hp_below",
            conditionValue: 50,
            negated: true,
          },
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

  it("should demonstrate AND-like behavior via skill duplication with different priorities", () => {
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
          trigger: { scope: "ally", condition: "hp_below", conditionValue: 50 },
        }),
        createSkill({
          id: "heal2",
          actionType: "heal",
          healing: 20,
          target: "ally",
          trigger: { scope: "ally", condition: "in_range", conditionValue: 3 },
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

    // Both triggers pass, heal1 selected due to higher priority
    const decisions1 = computeDecisions(state);
    expect(decisions1[0]!.action.skill.id).toBe("heal1");

    // When ally HP is 80/100 (hp_below fails), falls through to heal2
    const allyHealthy = { ...ally, hp: 80 };
    const state2 = createGameState({
      tick: 1,
      characters: [character, allyHealthy],
    });
    const decisions2 = computeDecisions(state2);
    expect(decisions2[0]!.action.skill.id).toBe("heal2");
  });

  it("should produce failedTrigger (singular) in evaluateSkillsForCharacter", () => {
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
      maxHp: 100,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          trigger: {
            scope: "self",
            condition: "hp_below",
            conditionValue: 50,
            negated: true,
          },
        }),
      ],
    });

    const result = evaluateSkillsForCharacter(character, [character, enemy]);

    expect(result.skillEvaluations[0]?.status).toBe("rejected");
    expect(result.skillEvaluations[0]?.rejectionReason).toBe("trigger_failed");
    expect(result.skillEvaluations[0]?.failedTrigger).toBeDefined();
    expect(result.skillEvaluations[0]?.failedTrigger?.condition).toBe(
      "hp_below",
    );
    expect(result.skillEvaluations[0]?.failedTrigger?.negated).toBe(true);
    expect(result.skillEvaluations[0]?.failedTrigger?.scope).toBe("self");
  });

  it("should propagate failedTrigger (singular) through computeDecisions evaluations", () => {
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
      maxHp: 100,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          trigger: {
            scope: "self",
            condition: "hp_below",
            conditionValue: 50,
            negated: true,
          },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
    expect(decisions[0]!.evaluations).toBeDefined();
    expect(decisions[0]!.evaluations!.skillEvaluations[0]?.status).toBe(
      "rejected",
    );
    expect(
      decisions[0]!.evaluations!.skillEvaluations[0]?.rejectionReason,
    ).toBe("trigger_failed");
    expect(
      decisions[0]!.evaluations!.skillEvaluations[0]?.failedTrigger,
    ).toBeDefined();
    expect(
      decisions[0]!.evaluations!.skillEvaluations[0]?.failedTrigger?.negated,
    ).toBe(true);
  });
});

describe("computeDecisions - full decision flow with new trigger shape", () => {
  it("should complete full decision pipeline with in_range trigger", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "attack1",
          damage: 10,
          trigger: { scope: "enemy", condition: "in_range", conditionValue: 1 },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).not.toBe("idle");
    expect(decisions[0]!.action.type).toBe("attack");
    expect(decisions[0]!.action.skill.id).toBe("attack1");
    expect(decisions[0]!.evaluations!.skillEvaluations[0]?.status).toBe(
      "selected",
    );
  });

  it("should complete targeting_me dodge scenario", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "dodge-move",
          actionType: "move",
          behavior: "away",
          trigger: { scope: "enemy", condition: "targeting_me" },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 },
      currentAction: {
        type: "attack",
        skill: createSkill({ id: "test-attack", damage: 10 }),
        targetCell: { q: 3, r: 2 },
        targetCharacter: character,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("move");
  });
});
