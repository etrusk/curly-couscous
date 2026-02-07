/**
 * Healing resolution logic for the auto-battler game engine.
 * Handles heal action resolution during the Resolution Phase.
 */

import { Character, HealEvent, WhiffEvent, positionsEqual } from "./types";
import { getSkillDefinition } from "./skill-registry";

/**
 * Result of healing resolution containing updated state and events.
 */
export interface HealingResult {
  updatedCharacters: Character[];
  events: (HealEvent | WhiffEvent)[];
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
  const events: (HealEvent | WhiffEvent)[] = [];

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
    // Determine target based on targeting mode
    let target: Character | undefined;
    const skillDef = getSkillDefinition(action.skill.id);
    const targetingMode = skillDef?.targetingMode ?? "cell";

    if (targetingMode === "character" && action.targetCharacter) {
      // Character-targeted: find the stored target (by ID, in case reference is stale)
      target = updatedCharacters.find(
        (c) => c.id === action.targetCharacter!.id && c.hp > 0,
      );
    } else {
      // Cell-targeted: find ANY character in target cell (existing behavior)
      target = updatedCharacters.find(
        (c) => positionsEqual(c.position, action.targetCell) && c.hp > 0,
      );
    }

    if (!target) {
      events.push({
        type: "whiff",
        tick,
        sourceId: healer.id,
        actionType: "heal",
        targetCell: action.targetCell,
      });
      continue; // Miss: target not found or dead
    }

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
