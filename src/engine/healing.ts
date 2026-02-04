/**
 * Healing resolution logic for the auto-battler game engine.
 * Handles heal action resolution during the Resolution Phase.
 */

import { Character, HealEvent, positionsEqual } from "./types";

/**
 * Result of healing resolution containing updated state and events.
 */
export interface HealingResult {
  updatedCharacters: Character[];
  events: HealEvent[];
}

/**
 * Resolves all heal actions for the current tick.
 *
 * Resolution logic:
 * 1. Find all heal actions resolving this tick (resolvesAtTick === tick)
 * 2. Check if ANY ally is in the locked target cell (cell-based targeting)
 * 3. Apply healing capped at maxHp
 * 4. Generate HealEvent
 *
 * @param characters - All characters in the battle
 * @param tick - Current game tick
 * @returns HealingResult with updated characters and events
 */
export function resolveHealing(
  characters: Character[],
  tick: number,
): HealingResult {
  const events: HealEvent[] = [];

  // Create shallow copies for mutation
  const updatedCharacters = characters.map((c) => ({ ...c }));

  // Find all resolving heals, sorted by healer slotPosition for determinism
  const resolvingHeals = characters
    .filter(
      (c) =>
        c.currentAction?.type === "heal" &&
        c.currentAction.resolvesAtTick === tick,
    )
    .map((c) => ({ healer: c, action: c.currentAction! }))
    .sort((a, b) => a.healer.slotPosition - b.healer.slotPosition);

  for (const { healer, action } of resolvingHeals) {
    // Cell-based: find ANY character in target cell
    const target = updatedCharacters.find(
      (c) => positionsEqual(c.position, action.targetCell) && c.hp > 0,
    );

    if (!target) continue; // Miss: cell is empty or character dead

    const healing = action.skill.healing ?? 0;
    target.hp = Math.min(target.hp + healing, target.maxHp);

    events.push({
      type: "heal",
      tick,
      sourceId: healer.id,
      targetId: target.id,
      healing,
      resultingHp: target.hp,
    });
  }

  return { updatedCharacters, events };
}
