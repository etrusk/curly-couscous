/**
 * Tests for the `ally_hp_below` trigger.
 * Follows test design document: .tdd/test-designs.md (Feature B3)
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import { createCharacter } from "./triggers-test-helpers";

describe("evaluateTrigger - ally_hp_below trigger", () => {
  it("should return true when ally HP below threshold", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100, // 100%
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 30,
      maxHp: 100, // 30%
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(true);
  });

  it("should return false when no ally below threshold", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100, // 100%
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 70,
      maxHp: 100, // 70%
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should exclude self from ally check", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 30,
      maxHp: 100, // 30% - below threshold but should be excluded
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 100,
      maxHp: 100, // 100%
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should return false at exact threshold", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 50,
      maxHp: 100, // Exactly 50%
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should return true when ally one percent below threshold", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 49,
      maxHp: 100, // 49%
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(true);
  });

  it("should return false when only evaluator alive (no allies)", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 30,
      maxHp: 100, // 30%
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should ignore dead allies", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const deadAlly = createCharacter({
      id: "dead",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 0, // Dead
      maxHp: 100,
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, deadAlly]);

    expect(result).toBe(false);
  });

  it("should ignore enemies", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 2 },
      hp: 10,
      maxHp: 100, // 10% - below threshold but wrong faction
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should handle threshold of 100%", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 99,
      maxHp: 100, // 99% - below 100%
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 100,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(true);
  });

  it("should return false for threshold of 0%", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 1,
      maxHp: 100, // 1% - cannot be below 0%
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 0,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should handle zero maxHp without throwing", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 0,
      maxHp: 0, // Division by zero guard
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should return true when any one of multiple allies is below threshold", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const allyA = createCharacter({
      id: "allyA",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 80,
      maxHp: 100, // 80% - above threshold
    });
    const allyB = createCharacter({
      id: "allyB",
      faction: "friendly",
      position: { q: 5, r: 2 },
      hp: 30,
      maxHp: 100, // 30% - below threshold
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      allyA,
      allyB,
    ]);

    expect(result).toBe(true);
  });
});
