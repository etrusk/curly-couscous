/**
 * Tests for basic move destination computation logic in computeDecisions.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions, evaluateSkillsForCharacter } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";
import { hexDistance } from "./hex";

describe("computeDecisions - move destination", () => {
  it("should compute move targetCell towards target", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          behavior: "towards",
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("move");
    expect(decisions[0]!.action.targetCell.q).toBeGreaterThan(
      character.position.q,
    );
  });

  it("should compute move targetCell away from target", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          behavior: "away",
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("move");
    expect(decisions[0]!.action.targetCell.q).toBeLessThan(
      character.position.q,
    );
  });

  it("should set targetCharacter to null for move actions", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          behavior: "towards",
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("move");
    expect(decisions[0]!.action.targetCharacter).toBeNull();
  });

  it("should skip move skill when no valid target exists", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          behavior: "towards",
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });

  it("should move towards target via hex neighbor", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          behavior: "towards",
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("move");
    // Should be a hex neighbor (distance 1 from {0,0})
    const targetCell = decisions[0]!.action.targetCell;
    expect(
      Math.max(
        Math.abs(targetCell.q),
        Math.abs(targetCell.r),
        Math.abs(targetCell.q + targetCell.r),
      ),
    ).toBe(1);
  });
});

describe("computeDecisions - plural target movement", () => {
  it("move skill with enemies target and away behavior produces valid action", () => {
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: -1, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "flee-all",
          behavior: "away",
          target: "enemies",
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemyA, enemyB],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]).toBeDefined();
    expect(decisions[0]!.action.type).toBe("move");
    expect(decisions[0]!.action.targetCell).toBeDefined();
    expect(
      hexDistance(character.position, decisions[0]!.action.targetCell),
    ).toBeLessThanOrEqual(1);
    expect(decisions[0]!.action.targetCharacter).toBeNull();
  });

  it("non-movement skill with enemies target is rejected", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "attack-all",
          damage: 10,
          range: 5,
          target: "enemies",
          actionType: "attack",
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);
    const evalResult = evaluateSkillsForCharacter(character, state.characters);

    expect(decisions[0]!.action.type).toBe("idle");
    expect(evalResult.skillEvaluations[0]!.status).toBe("rejected");
    expect(evalResult.skillEvaluations[0]!.rejectionReason).toBe("no_target");
  });

  it("plural target with empty group produces no_target rejection", () => {
    const deadEnemy = createCharacter({
      id: "deadEnemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
      hp: 0,
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "flee-all",
          behavior: "away",
          target: "enemies",
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, deadEnemy],
    });

    const decisions = computeDecisions(state);
    const evalResult = evaluateSkillsForCharacter(character, state.characters);

    expect(decisions[0]!.action.type).toBe("idle");
    expect(evalResult.skillEvaluations[0]!.status).toBe("rejected");
    expect(evalResult.skillEvaluations[0]!.rejectionReason).toBe("no_target");
  });

  it("move skill with allies target and towards behavior produces valid action", () => {
    const allyA = createCharacter({
      id: "allyA",
      faction: "friendly",
      position: { q: 3, r: 0 },
    });
    const allyB = createCharacter({
      id: "allyB",
      faction: "friendly",
      position: { q: 2, r: 1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "regroup",
          behavior: "towards",
          target: "allies",
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    // Enemy needed so trigger scope "enemy" has a valid pool
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: -3, r: 0 },
    });
    const state = createGameState({
      tick: 1,
      characters: [character, allyA, allyB, enemy],
    });

    const decisions = computeDecisions(state);

    // Find the decision for our character (not the enemy)
    const charDecision = decisions.find((d) => d.characterId === "char1");
    expect(charDecision).toBeDefined();
    expect(charDecision!.action.type).toBe("move");
    expect(charDecision!.action.targetCell.q).toBeGreaterThan(0);
    expect(charDecision!.action.targetCharacter).toBeNull();
  });
});
