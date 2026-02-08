/**
 * Tests for most_enemies_nearby criterion in evaluateTargetCriterion.
 * Phase 6: AoE-optimal targeting criterion.
 * Split from selectors-target-criterion.test.ts for 400-line limit.
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";
import type { Criterion } from "./types";

describe("evaluateTargetCriterion - most_enemies_nearby", () => {
  // Cast to Criterion to allow compilation before the type is extended
  const MOST_ENEMIES_NEARBY = "most_enemies_nearby" as Criterion;

  it("selects enemy with most other enemies within 2 hexes", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    // Enemy A at (-1,0) - near B (distance 2) but NOT near D or E (distance 3)
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: -1, r: 0 },
    });
    // Enemy B at (1,0) - has 3 nearby: A(dist 2), D(dist 1), E(dist 1)
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    // Enemy C at (-4,0) - has 0 nearby (all others >= 3 distance)
    const enemyC = createCharacter({
      id: "enemyC",
      faction: "enemy",
      position: { q: -4, r: 0 },
    });
    // Additional enemies near B but not near A
    const enemyD = createCharacter({
      id: "enemyD",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    const enemyE = createCharacter({
      id: "enemyE",
      faction: "enemy",
      position: { q: 1, r: 1 },
    });

    const allCharacters = [evaluator, enemyA, enemyB, enemyC, enemyD, enemyE];

    const result = evaluateTargetCriterion(
      "enemy",
      MOST_ENEMIES_NEARBY,
      evaluator,
      allCharacters,
    );

    expect(result).toBe(enemyB);
  });

  it("tiebreaks by position (lower R then lower Q)", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    // Enemy A at (1, -1) - R=-1. B at distance 2 = 1 nearby
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 1, r: -1 },
    });
    // Enemy B at (-1, 1) - R=1. A at distance 2 = 1 nearby
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: -1, r: 1 },
    });

    const allCharacters = [evaluator, enemyA, enemyB];

    // Both have count 1. Tiebreak: lower R wins. A has R=-1, B has R=1 -> A wins
    const result = evaluateTargetCriterion(
      "enemy",
      MOST_ENEMIES_NEARBY,
      evaluator,
      allCharacters,
    );

    expect(result).toBe(enemyA);
  });

  it("returns first by tiebreak when all counts are equal", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    // All far apart (> 2 hexes from each other), each has 0 nearby enemies
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 0, r: -3 },
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: 3, r: 0 },
    });
    const enemyC = createCharacter({
      id: "enemyC",
      faction: "enemy",
      position: { q: -3, r: 3 },
    });

    const allCharacters = [evaluator, enemyA, enemyB, enemyC];

    // All have count 0. Tiebreak: A has R=-3 (lowest) -> A wins
    const result = evaluateTargetCriterion(
      "enemy",
      MOST_ENEMIES_NEARBY,
      evaluator,
      allCharacters,
    );

    expect(result).toBe(enemyA);
  });

  it("operates on pre-narrowed candidate pool from filter", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    // A at (1,0) hp=100 - has many nearby but excluded by filter
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 100,
    });
    // B at (-4,0) hp=30 - passes filter, 0 nearby enemies
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: -4, r: 0 },
      hp: 30,
    });
    // C at (1,-1) hp=30 - passes filter, has 3 nearby (A, D, E within 2 hexes)
    const enemyC = createCharacter({
      id: "enemyC",
      faction: "enemy",
      position: { q: 1, r: -1 },
      hp: 30,
    });
    // D at (2,0) hp=100 - excluded by filter, but counts for nearby
    const enemyD = createCharacter({
      id: "enemyD",
      faction: "enemy",
      position: { q: 2, r: 0 },
      hp: 100,
    });
    // E at (1,1) hp=100 - excluded by filter, but counts for nearby
    const enemyE = createCharacter({
      id: "enemyE",
      faction: "enemy",
      position: { q: 1, r: 1 },
      hp: 100,
    });

    const allCharacters = [evaluator, enemyA, enemyB, enemyC, enemyD, enemyE];
    const candidateFilter = (c: { hp: number }) => c.hp < 50;

    // C has 3 nearby enemies (A, D, E all within 2 hexes), B has 0 -> C wins
    const result = evaluateTargetCriterion(
      "enemy",
      MOST_ENEMIES_NEARBY,
      evaluator,
      allCharacters,
      candidateFilter,
    );

    expect(result).toBe(enemyC);
  });

  it("self-excludes candidate from own nearby count (enemy target)", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    // 3 enemies in a cluster, all within 1 hex of each other
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    const enemyC = createCharacter({
      id: "enemyC",
      faction: "enemy",
      position: { q: 1, r: 1 },
    });

    const allCharacters = [evaluator, enemyA, enemyB, enemyC];

    // Each has 2 nearby (excluding self). Tiebreak: A R=0, B R=0, C R=1
    // Between A and B: same R=0, A Q=1 < B Q=2 -> A wins
    const result = evaluateTargetCriterion(
      "enemy",
      MOST_ENEMIES_NEARBY,
      evaluator,
      allCharacters,
    );

    expect(result).toBe(enemyA);
  });

  it("counts enemies near ally candidates when targeting allies", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    // Ally A at (2,0) with 2 enemies nearby
    const allyA = createCharacter({
      id: "allyA",
      faction: "friendly",
      position: { q: 2, r: 0 },
    });
    // Ally B at (-2,0) with 0 enemies nearby
    const allyB = createCharacter({
      id: "allyB",
      faction: "friendly",
      position: { q: -2, r: 0 },
    });
    // Enemies near ally A
    const enemy1 = createCharacter({
      id: "enemy1",
      faction: "enemy",
      position: { q: 3, r: 0 },
    });
    const enemy2 = createCharacter({
      id: "enemy2",
      faction: "enemy",
      position: { q: 2, r: 1 },
    });

    const allCharacters = [evaluator, allyA, allyB, enemy1, enemy2];

    // Ally A has 2 enemies nearby, Ally B has 0 -> A wins
    const result = evaluateTargetCriterion(
      "ally",
      MOST_ENEMIES_NEARBY,
      evaluator,
      allCharacters,
    );

    expect(result).toBe(allyA);
  });

  it("returns the only candidate when there is exactly one", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const singleEnemy = createCharacter({
      id: "singleEnemy",
      faction: "enemy",
      position: { q: 3, r: 0 },
    });

    const allCharacters = [evaluator, singleEnemy];

    const result = evaluateTargetCriterion(
      "enemy",
      MOST_ENEMIES_NEARBY,
      evaluator,
      allCharacters,
    );

    expect(result).toBe(singleEnemy);
  });

  it("returns null when no valid candidates exist", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });

    const result = evaluateTargetCriterion(
      "enemy",
      MOST_ENEMIES_NEARBY,
      evaluator,
      [evaluator],
    );

    expect(result).toBeNull();
  });
});
