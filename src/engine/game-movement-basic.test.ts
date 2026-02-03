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
      position: { q: 3, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    expect(targetCell.q).toBeGreaterThan(character.position.q);
    expect(targetCell.r).toBe(0); // Same row
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell.q).toBeLessThan(character.position.q);
    // The algorithm chooses based on tiebreaking rules:
    // 1. Maximize distance (all q=-1 cells have distance from enemy)
    // 2. Maximize absDq and absDr
    // 3. Minimize r then minimize q
    expect(targetCell.r).toBeDefined();
  });

  it("should return current position when already at target (same position)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ q: 0, r: 0 });
  });

  it("should prefer hex neighbor that reduces distance towards target", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    // Should move towards the enemy (hex neighbors of {0,0}: {1,0}, {0,1}, {-1,1}, {-1,0}, {0,-1}, {1,-1})
    // {1,0} moves closer to {2,2}
    expect(targetCell.q).toBeGreaterThanOrEqual(0);
    expect(targetCell.r).toBeGreaterThanOrEqual(0);
  });
});
