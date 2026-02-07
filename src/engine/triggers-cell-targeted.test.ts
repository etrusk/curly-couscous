/**
 * Tests for the `my_cell_targeted_by_enemy` trigger.
 * Follows test design document: docs/test-design-trigger-evaluation.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import {
  createCharacter,
  createAction,
  createSkill,
} from "./triggers-test-helpers";

describe("evaluateTrigger - targeting_me condition with enemy scope", () => {
  it("should detect enemy action targeting evaluator cell", () => {
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
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });
});

describe("evaluateTrigger - my_cell_targeted_by_enemy trigger", () => {
  it("should return true when enemy has locked-in action on evaluator cell", () => {
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
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return false when no actions target evaluator cell", () => {
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
        targetCell: { q: 3, r: 1 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should return false when no characters have current actions", () => {
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
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should ignore allied actions targeting evaluator cell", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 2, r: 3 },
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should return true if any enemy targets the cell", () => {
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
        targetCell: { q: 3, r: 1 },
        resolvesAtTick: 1,
      }),
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: 1, r: 4 },
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      enemyA,
      enemyB,
    ]);

    expect(result).toBe(true);
  });

  it("should detect multi-tick action with ticksRemaining=1 (last chance to dodge)", () => {
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
        skill: createSkill({ id: "heavy-punch", tickCost: 2 }),
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should detect multi-tick action with ticksRemaining > 1", () => {
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
        skill: createSkill({ id: "heavy-punch", tickCost: 2 }),
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 2,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return true when multiple enemies target evaluator cell", () => {
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
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 1,
      }),
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { q: 3, r: -1 },
      currentAction: createAction({
        type: "attack",
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      enemyA,
      enemyB,
    ]);

    expect(result).toBe(true);
  });

  it("should detect tickCost-1 attack (resolvesAtTick = 1) with new timing", () => {
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
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should detect tickCost-1 movement (resolvesAtTick = 1) with new timing", () => {
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
        type: "move",
        targetCell: { q: 3, r: 2 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });
});
