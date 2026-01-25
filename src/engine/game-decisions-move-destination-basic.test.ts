/**
 * Tests for basic move destination computation logic in computeDecisions.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("computeDecisions - move destination", () => {
  it("should compute move targetCell towards target", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 8, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
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
    expect(decisions[0]!.action.targetCell.x).toBeGreaterThan(
      character.position.x,
    );
  });

  it("should compute move targetCell away from target", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 8, y: 5 },
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
    expect(decisions[0]!.action.targetCell.x).toBeLessThan(
      character.position.x,
    );
  });

  it("should set targetCell to current position for hold mode", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 8, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "hold",
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

  it("should set targetCharacter to null for move actions", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 8, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
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
    expect(decisions[0]!.action.targetCharacter).toBeNull();
  });

  it("should skip move skill when no valid target exists", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
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
      characters: [character],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });

  it("should allow hold mode without valid target", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
      skills: [
        createSkill({
          id: "skill1",
          mode: "hold",
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("move");
    expect(decisions[0]!.action.targetCell).toEqual({ x: 5, y: 5 });
  });

  it("should prefer diagonal movement when dx === dy (diagonal tiebreaking)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 8, y: 8 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
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
    expect(decisions[0]!.action.targetCell).toEqual({ x: 6, y: 6 });
  });
});
