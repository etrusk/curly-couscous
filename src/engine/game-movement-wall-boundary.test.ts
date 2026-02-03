/**
 * Tests for wall-boundary fallback functionality.
 */

import { describe, it, expect } from "vitest";
import { computeMoveDestination } from "./game-movement";
import { createCharacter } from "./game-test-helpers";

describe("computeMoveDestination - wall-boundary fallback", () => {
  it("should prefer interior over edge at x=0 when fleeing distant threat", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 5 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Interior (1,4) scores 32 (dist=4, routes=8) vs edge (0,4) scores 25 (dist=5, routes=5)
    expect(targetCell).toEqual({ x: 1, y: 4 });
  });

  it("should prefer interior over edge at x=11 when fleeing distant threat", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 11, y: 5 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Interior (10,4) scores 40 (dist=5, routes=8) vs edge (11,4) scores 30 (dist=6, routes=5)
    expect(targetCell).toEqual({ x: 10, y: 4 });
  });

  it("should prefer interior over edge at y=0 when fleeing distant threat", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 0 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Interior (4,1) scores 32 (dist=4, routes=8) vs edge (4,0) scores 25 (dist=5, routes=5)
    expect(targetCell).toEqual({ x: 4, y: 1 });
  });

  it("should prefer interior over edge at y=11 when fleeing distant threat", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 11 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Interior (4,10) scores 40 (dist=5, routes=8) vs edge (4,11) scores 30 (dist=6, routes=5)
    expect(targetCell).toEqual({ x: 4, y: 10 });
  });

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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 0, y: 4 });
  });

  it("should escape perpendicular to higher Y when away-horizontal blocked at x=0 and at y=0", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
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

    expect(targetCell).toEqual({ q: 0, r: 1 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 11, y: 4 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 4, y: 0 });
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
      position: { q: 0, r: 0 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ q: 1, r: 0 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 4, y: 11 });
  });

  it("should escape corner (0,0) when fleeing from diagonal target (1,1)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 1 },
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

    // (0,1) scores 4 (dist=1, routes=4) vs stay (0,0) scores 2 (dist=1, routes=2)
    expect(targetCell).toEqual({ q: 0, r: 1 });
  });

  it("should escape corner (11,11) when fleeing from diagonal target (10,10)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: -40 },
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

    // (11,10) scores 4 (dist=1, routes=4) vs stay (11,11) scores 2 (dist=1, routes=2)
    expect(targetCell).toEqual({ x: 11, y: 10 });
  });

  it("should escape corner (0,11) when fleeing from diagonal target (1,10)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 10 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 11 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // (0,10) scores 4 (dist=1, routes=4) vs stay (0,11) scores 2 (dist=1, routes=2)
    expect(targetCell).toEqual({ q: 0, r: 10 });
  });

  it("should escape corner (11,0) when fleeing from diagonal target (10,1)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: -4 },
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

    // (11,1) scores 4 (dist=1, routes=4) vs stay (11,0) scores 2 (dist=1, routes=2)
    expect(targetCell).toEqual({ x: 11, y: 1 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Interior (1,2) scores 24 (dist=3, routes=8) vs edge (0,2) scores 15 (dist=3, routes=5)
    expect(targetCell).toEqual({ x: 1, y: 2 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 0, y: 5 });
  });

  it("should not break towards mode at corner", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 1, r: 1 },
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    // A* pathfinding moves diagonally to target (0,0) which is adjacent
    // Target is not excluded from obstacles so it's the destination
    expect(targetCell).toEqual({ q: 0, r: 0 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    // Escape route weighting: (1,4) has 7 routes (score=7) vs (0,4) has 4 routes (score=4)
    expect(targetCell).toEqual({ x: 1, y: 4 });
  });
});
