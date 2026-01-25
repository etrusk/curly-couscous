/**
 * Tests for diagonal movement functionality.
 */

import { describe, it, expect } from "vitest";
import { computeMoveDestination } from "./game-movement";
import { createCharacter } from "./game-test-helpers";

describe("computeMoveDestination - diagonal movement", () => {
  it("should move northeast when target is northeast (dx>0, dy>0)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 7, y: 6 },
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

    // dx=2, dy=1 → diagonal reduces Chebyshev distance from 2 to 1
    expect(targetCell).toEqual({ x: 6, y: 6 });
  });

  it("should move northwest when target is northwest (dx<0, dy>0)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 3, y: 7 },
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

    // dx=-2, dy=2 → diagonal reduces Chebyshev distance from 2 to 1
    expect(targetCell).toEqual({ x: 4, y: 6 });
  });

  it("should move southeast when target is southeast (dx>0, dy<0)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 7, y: 3 },
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

    // dx=2, dy=-2 → diagonal reduces Chebyshev distance from 2 to 1
    expect(targetCell).toEqual({ x: 6, y: 4 });
  });

  it("should move southwest when target is southwest (dx<0, dy<0)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 3, y: 3 },
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

    // dx=-2, dy=-2 → diagonal reduces Chebyshev distance from 2 to 1
    expect(targetCell).toEqual({ x: 4, y: 4 });
  });

  it("should prefer diagonal over orthogonal when strictly better Chebyshev distance", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 7, y: 6 },
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

    // Current Chebyshev distance: max(2,1) = 2
    // Diagonal (6,6): distance becomes max(1,0) = 1
    // Horizontal (6,5): distance becomes max(1,1) = 1
    // Vertical (5,6): distance becomes max(2,0) = 2
    // Both diagonal and horizontal reduce distance to 1
    // Tiebreaking: minimize resulting |dx| then |dy|
    // Diagonal: |dx|=1, |dy|=0
    // Horizontal: |dx|=1, |dy|=1
    // Diagonal wins because |dy| is smaller (0 < 1)
    expect(targetCell).toEqual({ x: 6, y: 6 });
  });

  it("should prefer orthogonal when diagonal offers no Chebyshev advantage (true tie)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 6, y: 5 },
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

    // dx=1, dy=0
    // Diagonal (6,6): distance becomes max(0,1) = 1 (no improvement)
    // Horizontal (6,5): distance becomes max(0,0) = 0 (optimal)
    // Should choose horizontal
    expect(targetCell).toEqual({ x: 6, y: 5 });
  });

  it("should handle away mode with diagonal movement", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 6, y: 6 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // dx=-1, dy=-1 → moving away diagonally to (7,7)
    expect(targetCell).toEqual({ x: 7, y: 7 });
  });

  it("should handle diagonal movement with wall-boundary fallback", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    // At corner (0,0), moving towards (1,1) would be diagonal to (1,1)
    // But (1,1) is occupied by enemy, so should move to (0,1) or (1,0)
    // According to tiebreaking: minimize |dx| then |dy|
    // (0,1): resultDx=1, resultDy=0 → |dx|=1, |dy|=0
    // (1,0): resultDx=0, resultDy=1 → |dx|=0, |dy|=1
    // (1,0) wins because |dx|=0 < |dx|=1
    expect(targetCell).toEqual({ x: 1, y: 0 });
  });

  it("should handle diagonal tiebreaking with equal Chebyshev reduction", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 7, y: 7 },
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

    // dx=2, dy=2
    // Diagonal (6,6): distance becomes max(1,1) = 1
    // Horizontal (6,5): distance becomes max(1,2) = 2
    // Vertical (5,6): distance becomes max(2,1) = 2
    // Diagonal is strictly better
    expect(targetCell).toEqual({ x: 6, y: 6 });
  });

  it("should handle diagonal movement with multiple equidistant options", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 6, y: 6 },
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

    // dx=1, dy=1
    // Diagonal (6,6): distance becomes max(0,0) = 0 (optimal, but occupied)
    // Should choose next best: horizontal (6,5) or vertical (5,6)
    // According to tiebreaking: horizontal first
    expect(targetCell).toEqual({ x: 6, y: 5 });
  });

  it("should maintain deterministic replay with diagonal movement", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 7, y: 6 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });

    const targetCell1 = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);
    const targetCell2 = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    expect(targetCell1).toEqual(targetCell2);
  });
});
