/**
 * Tests for wall-boundary fallback functionality.
 */

import { describe, it, expect } from "vitest";
import { computeMoveDestination } from "./game-movement";
import { createCharacter } from "./game-test-helpers";

describe("computeMoveDestination - hex boundary fallback", () => {
  it("should prefer interior over edge (east boundary) when fleeing distant threat", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 5, r: -2 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Interior (4,-2) score=24 (dist=4, routes=6) > boundary (5,-1) score=20 (dist=5, routes=4)
    expect(targetCell).toEqual({ q: 4, r: -2 });
  });

  it("should prefer interior over edge (west boundary) when fleeing distant threat", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: -5, r: 2 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Interior (-4,2) score=24 (dist=4, routes=6) > boundary (-5,3) score=20 (dist=5, routes=4)
    expect(targetCell).toEqual({ q: -4, r: 2 });
  });

  it("should prefer interior over edge (SE boundary) when fleeing distant threat", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: -2, r: -1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 2, r: 3 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Interior (2,2) score=42 (dist=7, routes=6), tiebreak absDq 4>3 over (1,3)
    expect(targetCell).toEqual({ q: 2, r: 2 });
  });

  it("should prefer interior over edge (NW boundary) when fleeing distant threat", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: -2, r: -3 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Interior (-2,-2) score=42 (dist=7, routes=6), tiebreak absDq 4>3 over (-1,-3)
    expect(targetCell).toEqual({ q: -2, r: -2 });
  });

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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Tangential (5,-1) score=12 (dist=3, routes=4), tiebreak dist 3>2 over (4,-1)
    expect(targetCell).toEqual({ q: 5, r: -1 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Tangential (5,-4) score=8 (dist=2, routes=4), tiebreak absDq 2>1 over (4,-5)
    expect(targetCell).toEqual({ q: 5, r: -4 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Tangential (-5,1) score=12 (dist=3, routes=4), tiebreak dist 3>2 over (-4,1)
    expect(targetCell).toEqual({ q: -5, r: 1 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Tangential (1,4) score=12 (dist=3, routes=4), tiebreak dist 3>2 over (1,3)
    expect(targetCell).toEqual({ q: 1, r: 4 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // (-1,-4) score=12 (dist=3, routes=4), tiebreak dist 3>2 over (0,-4)
    expect(targetCell).toEqual({ q: -1, r: -4 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Tangential (-1,-4) score=12 (dist=3, routes=4), tiebreak dist 3>2 over (-1,-3)
    expect(targetCell).toEqual({ q: -1, r: -4 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Vertex (5,-1) score=3 (dist=1, routes=3), tiebreak absDq 1>0 over (4,1)
    expect(targetCell).toEqual({ q: 5, r: -1 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // (-5,1) score=8 (dist=2, routes=4), tiebreak absDq 2>1 over (-4,-1)
    expect(targetCell).toEqual({ q: -5, r: 1 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // (-1,5) score=8 (dist=2, routes=4), tiebreak absDr 2>1 over (1,4)
    expect(targetCell).toEqual({ q: -1, r: 5 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // (-5,4) score=3 (dist=1, routes=3), tiebreak absDq 1>0 over (-4,5)
    expect(targetCell).toEqual({ q: -5, r: 4 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Interior (4,0) score=18 (dist=3, routes=6) > vertex (5,0) score=9 (dist=3, routes=3)
    expect(targetCell).toEqual({ q: 4, r: 0 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ q: 3, r: 2 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    // A* returns adjacent target directly (hexDist=1)
    expect(targetCell).toEqual({ q: 5, r: 0 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    // A* returns adjacent target directly (hexDist=1)
    expect(targetCell).toEqual({ q: 0, r: 0 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Interior (4,-2) score=12 (dist=2, routes=6) > boundary (5,-3) score=8 (dist=2, routes=4)
    expect(targetCell).toEqual({ q: 4, r: -2 });
  });
});
