/**
 * Tests for escape route weighting behavior in move-away mode.
 * Verifies that characters fleeing threats prefer positions with more escape routes (unblocked adjacent cells).
 */

import { describe, it, expect } from "vitest";
import {
  computeMoveDestination,
  calculateCandidateScore,
  compareAwayMode,
} from "./game-movement";
import { createCharacter } from "./game-test-helpers";

describe("computeMoveDestination - escape route weighting", () => {
  it("should prefer interior position over edge when distances are close", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 4, y: 5 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { x: 1, y: 5 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [mover, enemy]);

    // Interior (1,4) has score=24 (dist=3, routes=8) vs edge (0,4) score=20 (dist=4, routes=5)
    expect(result).toEqual({ x: 1, y: 4 });
  });

  it("should avoid corner positions in favor of interior positions", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 3, y: 2 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { x: 1, y: 0 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [mover, enemy]);

    // Interior (1,1) score=16 (dist=2, routes=8) beats corner (0,0) score=9 (dist=3, routes=3)
    expect(result).toEqual({ x: 1, y: 1 });
  });

  it("should penalize positions with low escape routes via multiplicative formula", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 2, y: 2 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { x: 0, y: 0 },
    });
    const blocker1 = createCharacter({
      id: "blocker1",
      faction: "friendly",
      position: { x: 1, y: 0 },
    });
    const blocker2 = createCharacter({
      id: "blocker2",
      faction: "friendly",
      position: { x: 0, y: 1 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [
      mover,
      enemy,
      blocker1,
      blocker2,
    ]);

    // (0,1) score=8 (dist=2, routes=4) beats staying at (0,0) score=2 (dist=2, routes=1)
    expect(result).toEqual({ x: 0, y: 1 });
  });

  it("should preserve open field behavior when all candidates have equal escape routes", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 8, y: 6 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { x: 6, y: 6 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [mover, enemy]);

    // All interior candidates have 8 routes; behavior matches old tiebreaking
    expect(result).toEqual({ x: 5, y: 5 });
  });

  it("should not affect towards mode at all", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 4, y: 5 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { x: 1, y: 5 },
    });

    const result = computeMoveDestination(mover, enemy, "towards", [
      mover,
      enemy,
    ]);

    // Towards mode uses A* pathfinding, unaffected by escape route changes
    expect(result).toEqual({ x: 2, y: 5 });
  });

  it("should account for multi-character obstacles reducing escape routes", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 8, y: 5 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const bystander = createCharacter({
      id: "bystander",
      faction: "friendly",
      position: { x: 4, y: 5 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [
      mover,
      enemy,
      bystander,
    ]);

    // (4,5) score=32 (dist=4, routes=8) beats (4,4)/(4,6) score=28 (dist=4, routes=7)
    expect(result).toEqual({ x: 4, y: 5 });
  });

  it("should escape from corner trap with adjacent threat", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 1 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { x: 0, y: 0 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [mover, enemy]);

    // (0,1) and (1,0) both score=4 (dist=1, routes=4) vs staying score=2 (dist=1, routes=2)
    // Tiebreak: (0,1) has higher absDx
    expect(result).toEqual({ x: 0, y: 1 });
  });

  it("should prefer moving inward from edge position", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { x: 0, y: 5 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [mover, enemy]);

    // Interior (1,4) score=32 (dist=4, routes=8) beats edge (0,4) score=25 (dist=5, routes=5)
    expect(result).toEqual({ x: 1, y: 4 });
  });

  it("should tiebreak on distance when composite scores are equal", () => {
    const candidateA = {
      distance: 5,
      absDx: 5,
      absDy: 0,
      y: 0,
      x: 0,
      escapeRoutes: 4,
    };
    const candidateB = {
      distance: 4,
      absDx: 4,
      absDy: 0,
      y: 0,
      x: 1,
      escapeRoutes: 5,
    };

    // Both have composite score = 20
    const result = compareAwayMode(candidateA, candidateB);

    // candidateA wins due to higher distance (5 > 4)
    expect(result).toBe(true);
  });

  it("should handle heavily surrounded character gracefully", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 8, y: 5 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const blocker1 = createCharacter({
      id: "blocker1",
      faction: "friendly",
      position: { x: 4, y: 4 },
    });
    const blocker2 = createCharacter({
      id: "blocker2",
      faction: "friendly",
      position: { x: 4, y: 6 },
    });
    const blocker3 = createCharacter({
      id: "blocker3",
      faction: "friendly",
      position: { x: 5, y: 4 },
    });
    const blocker4 = createCharacter({
      id: "blocker4",
      faction: "friendly",
      position: { x: 5, y: 6 },
    });
    const blocker5 = createCharacter({
      id: "blocker5",
      faction: "friendly",
      position: { x: 6, y: 4 },
    });
    const blocker6 = createCharacter({
      id: "blocker6",
      faction: "friendly",
      position: { x: 6, y: 6 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [
      mover,
      enemy,
      blocker1,
      blocker2,
      blocker3,
      blocker4,
      blocker5,
      blocker6,
    ]);

    // (5,4) score=18 (dist=3, routes=6) is highest; tiebreaks over (5,6) via min y
    expect(result).toEqual({ x: 5, y: 4 });
  });

  it("should return correct escapeRoutes count for corner position", () => {
    const result = calculateCandidateScore(
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      new Set<string>(),
    );

    expect(result.escapeRoutes).toBe(3);
    expect(result.distance).toBe(5);
  });

  it("should default escapeRoutes to 8 when obstacles parameter is omitted", () => {
    const result = calculateCandidateScore({ x: 5, y: 5 }, { x: 8, y: 8 });

    expect(result.escapeRoutes).toBe(8);
  });

  it("should correctly subtract obstacles from escape route count at edge", () => {
    const result = calculateCandidateScore(
      { x: 0, y: 5 },
      { x: 5, y: 5 },
      new Set(["1,5"]),
    );

    expect(result.escapeRoutes).toBe(4);
  });

  it("should handle multiple obstacles around center position", () => {
    const result = calculateCandidateScore(
      { x: 5, y: 5 },
      { x: 0, y: 0 },
      new Set(["4,4", "5,4", "6,6"]),
    );

    expect(result.escapeRoutes).toBe(5);
  });

  it("should produce deterministic results for replay", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 4, y: 5 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { x: 1, y: 5 },
    });

    const result1 = computeMoveDestination(mover, enemy, "away", [
      mover,
      enemy,
    ]);
    const result2 = computeMoveDestination(mover, enemy, "away", [
      mover,
      enemy,
    ]);

    expect(result1).toEqual(result2);
  });
});
