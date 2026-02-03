/**
 * Tests for edge cases and dead character handling in trigger evaluation.
 * Follows test design document: docs/test-design-trigger-evaluation.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import { createCharacter, createAction } from "./triggers-test-helpers";

describe("evaluateTrigger - edge cases", () => {
  it("should handle empty allCharacters array for range triggers", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, []);

    expect(result).toBe(false);
  });

  it("should handle evaluator as only character", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });

    const enemyRangeTrigger: Trigger = { type: "enemy_in_range", value: 5 };
    const allyRangeTrigger: Trigger = { type: "ally_in_range", value: 5 };

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
    const trigger: Trigger = { type: "hp_below", value: 50 };

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
      position: { x: 5, y: 6 }, // dist=1
      hp: 0,
    });
    const liveEnemy = createCharacter({
      id: "liveEnemy",
      faction: "enemy",
      position: { x: 10, y: 10 }, // dist=5
      hp: 50,
    });
    const trigger: Trigger = { type: "enemy_in_range", value: 3 };

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
      position: { x: 5, y: 6 }, // dist=1
      hp: 0,
    });
    const trigger: Trigger = { type: "ally_in_range", value: 3 };

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
      position: { x: 5, y: 6 },
      hp: 0,
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { type: "my_cell_targeted_by_enemy" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, deadEnemy]);

    expect(result).toBe(false);
  });
});
