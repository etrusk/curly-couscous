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

describe("evaluateTrigger - my_cell_targeted_by_enemy trigger", () => {
  it("should return true when enemy has locked-in action on evaluator cell", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 6 },
      currentAction: createAction({
        type: "attack",
        targetCell: { x: 5, y: 5 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { type: "my_cell_targeted_by_enemy" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return false when no actions target evaluator cell", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 6 },
      currentAction: createAction({
        type: "attack",
        targetCell: { x: 6, y: 6 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { type: "my_cell_targeted_by_enemy" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should return false when no characters have current actions", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 6 },
      currentAction: null,
    });
    const trigger: Trigger = { type: "my_cell_targeted_by_enemy" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should ignore allied actions targeting evaluator cell", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { x: 5, y: 6 },
      currentAction: createAction({
        type: "attack",
        targetCell: { x: 5, y: 5 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { type: "my_cell_targeted_by_enemy" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should return true if any enemy targets the cell", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { x: 5, y: 6 },
      currentAction: createAction({
        type: "attack",
        targetCell: { x: 6, y: 6 },
        resolvesAtTick: 1,
      }),
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { x: 5, y: 7 },
      currentAction: createAction({
        type: "attack",
        targetCell: { x: 5, y: 5 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { type: "my_cell_targeted_by_enemy" };

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
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 6 },
      currentAction: createAction({
        type: "attack",
        skill: createSkill({ id: "heavy-punch", tickCost: 2 }),
        targetCell: { x: 5, y: 5 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { type: "my_cell_targeted_by_enemy" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should detect multi-tick action with ticksRemaining > 1", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 6 },
      currentAction: createAction({
        type: "attack",
        skill: createSkill({ id: "heavy-punch", tickCost: 2 }),
        targetCell: { x: 5, y: 5 },
        resolvesAtTick: 2,
      }),
    });
    const trigger: Trigger = { type: "my_cell_targeted_by_enemy" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should return true when multiple enemies target evaluator cell", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemyA = createCharacter({
      id: "enemyA",
      faction: "enemy",
      position: { x: 5, y: 6 },
      currentAction: createAction({
        type: "attack",
        targetCell: { x: 5, y: 5 },
        resolvesAtTick: 1,
      }),
    });
    const enemyB = createCharacter({
      id: "enemyB",
      faction: "enemy",
      position: { x: 6, y: 5 },
      currentAction: createAction({
        type: "attack",
        targetCell: { x: 5, y: 5 },
        resolvesAtTick: 1,
      }),
    });
    const trigger: Trigger = { type: "my_cell_targeted_by_enemy" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      enemyA,
      enemyB,
    ]);

    expect(result).toBe(true);
  });

  // TODO: With absolute timing, same-tick actions should be invisible.
  // Currently the trigger detects them because it doesn't consider resolvesAtTick.
  // These tests document the current behavior, which may need updating.
  it("should detect same-tick attack (resolvesAtTick = 0) with current implementation", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 6 },
      currentAction: createAction({
        type: "attack",
        targetCell: { x: 5, y: 5 },
        resolvesAtTick: 0,
      }),
    });
    const trigger: Trigger = { type: "my_cell_targeted_by_enemy" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });

  it("should detect same-tick movement (resolvesAtTick = 0) with current implementation", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 6 },
      currentAction: createAction({
        type: "move",
        targetCell: { x: 5, y: 5 },
        resolvesAtTick: 0,
      }),
    });
    const trigger: Trigger = { type: "my_cell_targeted_by_enemy" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(true);
  });
});
