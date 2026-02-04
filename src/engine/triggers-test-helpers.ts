/**
 * Shared test helpers for trigger evaluation tests.
 * Consolidates helper functions used across trigger test files.
 */

import { Character, Skill, Action } from "./types";
import {
  createCharacter as baseCreateCharacter,
  createSkill as baseCreateSkill,
} from "./game-test-helpers";

/**
 * Re-export existing helpers from game-test-helpers.
 */
export { baseCreateCharacter, baseCreateSkill };

/**
 * Test helper to create characters with minimal boilerplate.
 * Alias for consistency with existing test code.
 */
export function createCharacter(
  overrides: Partial<Character> & { id: string },
): Character {
  return baseCreateCharacter(overrides);
}

/**
 * Test helper to create skills with minimal boilerplate.
 * Alias for consistency with existing test code.
 */
export function createSkill(overrides: Partial<Skill> & { id: string }): Skill {
  return baseCreateSkill(overrides);
}

/**
 * Test helper to create actions with minimal boilerplate.
 * This version matches the signature used in triggers.test.ts.
 */
export function createAction(overrides: Partial<Action>): Action {
  return {
    type: overrides.type ?? "attack",
    skill: overrides.skill ?? createSkill({ id: "test-skill" }),
    targetCell: overrides.targetCell ?? { q: 0, r: 0 },
    targetCharacter: overrides.targetCharacter ?? null,
    startedAtTick: overrides.startedAtTick ?? 0,
    resolvesAtTick: overrides.resolvesAtTick ?? 1,
  };
}
