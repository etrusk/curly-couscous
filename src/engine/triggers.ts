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
  // 1. Determine character pool based on scope
  let pool: Character[];
  switch (trigger.scope) {
    case "enemy":
      pool = allCharacters.filter(
        (c) => c.faction !== evaluator.faction && c.hp > 0,
      );
      break;
    case "ally":
      pool = allCharacters.filter(
        (c) =>
          c.faction === evaluator.faction && c.id !== evaluator.id && c.hp > 0,
      );
      break;
    case "self":
      pool = [evaluator];
      break;
  }

  // 2. Evaluate condition against pool
  let result: boolean;
  const conditionValue = trigger.conditionValue ?? 0;

  switch (trigger.condition) {
    case "always":
      result = true;
      break;

    case "in_range":
      result = pool.some(
        (c) => hexDistance(c.position, evaluator.position) <= conditionValue,
      );
      break;

    case "hp_below":
      if (trigger.scope === "self") {
        // Guard against division by zero
        if (evaluator.maxHp <= 0) {
          result = false;
          break;
        }
        result = (evaluator.hp / evaluator.maxHp) * 100 < conditionValue;
      } else {
        result = pool.some(
          (c) => c.maxHp > 0 && (c.hp / c.maxHp) * 100 < conditionValue,
        );
      }
      break;

    case "hp_above":
      if (trigger.scope === "self") {
        if (evaluator.maxHp <= 0) {
          result = false;
          break;
        }
        result = (evaluator.hp / evaluator.maxHp) * 100 > conditionValue;
      } else {
        result = pool.some(
          (c) => c.maxHp > 0 && (c.hp / c.maxHp) * 100 > conditionValue,
        );
      }
      break;

    case "targeting_me":
      result = pool.some(
        (c) =>
          c.currentAction !== null &&
          positionsEqual(c.currentAction.targetCell, evaluator.position),
      );
      break;

    default: {
      const _exhaustive: never = trigger.condition;
      return _exhaustive; // Compile-time error if case missing
    }
  }

  // Apply negation if specified
  return trigger.negated ? !result : result;
}
