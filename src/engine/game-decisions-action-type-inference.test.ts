/**
 * Tests for action type inference logic in computeDecisions.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("computeDecisions - action type inference", () => {
  it("should create attack action for skill with damage", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("attack");
  });

  it("should create move action for skill with mode", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 3 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      skills: [
        createSkill({
          id: "skill1",
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
  });
});

describe("computeDecisions - tick resolution for intent visibility", () => {
  it("should set resolvesAtTick = currentTick + tickCost for Light Punch (tickCost 1)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      skills: [
        createSkill({
          id: "light-punch",
          damage: 10,
          tickCost: 1,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 0,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions).toHaveLength(2); // Both characters make decisions
    const char1Decision = decisions.find((d) => d.characterId === "char1");
    expect(char1Decision!.action.type).toBe("attack");
    expect(char1Decision!.action.resolvesAtTick).toBe(1); // 0 + 1 = 1
  });

  it("should set resolvesAtTick = currentTick + tickCost for Heavy Punch (tickCost 2)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      skills: [
        createSkill({
          id: "heavy-punch",
          damage: 25,
          tickCost: 2,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 0,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions).toHaveLength(2); // Both characters make decisions
    const char1Decision = decisions.find((d) => d.characterId === "char1");
    expect(char1Decision!.action.type).toBe("attack");
    expect(char1Decision!.action.resolvesAtTick).toBe(2); // 0 + 2 = 2
  });
});

describe("getActionType - explicit actionType field", () => {
  it("should read actionType field directly without inference", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      skills: [
        createSkill({
          id: "skill1",
          actionType: "attack",
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("attack");
  });

  it("should respect explicit actionType for all action types", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 3 },
    });

    // Test actionType: "move"
    const moveChar = createCharacter({
      id: "moveChar",
      faction: "friendly",
      skills: [
        createSkill({
          id: "skill-move",
          actionType: "move",
          behavior: "towards",
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const moveState = createGameState({
      tick: 1,
      characters: [moveChar, enemy],
    });
    const moveDecisions = computeDecisions(moveState);
    expect(moveDecisions[0]!.action.type).toBe("move");

    // Test actionType: "heal"
    const healChar = createCharacter({
      id: "healChar",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "skill-heal",
          actionType: "heal",
          behavior: "",
          healing: 25,
          target: "ally",
        }),
      ],
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 0, r: 1 },
      hp: 50,
    });
    const healState = createGameState({
      tick: 1,
      characters: [healChar, ally, enemy],
    });
    const healDecisions = computeDecisions(healState);
    expect(healDecisions[0]!.action.type).toBe("heal");
  });
});
