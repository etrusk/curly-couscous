/**
 * Constants and default values for gameStore.
 * Extracted from gameStore.ts to reduce file size.
 */

import type { Skill } from "../engine/types";
import { getDefaultSkills } from "../engine/skill-registry";

/**
 * Hex grid radius (hexagon-shaped map with 91 total hexes).
 */
export const HEX_RADIUS = 5;

/**
 * Maximum number of skill slots per character.
 * Currently fixed at 3 (includes innate skills).
 * Future: Will be upgraded to per-character property when unlock mechanics are added.
 */
export const MAX_SKILL_SLOTS = 3;

/**
 * Maximum number of Move skill instances per character.
 * Prevents unbounded duplication while allowing HP-conditional movement strategies.
 */
export const MAX_MOVE_INSTANCES = 3;

/**
 * Helper function to create consistent position keys for game state.
 * Uses hyphen format: "q-r"
 * NOTE: This differs from pathfinding.positionKey which uses "q,r" format.
 * Keep these separate - they serve different modules and should not be mixed.
 */
export const positionKey = (q: number, r: number): string => `${q}-${r}`;

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
