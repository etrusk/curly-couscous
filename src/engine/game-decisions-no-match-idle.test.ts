/**
 * Tests for no match to idle logic in computeDecisions.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("computeDecisions - no match to idle", () => {
  it("should return idle action when no skills match", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: -40 },
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
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });

  it("should return idle action when character has no skills", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 6, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });

  it("should return idle action when all skills disabled", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 6, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          enabled: false,
          triggers: [{ type: "always" }],
        }),
        createSkill({
          id: "skill2",
          damage: 20,
          enabled: false,
          triggers: [{ type: "always" }],
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

  it("should return idle action with type=idle", () => {
    const character = createCharacter({
      id: "char1",
      position: { q: 3, r: 2 },
      skills: [],
    });
    const state = createGameState({
      tick: 1,
      characters: [character],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });

  it("should set idle targetCell to character position", () => {
    const character = createCharacter({
      id: "char1",
      position: { x: 5, y: 7 },
      skills: [],
    });
    const state = createGameState({
      tick: 1,
      characters: [character],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.targetCell).toEqual({ x: 5, y: 7 });
  });
});
