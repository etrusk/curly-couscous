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
      position: { q: 1, r: 2 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: -1, r: 3 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [mover, enemy]);

    // (-2,4) score=18 (dist=3, routes=6), tiebreak absDr 2>1 over (-2,3)
    expect(result).toEqual({ q: -2, r: 4 });
  });

  it("should maximize composite score when fleeing", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 2 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 1, r: 0 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [mover, enemy]);

    // (0,0) score=30 (dist=5, routes=6), tiebreak absDq 3>2 over (1,-1)
    expect(result).toEqual({ q: 0, r: 0 });
  });

  it("should penalize positions with low escape routes via multiplicative formula", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 2 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const blocker1 = createCharacter({
      id: "blocker1",
      faction: "friendly",
      position: { q: 1, r: 0 },
    });
    const blocker2 = createCharacter({
      id: "blocker2",
      faction: "friendly",
      position: { q: 0, r: 1 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [
      mover,
      enemy,
      blocker1,
      blocker2,
    ]);

    // (-1,0) score=30 (dist=5, routes=6) beats (1,-1) score=20 (dist=4, routes=5)
    expect(result).toEqual({ q: -1, r: 0 });
  });

  it("should preserve open field behavior when all candidates have equal escape routes", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: -1 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 1, r: 1 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [mover, enemy]);

    // (0,2) score=24 (dist=4, routes=6), tiebreak absDr 3>2 over (0,1)
    expect(result).toEqual({ q: 0, r: 2 });
  });

  it("should not affect towards mode at all", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 2 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: -1, r: 3 },
    });

    const result = computeMoveDestination(mover, enemy, "towards", [
      mover,
      enemy,
    ]);

    // Towards mode uses A* pathfinding, unaffected by escape route changes
    expect(result).toEqual({ q: 0, r: 3 });
  });

  it("should account for multi-character obstacles reducing escape routes", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: -1 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 1, r: 1 },
    });
    const bystander = createCharacter({
      id: "bystander",
      faction: "friendly",
      position: { q: 0, r: 2 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [
      mover,
      enemy,
      bystander,
    ]);

    // (0,1) score=18 (dist=3, routes=6) beats (1,2) score=10 (dist=2, routes=5)
    expect(result).toEqual({ q: 0, r: 1 });
  });

  it("should escape from corner trap with adjacent threat", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 1 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [mover, enemy]);

    // (-1,0) and (0,-1) both score=3 (dist=1, routes=3) vs staying score=2 (dist=1, routes=2)
    // Tiebreak: (-1,0) has higher absDr
    expect(result).toEqual({ q: -1, r: 0 });
  });

  it("should prefer interior neighbor over vertex when fleeing from edge", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 1 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 4, r: 1 },
    });

    const result = computeMoveDestination(mover, enemy, "away", [mover, enemy]);

    // Interior (4,0) score=12 (dist=2, routes=6) > vertex (5,0) score=9 (dist=3, routes=3)
    expect(result).toEqual({ q: 4, r: 0 });
  });

  it("should tiebreak on distance when composite scores are equal", () => {
    const candidateA = {
      distance: 5,
      absDq: 5,
      absDr: 0,
      r: 0,
      q: 0,
      escapeRoutes: 4,
    };
    const candidateB = {
      distance: 4,
      absDq: 4,
      absDr: 0,
      r: 0,
      q: 1,
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
      position: { q: 4, r: -1 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 1, r: 1 },
    });
    const blocker1 = createCharacter({
      id: "blocker1",
      faction: "friendly",
      position: { q: 2, r: 1 },
    });
    const blocker2 = createCharacter({
      id: "blocker2",
      faction: "friendly",
      position: { q: 1, r: 2 },
    });
    const blocker3 = createCharacter({
      id: "blocker3",
      faction: "friendly",
      position: { q: 0, r: 2 },
    });
    const blocker4 = createCharacter({
      id: "blocker4",
      faction: "friendly",
      position: { q: 0, r: 1 },
    });
    const blocker5 = createCharacter({
      id: "blocker5",
      faction: "friendly",
      position: { q: 1, r: 0 },
    });
    const blocker6 = createCharacter({
      id: "blocker6",
      faction: "friendly",
      position: { q: 2, r: 0 },
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

    // All 6 neighbors blocked; mover stays in place
    expect(result).toEqual({ q: 1, r: 1 });
  });

  it("should return correct escapeRoutes count for vertex position", () => {
    const result = calculateCandidateScore(
      { q: 5, r: 0 },
      { q: 0, r: 0 },
      new Set<string>(),
    );

    expect(result.escapeRoutes).toBe(3);
    expect(result.distance).toBe(5);
  });

  it("should default escapeRoutes to 6 when obstacles parameter is omitted", () => {
    const result = calculateCandidateScore({ q: 1, r: 1 }, { q: 2, r: 2 });

    expect(result.escapeRoutes).toBe(6);
  });

  it("should correctly subtract obstacles from escape route count at edge", () => {
    const result = calculateCandidateScore(
      { q: 3, r: 2 },
      { q: 0, r: 0 },
      new Set(["2,3", "4,1"]),
    );

    // Edge (3,2) has 4 neighbors, 2 blocked by obstacles -> 2 escape routes
    expect(result.escapeRoutes).toBe(2);
  });

  it("should handle multiple obstacles around center position", () => {
    const result = calculateCandidateScore(
      { q: 1, r: 1 },
      { q: 0, r: 0 },
      new Set(["2,1", "1,2", "0,2"]),
    );

    expect(result.escapeRoutes).toBe(3);
  });

  it("should produce deterministic results for replay", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 2 },
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: -1, r: 3 },
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
