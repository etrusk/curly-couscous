/**
 * Combat resolution logic for the auto-battler game engine.
 * Handles attack resolution and damage application during the Resolution Phase.
 */

import { Character, DamageEvent, DeathEvent, positionsEqual } from "./types";

/**
 * Result of combat resolution containing updated state and events.
 */
export interface CombatResult {
  /** Characters with updated HP values after damage */
  updatedCharacters: Character[];
  /** Damage and death events generated during resolution */
  events: (DamageEvent | DeathEvent)[];
}

/**
 * Resolves all attack actions for the current tick.
 *
 * Handles the attack portion of Resolution Phase:
 * 1. For each attack action ready to resolve (resolvesAtTick === tick)
 * 2. Check if target is still in locked cell (hit/miss)
 * 3. Apply damage simultaneously
 * 4. Generate damage events and death events
 *
 * @param characters - All characters in the battle
 * @param tick - Current game tick (for event timestamps)
 * @returns CombatResult with updated characters and events
 *
 * @preconditions
 * - All characters have valid positions
 * - Attack actions have valid targetCell and targetCharacter
 * - Characters with HP <= 0 should have been removed in previous tick
 */
export function resolveCombat(
  characters: Character[],
  tick: number,
): CombatResult {
  const events: (DamageEvent | DeathEvent)[] = [];

  // Create shallow copies of characters for mutation
  const updatedCharacters = characters.map((c) => ({ ...c }));

  // 1. Find all resolving attacks, sorted by attacker slotPosition for determinism
  const resolvingAttacks = characters
    .filter(
      (c) =>
        c.currentAction?.type === "attack" &&
        c.currentAction.resolvesAtTick === tick,
    )
    .map((c) => ({ attacker: c, action: c.currentAction! }))
    .sort((a, b) => a.attacker.slotPosition - b.attacker.slotPosition);

  // 2. Calculate and apply damage (cell-only targeting)
  for (const { attacker, action } of resolvingAttacks) {
    // Cell-only: find ANY character in target cell
    const target = updatedCharacters.find((c) =>
      positionsEqual(c.position, action.targetCell),
    );

    if (!target) continue; // Miss: cell is empty

    const damage = action.skill.damage ?? 0;
    target.hp -= damage;

    events.push({
      type: "damage",
      tick,
      sourceId: attacker.id,
      targetId: target.id,
      damage,
      resultingHp: target.hp,
    });
  }

  // 3. Check for deaths (after all damage applied)
  for (const character of updatedCharacters) {
    if (character.hp <= 0) {
      events.push({
        type: "death",
        tick,
        characterId: character.id,
      });
    }
  }

  return { updatedCharacters, events };
}
