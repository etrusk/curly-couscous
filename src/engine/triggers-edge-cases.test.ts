/**
 * Tests for edge cases and dead character handling in trigger evaluation.
 * Follows test design document: docs/test-design-trigger-evaluation.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import { createCharacter, createAction } from "./triggers-test-helpers";

describe("evaluateTrigger - scope ally pool excludes self and enemies", () => {
  it("should return false when only dead ally and enemy present", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 30,
      maxHp: 100,
    });
    const deadAlly = createCharacter({
      id: "dead-ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 0,
      maxHp: 100,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 2 },
      hp: 30,
      maxHp: 100,
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      deadAlly,
      enemy,
    ]);

    expect(result).toBe(false);
  });
});

describe("evaluateTrigger - unified in_range with ally scope", () => {
  it("should return true when ally is within range", () => {
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
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(true);
  });
});

describe("evaluateTrigger - unified hp_below with ally scope", () => {
  it("should check ally pool members, not self", () => {
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
});

describe("evaluateTrigger - edge cases", () => {
  it("should handle empty allCharacters array for range triggers", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "in_range",
      conditionValue: 3,
    };

    const result = evaluateTrigger(trigger, evaluator, []);

    expect(result).toBe(false);
  });

  it("should handle evaluator as only character", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });

    const enemyRangeTrigger: Trigger = {
      scope: "enemy",
      condition: "in_range",
      conditionValue: 5,
    };
    const allyRangeTrigger: Trigger = {
      scope: "ally",
      condition: "in_range",
      conditionValue: 5,
    };

    const enemyResult = evaluateTrigger(enemyRangeTrigger, evaluator, [
      evaluator,
    ]);
    const allyResult = evaluateTrigger(allyRangeTrigger, evaluator, [
      evaluator,
    ]);

    expect(enemyResult).toBe(false);
    expect(allyResult).toBe(false);
  });

  it("should handle evaluator as only character with hp_below", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 30,
      maxHp: 100,
    });
    const trigger: Trigger = {
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });
});

describe("evaluateTrigger - dead character handling", () => {
  it("should ignore dead enemies in range calculations", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const deadEnemy = createCharacter({
      id: "deadEnemy",
      faction: "enemy",
      position: { q: 2, r: 3 }, // hex dist=2
      hp: 0,
    });
    const liveEnemy = createCharacter({
      id: "liveEnemy",
      faction: "enemy",
      position: { q: -2, r: 0 }, // hex dist=7 (out of range 3)
      hp: 50,
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "in_range",
      conditionValue: 3,
    };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      deadEnemy,
      liveEnemy,
    ]);

    expect(result).toBe(false);
  });

  it("should ignore dead allies in range calculations", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const deadAlly = createCharacter({
      id: "deadAlly",
      faction: "friendly",
      position: { q: 2, r: 3 }, // hex dist=2
      hp: 0,
    });
    const trigger: Trigger = {
      scope: "ally",
      condition: "in_range",
      conditionValue: 3,
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, deadAlly]);

    expect(result).toBe(false);
  });

  it("should ignore actions from dead enemies", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const deadEnemy = createCharacter({
      id: "deadEnemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      hp: 0,
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, deadEnemy]);

    expect(result).toBe(false);
  });
});
