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
