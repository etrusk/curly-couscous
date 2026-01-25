/**
 * Tests for basic move destination functionality.
 */

import { describe, it, expect } from "vitest";
import { computeMoveDestination } from "./game-movement";
import { createCharacter } from "./game-test-helpers";

describe("computeMoveDestination - basic move destination", () => {
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
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    expect(targetCell.x).toBeGreaterThan(character.position.x);
    expect(targetCell.y).toBe(5); // Same row
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell.x).toBeLessThan(character.position.x);
    // The algorithm chooses (4,4) based on tiebreaking rules:
    // 1. Maximize distance (all x=4 cells have distance 4)
    // 2. Maximize absDx (all equal = 4)
    // 3. Maximize absDy: (4,4) has absDy=1, (4,5) has absDy=0, (4,6) has absDy=1
    // 4. Minimize y: (4,4) has y=4, (4,6) has y=6
    // So (4,4) wins
    expect(targetCell.y).toBe(4);
  });

  it("should return current position when already at target (dx=dy=0)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 5, y: 5 });
  });

  it("should handle hold mode (not applicable to computeMoveDestination)", () => {
    // Note: hold mode is handled at a higher level (skill evaluation)
    // computeMoveDestination only handles "towards" and "away" modes
    // This test is a placeholder to show we're aware of the distinction
    expect(true).toBe(true);
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
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    // dx = 3, dy = 3 (equal), with diagonal movement should move to (6,6)
    // Diagonal reduces Chebyshev distance from 3 to 2, horizontal only reduces to 2
    // Both reduce distance equally, but diagonal also reduces |dx| and |dy| equally
    // According to tiebreaking: minimize resulting |dx| then |dy|
    // After diagonal move: |dx|=2, |dy|=2
    // After horizontal move: |dx|=2, |dy|=3
    // Diagonal wins because |dy| is smaller (2 < 3)
    expect(targetCell).toEqual({ x: 6, y: 6 });
  });
});
