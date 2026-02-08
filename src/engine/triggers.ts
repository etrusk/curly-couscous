/**
 * Trigger evaluation for skill activation conditions.
 * Pure TypeScript - no React dependencies.
 */

import {
  Trigger,
  Character,
  ConditionType,
  ConditionQualifier,
  hexDistance,
  positionsEqual,
} from "./types";

/**
 * Check if a channeling candidate matches an optional qualifier.
 * Extracted to reduce complexity of the main condition evaluator.
 */
function matchesChannelingQualifier(
  candidate: Character,
  qualifier: ConditionQualifier | undefined,
): boolean {
  if (candidate.currentAction === null) return false;
  if (!qualifier) return true;
  if (qualifier.type === "skill") {
    return candidate.currentAction.skill.id === qualifier.id;
  }
  if (qualifier.type === "action") {
    return candidate.currentAction.type === qualifier.id;
  }
  return true;
}

/**
 * Evaluates a single condition against a single candidate character.
 * This is the shared primitive used by both trigger evaluation (pool.some)
 * and filter evaluation (pool.filter).
 */
export function evaluateConditionForCandidate(
  condition: ConditionType,
  conditionValue: number | undefined,
  qualifier: ConditionQualifier | undefined,
  candidate: Character,
  evaluator: Character,
  allCharacters: Character[],
): boolean {
  const cv = conditionValue ?? 0;

  switch (condition) {
    case "always":
      return true;

    case "in_range":
      return hexDistance(candidate.position, evaluator.position) <= cv;

    case "hp_below":
      return candidate.maxHp > 0 && (candidate.hp / candidate.maxHp) * 100 < cv;

    case "hp_above":
      return candidate.maxHp > 0 && (candidate.hp / candidate.maxHp) * 100 > cv;

    case "targeting_me":
      return (
        candidate.currentAction !== null &&
        positionsEqual(candidate.currentAction.targetCell, evaluator.position)
      );

    case "targeting_ally":
      return (
        candidate.currentAction !== null &&
        allCharacters.some(
          (ally) =>
            ally.faction === evaluator.faction &&
            ally.id !== evaluator.id &&
            ally.hp > 0 &&
            positionsEqual(candidate.currentAction!.targetCell, ally.position),
        )
      );

    case "channeling":
      return matchesChannelingQualifier(candidate, qualifier);

    case "idle":
      return candidate.currentAction === null;

    default: {
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

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

  // 2. Evaluate condition against pool using shared evaluator
  let result: boolean;

  if (trigger.condition === "always") {
    result = true;
  } else {
    result = pool.some((c) =>
      evaluateConditionForCandidate(
        trigger.condition,
        trigger.conditionValue,
        trigger.qualifier,
        c,
        evaluator,
        allCharacters,
      ),
    );
  }

  // Apply negation if specified
  return trigger.negated ? !result : result;
}
