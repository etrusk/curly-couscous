/**
 * Tests for wall-boundary fallback functionality.
 */

import { describe, it, expect } from "vitest";
import { computeMoveDestination } from "./game-movement";
import { createCharacter } from "./game-test-helpers";

describe("computeMoveDestination - wall-boundary fallback", () => {
  it("should clamp move destination to grid bounds at x=0 edge", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
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

    // Moving away from (5,5) when at (0,5) would try x=-1, clamped to x=0
    // Wall-boundary fallback: try perpendicular escape (lower Y)
    expect(targetCell).toEqual({ x: 0, y: 4 });
  });

  it("should clamp move destination to grid bounds at x=11 edge", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
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

    // Moving away from (5,5) when at (11,5) would try x=12, clamped to x=11
    // Wall-boundary fallback: try perpendicular escape (lower Y)
    expect(targetCell).toEqual({ x: 11, y: 4 });
  });

  it("should clamp move destination to grid bounds at y=0 edge", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
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

    // Moving away from (5,5) when at (5,0) would try y=-1, clamped to y=0
    // Wall-boundary fallback: try perpendicular escape (lower X)
    expect(targetCell).toEqual({ x: 4, y: 0 });
  });

  it("should clamp move destination to grid bounds at y=11 edge", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
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

    // Moving away from (5,5) when at (5,11) would try y=12, clamped to y=11
    // Wall-boundary fallback: try perpendicular escape (lower X)
    expect(targetCell).toEqual({ x: 4, y: 11 });
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
      position: { x: 2, y: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 0, y: 1 });
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
      position: { x: 0, y: 0 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 1, y: 0 });
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

  it("should stay in place at corner (0,0) when fleeing from diagonal target (1,1)", () => {
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

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 0, y: 0 });
  });

  it("should stay in place at corner (11,11) when fleeing from diagonal target (10,10)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 10, y: 10 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 11, y: 11 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 11, y: 11 });
  });

  it("should stay in place at corner (0,11) when fleeing from diagonal target (1,10)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 10 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 11 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 0, y: 11 });
  });

  it("should stay in place at corner (11,0) when fleeing from diagonal target (10,1)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 10, y: 1 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 11, y: 0 },
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 11, y: 0 });
  });

  it("should use natural secondary when it exists (vertical fallback after horizontal blocked)", () => {
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

    // dx=2, dy=2 → prefer horizontal → x=-1 blocked → natural secondary y=3-1=2
    expect(targetCell).toEqual({ x: 0, y: 2 });
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
    });

    const targetCell = computeMoveDestination(character, enemy, "away", [
      character,
      enemy,
    ]);

    expect(targetCell).toEqual({ x: 5, y: 5 });
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
      position: { x: 0, y: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 1, y: 1 },
    });

    const targetCell = computeMoveDestination(character, enemy, "towards", [
      character,
      enemy,
    ]);

    // A* pathfinding moves diagonally to target (0,0) which is adjacent
    // Target is not excluded from obstacles so it's the destination
    expect(targetCell).toEqual({ x: 0, y: 0 });
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

    expect(targetCell).toEqual({ x: 0, y: 4 });
  });
});
