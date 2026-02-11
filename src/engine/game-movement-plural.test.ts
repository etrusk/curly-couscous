/**
 * Tests for plural target movement computation (computePluralMoveDestination).
 * Covers away/towards modes with multiple targets, edge cases, and multi-step.
 */

import { describe, it, expect } from "vitest";
import {
  computeMoveDestination,
  computePluralMoveDestination,
  computeMultiStepPluralDestination,
} from "./game-movement";
import { createCharacter } from "./game-test-helpers";
import { hexDistance } from "./hex";

describe("computePluralMoveDestination", () => {
  it("away mode maximizes min-distance from enemy group", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 2, r: -1 },
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: -1, r: 2 },
    });
    const allCharacters = [mover, enemyA, enemyB];

    const result = computePluralMoveDestination(
      mover,
      [enemyA, enemyB],
      "away",
      allCharacters,
    );

    // Result is a valid hex neighbor of mover (distance 0 or 1)
    expect(hexDistance({ q: 0, r: 0 }, result)).toBeLessThanOrEqual(1);

    // Min-distance from result to either enemy >= min-distance from origin
    const originMinDist = Math.min(
      hexDistance({ q: 0, r: 0 }, enemyA.position),
      hexDistance({ q: 0, r: 0 }, enemyB.position),
    );
    const resultMinDist = Math.min(
      hexDistance(result, enemyA.position),
      hexDistance(result, enemyB.position),
    );
    expect(resultMinDist).toBeGreaterThanOrEqual(originMinDist);

    // Deterministic: calling again with same inputs produces same output
    const result2 = computePluralMoveDestination(
      mover,
      [enemyA, enemyB],
      "away",
      allCharacters,
    );
    expect(result).toEqual(result2);
  });

  it("away mode surrounded on three sides picks best escape", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: 0, r: 1 },
    });
    const enemyC = createCharacter({
      id: "enemyC",
      faction: "enemy",
      position: { q: -1, r: 1 },
    });
    const allCharacters = [mover, enemyA, enemyB, enemyC];

    const result = computePluralMoveDestination(
      mover,
      [enemyA, enemyB, enemyC],
      "away",
      allCharacters,
    );

    // Result is NOT an enemy-occupied position
    expect(result).not.toEqual({ q: 1, r: 0 });
    expect(result).not.toEqual({ q: 0, r: 1 });
    expect(result).not.toEqual({ q: -1, r: 1 });

    // Result is one of the valid candidates (open neighbors or stay)
    const validPositions = [
      { q: -1, r: 0 },
      { q: 0, r: -1 },
      { q: 1, r: -1 },
      { q: 0, r: 0 },
    ];
    expect(
      validPositions.some((p) => p.q === result.q && p.r === result.r),
    ).toBe(true);

    // Min-distance from result to any enemy >= 1
    const resultMinDist = Math.min(
      hexDistance(result, enemyA.position),
      hexDistance(result, enemyB.position),
      hexDistance(result, enemyC.position),
    );
    expect(resultMinDist).toBeGreaterThanOrEqual(1);

    // Result is NOT stay-in-place (open neighbors have better composite score)
    expect(result).not.toEqual({ q: 0, r: 0 });
  });

  it("towards mode moves toward ally group centroid", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: -4 },
    });
    const allyA = createCharacter({
      id: "allyA",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const allyB = createCharacter({
      id: "allyB",
      faction: "friendly",
      position: { q: 1, r: 0 },
    });
    const allCharacters = [mover, allyA, allyB];

    const result = computePluralMoveDestination(
      mover,
      [allyA, allyB],
      "towards",
      allCharacters,
    );

    // Result is a valid hex neighbor (distance exactly 1 from mover)
    expect(hexDistance({ q: 0, r: -4 }, result)).toBe(1);

    // Average distance from result to allies is strictly less than from origin
    const originAvgDist =
      (hexDistance({ q: 0, r: -4 }, allyA.position) +
        hexDistance({ q: 0, r: -4 }, allyB.position)) /
      2;
    const resultAvgDist =
      (hexDistance(result, allyA.position) +
        hexDistance(result, allyB.position)) /
      2;
    expect(resultAvgDist).toBeLessThan(originAvgDist);

    // Mover moved toward positive-r direction where allies are
    expect(result.r).toBeGreaterThan(-4);
  });

  it("towards mode picks best available hex when already among allies", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const allyA = createCharacter({
      id: "allyA",
      faction: "friendly",
      position: { q: 2, r: 0 },
    });
    const allyB = createCharacter({
      id: "allyB",
      faction: "friendly",
      position: { q: -2, r: 0 },
    });
    const allCharacters = [mover, allyA, allyB];

    const result = computePluralMoveDestination(
      mover,
      [allyA, allyB],
      "towards",
      allCharacters,
    );

    // Result is a valid hex neighbor (distance exactly 1 from mover)
    expect(hexDistance({ q: 0, r: 0 }, result)).toBe(1);

    // Result is NOT stay-in-place (towards mode excludes stay)
    expect(result).not.toEqual({ q: 0, r: 0 });

    // Average distance from result to allies equals 2.0
    // (symmetric allies at distance 2 mean any neighbor maintains same avg)
    const resultAvgDist =
      (hexDistance(result, allyA.position) +
        hexDistance(result, allyB.position)) /
      2;
    expect(resultAvgDist).toBe(2.0);
  });

  it("single-member group matches singular target behavior", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 3, r: -1 },
    });
    const allCharacters = [mover, target];

    const pluralResult = computePluralMoveDestination(
      mover,
      [target],
      "away",
      allCharacters,
    );
    const singularResult = computeMoveDestination(
      mover,
      target,
      "away",
      allCharacters,
    );

    // Plural result with one target equals singular result for away mode
    expect(pluralResult).toEqual(singularResult);
  });

  it("empty group returns current position", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 2, r: -1 },
    });
    const allCharacters = [mover];

    const awayResult = computePluralMoveDestination(
      mover,
      [],
      "away",
      allCharacters,
    );
    const towardsResult = computePluralMoveDestination(
      mover,
      [],
      "towards",
      allCharacters,
    );

    expect(awayResult).toEqual({ q: 2, r: -1 });
    expect(towardsResult).toEqual({ q: 2, r: -1 });
  });

  it("multi-step plural movement iterates correctly", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: 0, r: 2 },
    });
    const allCharacters = [mover, enemyA, enemyB];

    const singleStep = computePluralMoveDestination(
      mover,
      [enemyA, enemyB],
      "away",
      allCharacters,
    );
    const doubleStep = computeMultiStepPluralDestination(
      mover,
      [enemyA, enemyB],
      "away",
      allCharacters,
      2,
    );

    // Double step moved exactly 2 hexes from origin
    expect(hexDistance(mover.position, doubleStep)).toBe(2);

    // Double step goes further than single step
    expect(hexDistance(mover.position, doubleStep)).toBeGreaterThan(
      hexDistance(mover.position, singleStep),
    );

    // Min-distance from doubleStep to enemies > min-distance from singleStep
    const singleMinDist = Math.min(
      hexDistance(singleStep, enemyA.position),
      hexDistance(singleStep, enemyB.position),
    );
    const doubleMinDist = Math.min(
      hexDistance(doubleStep, enemyA.position),
      hexDistance(doubleStep, enemyB.position),
    );
    expect(doubleMinDist).toBeGreaterThan(singleMinDist);
  });
});
