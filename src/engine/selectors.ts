/**
 * Selector evaluation for targeting logic.
 * Pure TypeScript - no React dependencies.
 */

import { Character, hexDistance, Position, Target, Criterion } from "./types";

/**
 * Legacy selector type for backward compatibility with old tests.
 * @deprecated Use Target and Criterion instead.
 */
type Selector = {
  type:
    | "nearest_enemy"
    | "nearest_ally"
    | "lowest_hp_enemy"
    | "lowest_hp_ally"
    | "self"
    | "furthest_enemy"
    | "furthest_ally"
    | "highest_hp_enemy"
    | "highest_hp_ally";
};

/**
 * Tie-breaking comparison: compares by R coordinate, then Q coordinate.
 * Returns negative if a should come before b, positive if b should come before a.
 */
function tieBreakCompare(a: Character, b: Character): number {
  if (a.position.r !== b.position.r) {
    return a.position.r - b.position.r; // Lower R wins
  }
  return a.position.q - b.position.q; // Lower Q wins
}

/**
 * Compares characters by distance from a position, then by position tie-break.
 */
function compareByDistanceThenPosition(
  a: Character,
  b: Character,
  from: Position,
): number {
  const distA = hexDistance(a.position, from);
  const distB = hexDistance(b.position, from);

  if (distA !== distB) {
    return distA - distB; // Closer wins (lower distance)
  }

  return tieBreakCompare(a, b);
}

/**
 * Compares characters by HP, then by position tie-break.
 */
function compareByHpThenPosition(a: Character, b: Character): number {
  if (a.hp !== b.hp) {
    return a.hp - b.hp; // Lower HP wins
  }

  return tieBreakCompare(a, b);
}

/**
 * Finds the minimum character from candidates using the comparison function.
 * Returns null if candidates array is empty.
 */
function findMinimum(
  candidates: Character[],
  compareFn: (a: Character, b: Character) => number,
): Character | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((min, candidate) =>
    compareFn(candidate, min) < 0 ? candidate : min,
  );
}

/**
 * Evaluates a selector to find a target character.
 * Implements spec Section 6.2 (Target Selectors).
 *
 * @param selector - The selector to evaluate
 * @param evaluator - The character performing the evaluation
 * @param allCharacters - All characters in the battle
 * @returns The selected character, or null if no valid target exists
 *
 * @preconditions
 * - Evaluator must be alive (HP > 0)
 * - Evaluator must exist in allCharacters array
 * - All characters must have valid positions
 */
export function evaluateSelector(
  selector: Selector,
  evaluator: Character,
  allCharacters: Character[],
): Character | null {
  switch (selector.type) {
    case "self":
      return evaluator;

    case "nearest_enemy":
      return findMinimum(
        allCharacters.filter(
          (c) => c.faction !== evaluator.faction && c.hp > 0,
        ),
        (a, b) => compareByDistanceThenPosition(a, b, evaluator.position),
      );

    case "nearest_ally":
      return findMinimum(
        allCharacters.filter(
          (c) =>
            c.faction === evaluator.faction &&
            c.id !== evaluator.id &&
            c.hp > 0,
        ),
        (a, b) => compareByDistanceThenPosition(a, b, evaluator.position),
      );

    case "lowest_hp_enemy":
      return findMinimum(
        allCharacters.filter(
          (c) => c.faction !== evaluator.faction && c.hp > 0,
        ),
        (a, b) => compareByHpThenPosition(a, b),
      );

    case "lowest_hp_ally":
      return findMinimum(
        allCharacters.filter(
          (c) =>
            c.faction === evaluator.faction &&
            c.id !== evaluator.id &&
            c.hp > 0,
        ),
        (a, b) => compareByHpThenPosition(a, b),
      );

    case "furthest_enemy":
      return findMinimum(
        allCharacters.filter(
          (c) => c.faction !== evaluator.faction && c.hp > 0,
        ),
        (a, b) => -compareByDistanceThenPosition(a, b, evaluator.position),
      );

    case "furthest_ally":
      return findMinimum(
        allCharacters.filter(
          (c) =>
            c.faction === evaluator.faction &&
            c.id !== evaluator.id &&
            c.hp > 0,
        ),
        (a, b) => -compareByDistanceThenPosition(a, b, evaluator.position),
      );

    case "highest_hp_enemy":
      return findMinimum(
        allCharacters.filter(
          (c) => c.faction !== evaluator.faction && c.hp > 0,
        ),
        (a, b) => -compareByHpThenPosition(a, b),
      );

    case "highest_hp_ally":
      return findMinimum(
        allCharacters.filter(
          (c) =>
            c.faction === evaluator.faction &&
            c.id !== evaluator.id &&
            c.hp > 0,
        ),
        (a, b) => -compareByHpThenPosition(a, b),
      );

    default: {
      const _exhaustive: never = selector.type;
      return _exhaustive; // Compile-time error if case missing
    }
  }
}

/**
 * Evaluates a target+criterion combination to find a target character.
 *
 * @param target - Target group (enemy, ally, or self)
 * @param criterion - Selection criterion (nearest, furthest, lowest_hp, highest_hp)
 * @param evaluator - The character performing the evaluation
 * @param allCharacters - All characters in the battle
 * @returns The selected character, or null if no valid target exists
 */
export function evaluateTargetCriterion(
  target: Target,
  criterion: Criterion,
  evaluator: Character,
  allCharacters: Character[],
): Character | null {
  // Self target always returns evaluator, ignoring criterion
  if (target === "self") {
    return evaluator;
  }

  // Filter candidates based on target type
  let candidates: Character[];
  if (target === "enemy") {
    candidates = allCharacters.filter(
      (c) => c.faction !== evaluator.faction && c.hp > 0,
    );
  } else {
    // ally
    candidates = allCharacters.filter(
      (c) =>
        c.faction === evaluator.faction && c.id !== evaluator.id && c.hp > 0,
    );
  }

  if (candidates.length === 0) return null;

  // Select based on criterion
  switch (criterion) {
    case "nearest":
      return findMinimum(candidates, (a, b) =>
        compareByDistanceThenPosition(a, b, evaluator.position),
      );

    case "furthest": {
      // Furthest = maximum distance
      // Need custom comparator because negating would invert tiebreaker too
      const furthest = findMinimum(candidates, (a, b) => {
        const distA = hexDistance(a.position, evaluator.position);
        const distB = hexDistance(b.position, evaluator.position);
        if (distA !== distB) {
          return distB - distA; // Greater distance wins (reverse of nearest)
        }
        return tieBreakCompare(a, b); // Same tiebreaker (lower R, then lower Q)
      });
      return furthest;
    }

    case "lowest_hp":
      return findMinimum(candidates, (a, b) => compareByHpThenPosition(a, b));

    case "highest_hp": {
      // Highest HP = maximum HP
      // Need custom comparator because negating would invert tiebreaker too
      const highest = findMinimum(candidates, (a, b) => {
        if (a.hp !== b.hp) {
          return b.hp - a.hp; // Greater HP wins (reverse of lowest_hp)
        }
        return tieBreakCompare(a, b); // Same tiebreaker (lower R, then lower Q)
      });
      return highest;
    }

    default: {
      const _exhaustive: never = criterion;
      return _exhaustive;
    }
  }
}
