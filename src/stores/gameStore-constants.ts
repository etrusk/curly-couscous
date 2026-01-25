/**
 * Constants and default values for gameStore.
 * Extracted from gameStore.ts to reduce file size.
 */

import type { Skill } from "../engine/types";

/**
 * Grid size (12×12 grid).
 */
export const GRID_SIZE = 12;

/**
 * Helper function to create consistent position keys.
 * Uses hyphen format: "x-y"
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
 */
export const DEFAULT_SKILLS: Skill[] = [
  {
    id: "light-punch",
    name: "Light Punch",
    tickCost: 1,
    range: 1,
    damage: 10,
    enabled: true,
    triggers: [{ type: "always" }],
    selectorOverride: { type: "nearest_enemy" },
  },
  {
    id: "heavy-punch",
    name: "Heavy Punch",
    tickCost: 2,
    range: 2,
    damage: 25,
    enabled: true,
    triggers: [{ type: "always" }],
    selectorOverride: { type: "nearest_enemy" },
  },
  {
    id: "move-towards",
    name: "Move Towards",
    tickCost: 1,
    range: 1,
    mode: "towards",
    enabled: true,
    triggers: [{ type: "always" }],
    selectorOverride: { type: "nearest_enemy" },
  },
];

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
