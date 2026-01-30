/**
 * Constants and default values for gameStore.
 * Extracted from gameStore.ts to reduce file size.
 */

import type { Skill } from "../engine/types";
import { getDefaultSkills } from "../engine/skill-registry";

/**
 * Grid size (12×12 grid).
 */
export const GRID_SIZE = 12;

/**
 * Helper function to create consistent position keys for game state.
 * Uses hyphen format: "x-y"
 * NOTE: This differs from pathfinding.positionKey which uses "x,y" format.
 * Keep these separate - they serve different modules and should not be mixed.
 */
export const positionKey = (x: number, y: number): string => `${x}-${y}`;

/**
 * Counter for generating unique character IDs.
 * Format: ${faction}-${timestamp}-${counter}
 */
let characterIdCounter = 0;

/**
 * Get and increment the character ID counter.
 */
export function getNextCharacterIdCounter(): number {
  return characterIdCounter++;
}

/**
 * Default skills assigned to newly added characters.
 * Derived from the centralized skill registry.
 */
export const DEFAULT_SKILLS: Skill[] = getDefaultSkills();

/**
 * Initial game state for reset.
 */
export const initialGameState = {
  characters: [],
  tick: 0,
  phase: "decision" as const,
  battleStatus: "active" as const,
  history: [],
  seed: 0,
  rngState: 0,
};
