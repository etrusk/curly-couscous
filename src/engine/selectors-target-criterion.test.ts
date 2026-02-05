/**
 * Tests for target+criterion combinations in evaluateTargetCriterion.
 * Validates all 12 combinations (3 targets x 4 criteria) and special cases.
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateTargetCriterion - target+criterion combinations", () => {
  it("should handle all 12 target+criterion combinations correctly", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
      hp: 100,
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 0, r: 1 },
      hp: 60,
    });
    const enemyNear = createCharacter({
      id: "enemyNear",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
    });
    const enemyFar = createCharacter({
      id: "enemyFar",
      faction: "enemy",
      position: { q: 3, r: 0 },
      hp: 40,
    });

    const allCharacters = [evaluator, ally, enemyNear, enemyFar];

    // Enemy combinations
    expect(
      evaluateTargetCriterion("enemy", "nearest", evaluator, allCharacters),
    ).toBe(enemyNear);
    expect(
      evaluateTargetCriterion("enemy", "furthest", evaluator, allCharacters),
    ).toBe(enemyFar);
    expect(
      evaluateTargetCriterion("enemy", "lowest_hp", evaluator, allCharacters),
    ).toBe(enemyFar); // hp 40
    expect(
      evaluateTargetCriterion("enemy", "highest_hp", evaluator, allCharacters),
    ).toBe(enemyNear); // hp 80

    // Ally combinations
    expect(
      evaluateTargetCriterion("ally", "nearest", evaluator, allCharacters),
    ).toBe(ally);
    expect(
      evaluateTargetCriterion("ally", "furthest", evaluator, allCharacters),
    ).toBe(ally); // only one ally
    expect(
      evaluateTargetCriterion("ally", "lowest_hp", evaluator, allCharacters),
    ).toBe(ally); // only one ally
    expect(
      evaluateTargetCriterion("ally", "highest_hp", evaluator, allCharacters),
    ).toBe(ally); // only one ally

    // Self combinations (criterion ignored)
    expect(
      evaluateTargetCriterion("self", "nearest", evaluator, allCharacters),
    ).toBe(evaluator);
    expect(
      evaluateTargetCriterion("self", "furthest", evaluator, allCharacters),
    ).toBe(evaluator);
    expect(
      evaluateTargetCriterion("self", "lowest_hp", evaluator, allCharacters),
    ).toBe(evaluator);
    expect(
      evaluateTargetCriterion("self", "highest_hp", evaluator, allCharacters),
    ).toBe(evaluator);
  });

  it("should ignore criterion when target is self", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
      hp: 50,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 1 },
      hp: 10, // lower hp, nearer
    });

    const allCharacters = [evaluator, enemy];

    // All criteria should return evaluator when target is self
    expect(
      evaluateTargetCriterion("self", "nearest", evaluator, allCharacters),
    ).toBe(evaluator);
    expect(
      evaluateTargetCriterion("self", "furthest", evaluator, allCharacters),
    ).toBe(evaluator);
    expect(
      evaluateTargetCriterion("self", "lowest_hp", evaluator, allCharacters),
    ).toBe(evaluator);
    expect(
      evaluateTargetCriterion("self", "highest_hp", evaluator, allCharacters),
    ).toBe(evaluator);
  });

  it("should return null when no valid candidates exist", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });

    const allCharacters = [evaluator];

    // No enemies exist
    expect(
      evaluateTargetCriterion("enemy", "nearest", evaluator, allCharacters),
    ).toBeNull();
    expect(
      evaluateTargetCriterion("enemy", "furthest", evaluator, allCharacters),
    ).toBeNull();
    expect(
      evaluateTargetCriterion("enemy", "lowest_hp", evaluator, allCharacters),
    ).toBeNull();
    expect(
      evaluateTargetCriterion("enemy", "highest_hp", evaluator, allCharacters),
    ).toBeNull();
  });
});
