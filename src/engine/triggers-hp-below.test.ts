/**
 * Tests for the `hp_below` trigger.
 * Follows test design document: docs/test-design-trigger-evaluation.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import { createCharacter } from "./triggers-test-helpers";

describe("evaluateTrigger - hp_below trigger", () => {
  it("should return true when HP percentage is below threshold", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 30,
      maxHp: 100, // 30%
    });
    const trigger: Trigger = { type: "hp_below", value: 50 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });

  it("should return false when HP percentage is above threshold", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 70,
      maxHp: 100, // 70%
    });
    const trigger: Trigger = { type: "hp_below", value: 50 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(false);
  });

  it("should return false when HP percentage equals threshold exactly", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 50,
      maxHp: 100, // 50%
    });
    const trigger: Trigger = { type: "hp_below", value: 50 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(false);
  });

  it("should return true when HP is 1 below threshold", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 49,
      maxHp: 100, // 49%
    });
    const trigger: Trigger = { type: "hp_below", value: 50 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });

  it("should handle threshold of 100% correctly", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 99,
      maxHp: 100, // 99%
    });
    const trigger: Trigger = { type: "hp_below", value: 100 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });

  it("should return false for threshold 100% at full HP", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100, // 100%
    });
    const trigger: Trigger = { type: "hp_below", value: 100 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(false);
  });

  it("should handle near-death HP correctly", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 1,
      maxHp: 100, // 1%
    });
    const trigger: Trigger = { type: "hp_below", value: 2 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });

  it("should handle non-standard maxHP values", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 25,
      maxHp: 50, // 50%
    });
    const trigger: Trigger = { type: "hp_below", value: 60 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });

  it("should handle fractional HP percentages", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 33,
      maxHp: 100, // 33%
    });
    const trigger: Trigger = { type: "hp_below", value: 34 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });

  it("should return false for hp_below 0 threshold", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 1,
      maxHp: 100, // 1%
    });
    const trigger: Trigger = { type: "hp_below", value: 0 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(false);
  });

  it("should return false when maxHp is 0 (division by zero guard)", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 0,
      maxHp: 0,
    });
    const trigger: Trigger = { type: "hp_below", value: 50 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(false);
  });

  it("should return false when maxHp is negative (edge case guard)", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: -10,
      maxHp: -100,
    });
    const trigger: Trigger = { type: "hp_below", value: 50 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(false);
  });
});
