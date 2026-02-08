/**
 * Filter evaluation for pre-criterion candidate pool narrowing.
 * Uses the shared condition evaluator from triggers.ts.
 */

import { SkillFilter, Character } from "./types";
import { evaluateConditionForCandidate } from "./triggers";

/**
 * Evaluate a skill filter against a single candidate character.
 * Returns true if the candidate passes the filter, false if it should be excluded.
 */
export function evaluateFilterForCandidate(
  filter: SkillFilter,
  candidate: Character,
  evaluator: Character,
  allCharacters: Character[],
): boolean {
  const result = evaluateConditionForCandidate(
    filter.condition,
    filter.conditionValue,
    filter.qualifier,
    candidate,
    evaluator,
    allCharacters,
  );
  return filter.negated ? !result : result;
}
