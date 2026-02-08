/**
 * Tests for the NOT modifier on triggers.
 * Follows test design document: .tdd/test-designs.md (Feature B2 - engine tests)
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import { createCharacter, createAction } from "./triggers-test-helpers";

describe("evaluateTrigger - NOT modifier", () => {
  it("should invert true to false", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 100,
      maxHp: 100,
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "always",
      negated: true,
    };

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
    const trigger: Trigger = {
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
      negated: true,
    };

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
      scope: "enemy",
      condition: "in_range",
      conditionValue: 2,
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
      scope: "enemy",
      condition: "in_range",
      conditionValue: 2,
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
    const trigger: Trigger = { scope: "enemy", condition: "always" }; // No negated field

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
    const trigger: Trigger = {
      scope: "enemy",
      condition: "always",
      negated: false,
    };

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
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
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
      scope: "enemy",
      condition: "targeting_me",
      negated: true,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    // Cell is NOT targeted, base is false, NOT inverts to true
    expect(result).toBe(true);
  });

  it("should work with hp_above condition", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
      hp: 70,
      maxHp: 100, // 70% - IS above 50%
    });
    const trigger: Trigger = {
      scope: "self",
      condition: "hp_above",
      conditionValue: 50,
      negated: true,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    // hp IS above 50%, negated inverts to false
    expect(result).toBe(false);
  });

  it("should work with in_range condition under ally scope", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 }, // Distance 1
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "in_range",
      conditionValue: 2,
      negated: true,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    // Ally IS in range, negated inverts to false
    expect(result).toBe(false);
  });
});

describe("evaluateTrigger - NOT modifier for new conditions", () => {
  it("should return true for negated channeling when no enemy is channeling", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      currentAction: null,
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "channeling",
      negated: true,
    };
    expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(true);
  });

  it("should return false for negated channeling when enemy is channeling", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 0, r: 0 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "channeling",
      negated: true,
    };
    expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(false);
  });

  it("should return true for negated idle when all enemies are channeling", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 0, r: 0 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "idle",
      negated: true,
    };
    expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(true);
  });

  it("should return false for negated idle when enemy is idle", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      currentAction: null,
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "idle",
      negated: true,
    };
    expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(false);
  });

  it("should return true for negated targeting_ally when no enemy targets an ally", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      currentAction: null,
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "targeting_ally",
      negated: true,
    };
    expect(evaluateTrigger(trigger, evaluator, [evaluator, ally, enemy])).toBe(
      true,
    );
  });

  it("should return false for negated targeting_ally when enemy targets an ally", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 80,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 4, r: 2 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "targeting_ally",
      negated: true,
    };
    expect(evaluateTrigger(trigger, evaluator, [evaluator, ally, enemy])).toBe(
      false,
    );
  });
});
