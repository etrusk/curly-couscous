/**
 * Trigger evaluation for skill activation conditions.
 * Pure TypeScript - no React dependencies.
 */

import { Trigger, Character, hexDistance, positionsEqual } from "./types";

/**
 * Evaluates whether a single trigger condition is satisfied.
 *
 * @param trigger - The trigger to evaluate
 * @param evaluator - The character whose trigger is being evaluated
 * @param allCharacters - All characters in the battle (for range/targeting checks)
 * @returns true if the trigger condition is met, false otherwise
 *
 * @preconditions
 * - Evaluator must be alive (HP > 0)
 * - Evaluator must exist in allCharacters array
 * - All characters must have valid positions
 * - All characters occupy distinct cells (1 per cell)
 */
export function evaluateTrigger(
  trigger: Trigger,
  evaluator: Character,
  allCharacters: Character[],
): boolean {
  let result: boolean;

  switch (trigger.type) {
    case "always":
      result = true;
      break;

    case "enemy_in_range": {
      const range = trigger.value ?? 0;
      result = allCharacters.some(
        (c) =>
          c.faction !== evaluator.faction &&
          c.hp > 0 &&
          hexDistance(c.position, evaluator.position) <= range,
      );
      break;
    }

    case "ally_in_range": {
      const range = trigger.value ?? 0;
      result = allCharacters.some(
        (c) =>
          c.faction === evaluator.faction &&
          c.id !== evaluator.id &&
          c.hp > 0 &&
          hexDistance(c.position, evaluator.position) <= range,
      );
      break;
    }

    case "hp_below": {
      const thresholdPercent = trigger.value ?? 0;
      // Guard against division by zero; if maxHp <= 0, treat as undefined and return false
      if (evaluator.maxHp <= 0) {
        result = false;
        break;
      }
      const currentPercent = (evaluator.hp / evaluator.maxHp) * 100;
      result = currentPercent < thresholdPercent;
      break;
    }

    case "ally_hp_below": {
      const thresholdPercent = trigger.value ?? 0;
      result = allCharacters.some(
        (c) =>
          c.faction === evaluator.faction &&
          c.id !== evaluator.id &&
          c.hp > 0 &&
          c.maxHp > 0 &&
          (c.hp / c.maxHp) * 100 < thresholdPercent,
      );
      break;
    }

    case "my_cell_targeted_by_enemy": {
      // TODO: With absolute timing, this needs current tick to check if action is pending
      // Currently detects any enemy action targeting this cell, including same-tick actions.
      // According to design, same-tick actions (e.g., Light Punch) should be invisible.
      // For now, check if action exists and targets this cell.
      result = allCharacters.some(
        (c) =>
          c.faction !== evaluator.faction &&
          c.hp > 0 &&
          c.currentAction !== null &&
          positionsEqual(c.currentAction.targetCell, evaluator.position),
      );
      break;
    }

    default: {
      const _exhaustive: never = trigger.type;
      return _exhaustive; // Compile-time error if case missing
    }
  }

  // Apply negation if specified
  return trigger.negated ? !result : result;
}
