/**
 * Tests for the `idle` condition in trigger context.
 * Follows test design document: .tdd/test-designs.md (Phase 3)
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import {
  createCharacter,
  createAction,
  createSkill,
} from "./triggers-test-helpers";

describe("evaluateTrigger - idle condition", () => {
  it("should return true when enemy has currentAction === null", () => {
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
    const trigger: Trigger = { scope: "enemy", condition: "idle" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return false when enemy has currentAction !== null", () => {
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
    const trigger: Trigger = { scope: "enemy", condition: "idle" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should return true with ally scope when ally is idle", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      currentAction: null,
    });
    const trigger: Trigger = { scope: "ally", condition: "idle" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(true);
  });

  it("should return false with ally scope when ally is channeling", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 0, r: 0 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "ally", condition: "idle" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should return true when at least one of multiple enemies is idle", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 2, r: 3 },
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 0, r: 0 },
        resolvesAtTick: 1,
      }),
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: 1, r: 4 },
      currentAction: null,
    });
    const trigger: Trigger = { scope: "enemy", condition: "idle" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      enemyA,
      enemyB,
    ]);

    expect(result).toBe(true);
  });

  it("should return false when all enemies are channeling", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 2, r: 3 },
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 0, r: 0 },
        resolvesAtTick: 1,
      }),
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: 1, r: 4 },
      currentAction: createAction({
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25 }),
        targetCell: { q: 0, r: 0 },
        resolvesAtTick: 2,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "idle" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      enemyA,
      enemyB,
    ]);

    expect(result).toBe(false);
  });
});
