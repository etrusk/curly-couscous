/**
 * Shared test helpers for selector evaluation tests.
 * Consolidates helper functions used across selector test files.
 */

import { Character } from "./types";
import { createCharacter as baseCreateCharacter } from "./game-test-helpers";

/**
 * Re-export existing helper from game-test-helpers.
 */
export { baseCreateCharacter };

/**
 * Test helper to create characters with minimal boilerplate.
 * Alias for consistency with existing test code.
 */
export function createCharacter(
  overrides: Partial<Character> & { id: string },
): Character {
  return baseCreateCharacter(overrides);
}
