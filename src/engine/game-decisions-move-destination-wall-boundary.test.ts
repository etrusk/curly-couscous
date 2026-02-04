/**
 * Tests for wall-boundary fallback logic in move destination computation.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("computeDecisions - move destination - hex boundary fallback", () => {
  it("should escape tangential along east boundary (same axis)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: -2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 5, r: -2 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: 5, r: -1 });
  });

  it("should escape tangential from vertex (5,-5)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: -3 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 5, r: -5 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: 5, r: -4 });
  });

  it("should escape tangential along west boundary (same axis)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: -3, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: -5, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: -5, r: 1 });
  });

  it("should escape tangential along SE boundary (same axis)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 2, r: 3 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: 1, r: 4 });
  });

  it("should escape tangential from vertex (0,-5)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: -4 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: -5 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: -1, r: -4 });
  });

  it("should escape tangential along NW boundary (same axis)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: -2, r: -1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: -2, r: -3 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: -1, r: -4 });
  });

  it("should escape from vertex (5,0)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 5, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: 5, r: -1 });
  });

  it("should escape from vertex (-5,0)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: -3, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: -5, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: -5, r: 1 });
  });

  it("should escape from vertex (0,5)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 3 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 5 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: -1, r: 5 });
  });

  it("should escape from vertex (-5,5)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: -4, r: 4 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: -5, r: 5 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: -5, r: 4 });
  });

  it("should prefer interior over boundary (angled flee)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 4, r: 1 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: 4, r: 0 });
  });

  it("should stay in place when already at target position (dx=dy=0)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: 3, r: 2 });
  });

  it("should not break towards mode when approaching boundary", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 4, r: 1 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "towards",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: 5, r: 0 });
  });

  it("should not break towards mode at interior", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 1, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "towards",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: 0, r: 0 });
  });

  it("should escape from adjacent threat at boundary", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: -1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 5, r: -2 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "away",
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
    expect(decisions[0]!.action.targetCell).toEqual({ q: 4, r: -2 });
  });
});
