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
      position: { q: 3, r: 2 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 4 }, // hex dist from (3,2) = 2
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return false when enemy is outside range", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: -2 }, // hex dist from (3,2) = 4
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should return true when enemy is exactly at range boundary", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 5 }, // hex dist from (3,2) = 3
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should use hex distance", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 3 }, // hex dist = 1
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 2 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return true if any enemy is in range", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 5, r: -2 }, // hex dist from (3,2) = 5
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: 2, r: 3 }, // hex dist from (3,2) = 1
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
      position: { q: 3, r: 2 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 2, r: 3 },
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should ignore allies when checking enemy range", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 2, r: 3 }, // hex dist from (3,2) = 1
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: -2 }, // hex dist from (3,2) = 5
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
      position: { q: 0, r: 0 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 0 }, // hex dist from (0,0) = 5
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 5 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return false at maximum grid distance when range insufficient", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 0 }, // dist=11
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 4 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });
});
