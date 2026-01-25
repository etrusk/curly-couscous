/**
 * Tests for the `enemy_in_range` trigger.
 * Follows test design document: docs/test-design-trigger-evaluation.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import { createCharacter } from "./triggers-test-helpers";

describe("evaluateTrigger - enemy_in_range trigger", () => {
  it("should return true when enemy is within range", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 7 }, // dist=2
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return false when enemy is outside range", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 9 }, // dist=4
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should return true when enemy is exactly at range boundary", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 8 }, // dist=3
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should use Chebyshev distance (diagonal counts as 1)", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 7, y: 7 }, // dist=2 (diagonal)
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 2 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return true if any enemy is in range", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { x: 10, y: 10 }, // dist=5
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { x: 5, y: 6 }, // dist=1
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      enemyA,
      enemyB,
    ]);

    expect(result).toBe(true);
  });

  it("should return false when no enemies exist", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { x: 5, y: 6 },
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should ignore allies when checking enemy range", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { x: 5, y: 6 }, // dist=1
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 10, y: 10 }, // dist=5
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      ally,
      enemy,
    ]);

    expect(result).toBe(false);
  });

  it("should handle maximum grid distance", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 0, y: 0 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 11, y: 11 }, // dist=11
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 11 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return false at maximum grid distance when range insufficient", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 0, y: 0 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 11, y: 11 }, // dist=11
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 10 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });
});
