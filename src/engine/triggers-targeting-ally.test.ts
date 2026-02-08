/**
 * Tests for the `targeting_ally` condition in trigger context.
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

describe("evaluateTrigger - targeting_ally condition", () => {
  it("should return true when enemy action targets a living ally cell", () => {
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
    const trigger: Trigger = { scope: "enemy", condition: "targeting_ally" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      ally,
      enemy,
    ]);

    expect(result).toBe(true);
  });

  it("should return false when enemy targets evaluator cell (not an ally)", () => {
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
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "targeting_ally" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should return false when enemy targets a dead ally cell", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const deadAlly = createCharacter({
      id: "dead-ally",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 0,
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
    const trigger: Trigger = { scope: "enemy", condition: "targeting_ally" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      deadAlly,
      enemy,
    ]);

    expect(result).toBe(false);
  });

  it("should return true when at least one of multiple enemies targets an ally", () => {
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
        type: "attack",
        targetCell: { q: 4, r: 2 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "targeting_ally" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      ally,
      enemyA,
      enemyB,
    ]);

    expect(result).toBe(true);
  });

  it("should return false when all enemies are idle", () => {
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
    const trigger: Trigger = { scope: "enemy", condition: "targeting_ally" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      ally,
      enemy,
    ]);

    expect(result).toBe(false);
  });

  it("should return true with ally scope when ally targets another ally cell", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const allyA = createCharacter({
      id: "allyA",
      faction: "friendly",
      position: { q: 4, r: 2 },
      hp: 80,
    });
    const allyB = createCharacter({
      id: "allyB",
      faction: "friendly",
      position: { q: 5, r: 2 },
      currentAction: createAction({
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25 }),
        targetCell: { q: 4, r: 2 },
        resolvesAtTick: 2,
      }),
    });
    const trigger: Trigger = { scope: "ally", condition: "targeting_ally" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      allyA,
      allyB,
    ]);

    expect(result).toBe(true);
  });
});
