/* eslint-disable max-lines -- Comprehensive skill priority tests */
/**
 * Tests for skill priority order logic in computeDecisions.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("computeDecisions - skill priority order", () => {
  it("should select first matching skill (priority order)", () => {
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
          triggers: [{ type: "always" }],
        }),
        createSkill({
          id: "skill2",
          damage: 20,
          triggers: [{ type: "always" }],
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

  it("should skip to second skill when first trigger fails", () => {
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
          triggers: [{ type: "enemy_in_range", value: 1 }],
        }),
        createSkill({
          id: "skill2",
          damage: 20,
          range: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.id).toBe("skill2");
  });

  it("should skip to third skill when first two fail", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: -3 }, // Distance 5 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "enemy_in_range", value: 1 }],
        }),
        createSkill({
          id: "skill2",
          damage: 20,
          triggers: [{ type: "hp_below", value: 50 }],
        }),
        createSkill({
          id: "skill3",
          damage: 30,
          range: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.id).toBe("skill3");
  });

  // NEW TESTS FOR MOVE SKILL DUPLICATION
  it("priority evaluation selects higher priority move when trigger passes", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      hp: 30,
      maxHp: 100,
      skills: [
        createSkill({
          id: "move-towards",
          instanceId: "move-away-inst",
          behavior: "away",
          triggers: [{ type: "hp_below", value: 50 }],
        }),
        createSkill({
          id: "move-towards",
          instanceId: "move-towards-inst",
          behavior: "towards",
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("move");
    expect(decisions[0]!.action.skill.behavior).toBe("away");
  });

  it("priority evaluation skips to lower priority move when trigger fails", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      hp: 100,
      maxHp: 100,
      skills: [
        createSkill({
          id: "move-towards",
          instanceId: "move-away-inst",
          behavior: "away",
          triggers: [{ type: "hp_below", value: 50 }],
        }),
        createSkill({
          id: "move-towards",
          instanceId: "move-towards-inst",
          behavior: "towards",
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("move");
    expect(decisions[0]!.action.skill.behavior).toBe("towards");
  });

  it("hp conditional movement full scenario low hp triggers away", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      hp: 30,
      maxHp: 100,
      skills: [
        createSkill({
          id: "move-towards",
          instanceId: "move-away-inst",
          behavior: "away",
          triggers: [{ type: "hp_below", value: 50 }],
        }),
        createSkill({
          id: "move-towards",
          instanceId: "move-towards-inst",
          behavior: "towards",
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    const charDecision = decisions.find((d) => d.characterId === "char1");
    expect(charDecision).toBeDefined();
    expect(charDecision!.action.type).toBe("move");
    expect(charDecision!.action.skill.behavior).toBe("away");
    // Target cell should be farther from enemy (distance increased)
    const originalDistance = Math.abs(character.position.q - enemy.position.q);
    const newDistance = Math.abs(
      charDecision!.action.targetCell.q - enemy.position.q,
    );
    expect(newDistance).toBeGreaterThan(originalDistance);
  });

  it("hp conditional movement full scenario high hp triggers towards", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      hp: 100,
      maxHp: 100,
      skills: [
        createSkill({
          id: "move-towards",
          instanceId: "move-away-inst",
          behavior: "away",
          triggers: [{ type: "hp_below", value: 50 }],
        }),
        createSkill({
          id: "move-towards",
          instanceId: "move-towards-inst",
          behavior: "towards",
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("move");
    expect(decisions[0]!.action.skill.behavior).toBe("towards");
    // Target cell should be closer to enemy (distance decreased)
    const originalDistance = Math.abs(character.position.q - enemy.position.q);
    const newDistance = Math.abs(
      decisions[0]!.action.targetCell.q - enemy.position.q,
    );
    expect(newDistance).toBeLessThan(originalDistance);
  });

  it("multiple characters with different move configs", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    const charA = createCharacter({
      id: "charA",
      faction: "friendly",
      position: { q: -2, r: 0 },
      hp: 30,
      maxHp: 100,
      skills: [
        createSkill({
          id: "move-towards",
          instanceId: "charA-away",
          behavior: "away",
          triggers: [{ type: "hp_below", value: 50 }],
        }),
        createSkill({
          id: "move-towards",
          instanceId: "charA-towards",
          behavior: "towards",
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const charB = createCharacter({
      id: "charB",
      faction: "friendly",
      position: { q: -2, r: 2 },
      hp: 100,
      maxHp: 100,
      skills: [
        createSkill({
          id: "move-towards",
          instanceId: "charB-away",
          behavior: "away",
          triggers: [{ type: "hp_below", value: 50 }],
        }),
        createSkill({
          id: "move-towards",
          instanceId: "charB-towards",
          behavior: "towards",
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [charA, charB, enemy],
    });

    const decisions = computeDecisions(state);

    const decisionA = decisions.find((d) => d.characterId === "charA");
    const decisionB = decisions.find((d) => d.characterId === "charB");
    expect(decisionA?.action.type).toBe("move");
    expect(decisionA?.action.skill.behavior).toBe("away");
    expect(decisionB?.action.type).toBe("move");
    expect(decisionB?.action.skill.behavior).toBe("towards");
  });

  it("three move instances priority cascade", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      hp: 80,
      maxHp: 100,
      skills: [
        createSkill({
          id: "move-towards",
          instanceId: "move1",
          behavior: "away",
          triggers: [{ type: "hp_below", value: 25 }],
        }),
        createSkill({
          id: "move-towards",
          instanceId: "move2",
          behavior: "away",
          triggers: [{ type: "hp_below", value: 50 }],
        }),
        createSkill({
          id: "move-towards",
          instanceId: "move3",
          behavior: "towards",
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.behavior).toBe("towards");
    expect(decisions[0]!.action.type).toBe("move");
  });

  it("three move instances middle trigger passes", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      hp: 40,
      maxHp: 100,
      skills: [
        createSkill({
          id: "move-towards",
          instanceId: "move1",
          behavior: "away",
          triggers: [{ type: "hp_below", value: 25 }],
        }),
        createSkill({
          id: "move-towards",
          instanceId: "move2",
          behavior: "away",
          triggers: [{ type: "hp_below", value: 50 }],
        }),
        createSkill({
          id: "move-towards",
          instanceId: "move3",
          behavior: "towards",
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.behavior).toBe("away");
    expect(decisions[0]!.action.type).toBe("move");
  });
});
