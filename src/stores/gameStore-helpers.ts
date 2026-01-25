/**
 * Helper functions for gameStore.
 * Extracted from gameStore.ts to reduce file size.
 */

import type { Character, Position } from "../engine/types";
import { GRID_SIZE, positionKey } from "./gameStore-constants";

/**
 * Find the first unoccupied position on the grid (row-major order).
 * @param characters - Current characters on the grid
 * @returns Position if available, null if grid is full
 */
export function findNextAvailablePosition(
  characters: Character[],
): Position | null {
  const occupiedPositions = new Set(
    characters.map((c) => positionKey(c.position.x, c.position.y)),
  );

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const key = positionKey(x, y);
      if (!occupiedPositions.has(key)) {
        return { x, y };
      }
    }
  }

  return null; // Grid is full
}

/**
 * Calculate battle status for mid-battle/post-removal scenarios.
 * @param characters - Current characters
 * @returns Battle status
 */
export function calculateBattleStatus(
  characters: Character[],
): "active" | "victory" | "defeat" | "draw" {
  const hasFriendly = characters.some((c) => c.faction === "friendly");
  const hasEnemy = characters.some((c) => c.faction === "enemy");

  if (!hasFriendly && !hasEnemy) return "draw";
  if (!hasEnemy) return "victory";
  if (!hasFriendly) return "defeat";
  return "active";
}

/**
 * Calculate battle status for pre-battle setup (addCharacter).
 * Requires both factions for "active", otherwise "draw".
 * @param characters - Current characters
 * @returns Battle status
 */
export function calculatePreBattleStatus(
  characters: Character[],
): "active" | "draw" {
  const hasFriendly = characters.some((c) => c.faction === "friendly");
  const hasEnemy = characters.some((c) => c.faction === "enemy");

  return hasFriendly && hasEnemy ? "active" : "draw";
}
