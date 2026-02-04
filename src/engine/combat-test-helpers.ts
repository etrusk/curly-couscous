/**
 * Shared test helpers for combat resolution tests.
 * Consolidates helper functions used across combat test files.
 */

import { Character, Action, Position } from "./types";
import {
  createCharacter as baseCreateCharacter,
  createSkill as baseCreateSkill,
  createMoveAction as baseCreateMoveAction,
} from "./game-test-helpers";

/**
 * Re-export existing helpers from game-test-helpers.
 */
export { baseCreateCharacter, baseCreateSkill, baseCreateMoveAction };

/**
 * Test helper to create attack actions with minimal boilerplate.
 * Uses absolute timing: resolvesAtTick matches the tick parameter.
 * Supports optional targetCharacter and damage.
 */
export function createAttackAction(
  targetCell: Position,
  targetCharacter: Character | null = null,
  damage: number | undefined = undefined,
  resolveTick: number = 1,
): Action {
  const tickCost = 1; // Default for test attacks
  return {
    type: "attack",
    skill: baseCreateSkill({ id: "test-attack", damage, tickCost }),
    targetCell,
    targetCharacter,
    startedAtTick: resolveTick - tickCost,
    resolvesAtTick: resolveTick,
  };
}

/**
 * Test helper to create idle actions.
 * Uses absolute timing: resolvesAtTick matches the tick parameter.
 */
export function createIdleAction(resolveTick: number = 1): Action {
  const tickCost = 1;
  return {
    type: "idle",
    skill: baseCreateSkill({ id: "idle", tickCost }),
    targetCell: { q: 0, r: 0 },
    targetCharacter: null,
    startedAtTick: resolveTick - tickCost,
    resolvesAtTick: resolveTick,
  };
}
