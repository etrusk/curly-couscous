/**
 * Selector filter evaluation for conditional targeting.
 * Validates the selected target AFTER the selector picks it but BEFORE range check.
 */

import { SelectorFilter, Character } from "./types";

/**
 * Evaluate a selector filter against a target character.
 * Returns true if the target passes the filter, false if it should be rejected.
 */
export function evaluateSelectorFilter(
  filter: SelectorFilter,
  target: Character,
): boolean {
  switch (filter.type) {
    case "hp_below":
      return (
        target.maxHp > 0 && (target.hp / target.maxHp) * 100 < filter.value
      );
    case "hp_above":
      return (
        target.maxHp > 0 && (target.hp / target.maxHp) * 100 > filter.value
      );
    default: {
      const _exhaustive: never = filter.type;
      return _exhaustive;
    }
  }
}
