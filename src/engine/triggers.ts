/**
 * Trigger evaluation for skill activation conditions.
 * Pure TypeScript - no React dependencies.
 */

import { Trigger, Character, chebyshevDistance, positionsEqual } from './types';

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
  allCharacters: Character[]
): boolean {
  switch (trigger.type) {
    case 'always':
      return true;
    
    case 'enemy_in_range': {
      const range = trigger.value ?? 0;
      return allCharacters.some(c =>
        c.faction !== evaluator.faction &&
        c.hp > 0 &&
        chebyshevDistance(c.position, evaluator.position) <= range
      );
    }
    
    case 'ally_in_range': {
      const range = trigger.value ?? 0;
      return allCharacters.some(c =>
        c.faction === evaluator.faction &&
        c.id !== evaluator.id &&
        c.hp > 0 &&
        chebyshevDistance(c.position, evaluator.position) <= range
      );
    }
    
    case 'hp_below': {
      const thresholdPercent = trigger.value ?? 0;
      const currentPercent = (evaluator.hp / evaluator.maxHp) * 100;
      return currentPercent < thresholdPercent;
    }
    
    case 'my_cell_targeted_by_enemy': {
      return allCharacters.some(c =>
        c.faction !== evaluator.faction &&
        c.hp > 0 &&
        c.currentAction !== null &&
        c.currentAction.ticksRemaining > 0 &&
        positionsEqual(c.currentAction.targetCell, evaluator.position)
      );
    }
    
    default: {
      const _exhaustive: never = trigger.type;
      return _exhaustive; // Compile-time error if case missing
    }
  }
}
