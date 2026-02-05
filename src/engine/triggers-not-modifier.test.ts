/**
 * Tests for the NOT modifier on triggers.
 * Follows test design document: .tdd/test-designs.md (Feature B2 - engine tests)
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import { createCharacter } from "./triggers-test-helpers";

describe("evaluateTrigger - NOT modifier", () => {
  it("should invert true to false", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const trigger: Trigger = { type: "always", negated: true };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(false);
  });

  it("should invert false to true", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 70,
      maxHp: 100, // 70% - not below 50%
    });
    const trigger: Trigger = { type: "hp_below", value: 50, negated: true };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });

  it("should work with parameterized trigger (enemy_in_range)", () => {
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
      position: { q: 4, r: 2 }, // Distance 1
      hp: 100,
      maxHp: 100,
    });
    const trigger: Trigger = {
      type: "enemy_in_range",
      value: 2,
      negated: true,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    // Enemy IS in range (dist=1 <= range=2), NOT inverts to false
    expect(result).toBe(false);
  });

  it("should work with enemy out of range (kiting use case)", () => {
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
      position: { q: 3, r: -3 }, // Distance 5
      hp: 100,
      maxHp: 100,
    });
    const trigger: Trigger = {
      type: "enemy_in_range",
      value: 2,
      negated: true,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    // Enemy is NOT in range (dist=5 > range=2), base is false, NOT inverts to true
    expect(result).toBe(true);
  });

  it("should treat undefined negated field as non-negated", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const trigger: Trigger = { type: "always" }; // No negated field

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });

  it("should treat explicit false negated as non-negated", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const trigger: Trigger = { type: "always", negated: false };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });

  it("should work with ally_hp_below trigger", () => {
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
      hp: 30,
      maxHp: 100, // 30% - below 50%
    });
    const trigger: Trigger = {
      type: "ally_hp_below",
      value: 50,
      negated: true,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    // Ally IS below threshold, base is true, NOT inverts to false
    expect(result).toBe(false);
  });

  it("should work with my_cell_targeted_by_enemy trigger", () => {
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
      hp: 100,
      maxHp: 100,
      currentAction: null, // Not targeting evaluator
    });
    const trigger: Trigger = {
      type: "my_cell_targeted_by_enemy",
      negated: true,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    // Cell is NOT targeted, base is false, NOT inverts to true
    expect(result).toBe(true);
  });
});
