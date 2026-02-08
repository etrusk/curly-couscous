/**
 * Tests for the `channeling` condition in trigger context.
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

describe("evaluateTrigger - channeling condition", () => {
  it("should return true when enemy has a non-null currentAction", () => {
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
    const trigger: Trigger = { scope: "enemy", condition: "channeling" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return false when enemy has currentAction === null", () => {
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
    const trigger: Trigger = { scope: "enemy", condition: "channeling" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should ignore channeling ally when scope is enemy", () => {
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
    const trigger: Trigger = { scope: "enemy", condition: "channeling" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should return true with ally scope when ally has currentAction", () => {
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
        type: "heal",
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 2,
      }),
    });
    const trigger: Trigger = { scope: "ally", condition: "channeling" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(true);
  });

  it("should return false with ally scope when ally is idle", () => {
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
    const trigger: Trigger = { scope: "ally", condition: "channeling" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should exclude evaluator from ally pool", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 0, r: 0 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "ally", condition: "channeling" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(false);
  });

  it("should match skill qualifier when enemy channels the specified skill", () => {
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
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25 }),
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 2,
      }),
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "channeling",
      qualifier: { type: "skill", id: "heal" },
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should reject skill qualifier when enemy channels a different skill", () => {
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
        skill: createSkill({ id: "heavy-punch", damage: 25 }),
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 2,
      }),
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "channeling",
      qualifier: { type: "skill", id: "heal" },
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should match action type qualifier when enemy channels an attack", () => {
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
      qualifier: { type: "action", id: "attack" },
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should reject action type qualifier when enemy channels a heal", () => {
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
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25 }),
        targetCell: { q: 0, r: 0 },
        resolvesAtTick: 2,
      }),
    });
    const trigger: Trigger = {
      scope: "enemy",
      condition: "channeling",
      qualifier: { type: "action", id: "attack" },
    };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should return true when at least one of multiple enemies is channeling", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { q: 2, r: 3 },
      currentAction: null,
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: 1, r: 4 },
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 0, r: 0 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "channeling" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      enemyA,
      enemyB,
    ]);

    expect(result).toBe(true);
  });

  it("should exclude dead enemy with currentAction from pool", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const deadEnemy = createCharacter({
      id: "dead",
      faction: "enemy",
      position: { q: 2, r: 3 },
      hp: 0,
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 0, r: 0 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "channeling" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, deadEnemy]);

    expect(result).toBe(false);
  });
});
