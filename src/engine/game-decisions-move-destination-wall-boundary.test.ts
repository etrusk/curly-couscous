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

describe("computeDecisions - move destination - wall-boundary fallback", () => {
  it("should escape perpendicular to lower Y when away-horizontal blocked at x=0 (same row)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 2, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 5 },
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
    expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 4 });
  });

  it("should escape perpendicular to higher Y when away-horizontal blocked at x=0 and at y=0", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 2, y: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
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
    expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 1 });
  });

  it("should escape perpendicular to lower Y when away-horizontal blocked at x=11 (same row)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 9, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 11, y: 5 },
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
    expect(decisions[0]!.action.targetCell).toEqual({ x: 11, y: 4 });
  });

  it("should escape perpendicular to lower X when away-vertical blocked at y=0 (same column)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 0 },
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
    expect(decisions[0]!.action.targetCell).toEqual({ x: 4, y: 0 });
  });

  it("should escape perpendicular to higher X when away-vertical blocked at y=0 and at x=0", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 0, y: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
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
    expect(decisions[0]!.action.targetCell).toEqual({ x: 1, y: 0 });
  });

  it("should escape perpendicular to lower X when away-vertical blocked at y=11 (same column)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 9 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 11 },
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
    expect(decisions[0]!.action.targetCell).toEqual({ x: 4, y: 11 });
  });

  it("should escape corner (0,0) when fleeing from diagonal target (1,1)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
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
    // (0,1) scores 4 (dist=1, routes=4) vs stay (0,0) scores 2 (dist=1, routes=2)
    expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 1 });
  });

  it("should escape corner (11,11) when fleeing from diagonal target (10,10)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 10, y: 10 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 11, y: 11 },
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
    // (11,10) scores 4 (dist=1, routes=4) vs stay (11,11) scores 2 (dist=1, routes=2)
    expect(decisions[0]!.action.targetCell).toEqual({ x: 11, y: 10 });
  });

  it("should escape corner (0,11) when fleeing from diagonal target (1,10)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 10 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 11 },
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
    // (0,10) scores 4 (dist=1, routes=4) vs stay (0,11) scores 2 (dist=1, routes=2)
    expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 10 });
  });

  it("should escape corner (11,0) when fleeing from diagonal target (10,1)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 10, y: 1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 11, y: 0 },
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
    // (11,1) scores 4 (dist=1, routes=4) vs stay (11,0) scores 2 (dist=1, routes=2)
    expect(decisions[0]!.action.targetCell).toEqual({ x: 11, y: 1 });
  });

  it("should prefer interior with better escape routes (vertical fallback)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 2, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 3 },
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
    // Interior (1,2) scores 24 (dist=3, routes=8) vs edge (0,2) scores 15 (dist=3, routes=5)
    expect(decisions[0]!.action.targetCell).toEqual({ x: 1, y: 2 });
  });

  it("should stay in place when already at target position (dx=dy=0)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
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
    expect(decisions[0]!.action.targetCell).toEqual({ x: 5, y: 5 });
  });

  it("should not break towards mode when approaching wall", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 0, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 1, y: 5 },
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
    expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 5 });
  });

  it("should not break towards mode at corner", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 0, y: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 1, y: 1 },
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
    // A* pathfinding moves diagonally to target (0,0) which is adjacent
    expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 0 });
  });

  it("should escape from adjacent target at wall (single cell)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 5 },
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
    // Escape route weighting: (1,4) has 7 routes (score=7) vs (0,4) has 4 routes (score=4)
    expect(decisions[0]!.action.targetCell).toEqual({ x: 1, y: 4 });
  });
});
