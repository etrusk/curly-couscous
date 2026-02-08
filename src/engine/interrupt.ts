/**
 * Interrupt resolution logic for the auto-battler game engine.
 * Handles interrupt action resolution during the Resolution Phase.
 * Interrupts cancel the target's currentAction if they are channeling.
 */

import {
  Character,
  InterruptEvent,
  InterruptMissEvent,
  positionsEqual,
} from "./types";

/**
 * Result of interrupt resolution containing updated state and events.
 */
export interface InterruptResult {
  updatedCharacters: Character[];
  events: (InterruptEvent | InterruptMissEvent)[];
}

/**
 * Resolves all interrupt actions for the current tick.
 *
 * Resolution logic:
 * 1. Find all interrupt actions resolving this tick (resolvesAtTick === tick)
 * 2. Sort by slotPosition for deterministic ordering
 * 3. For each interrupt:
 *    - Find target at targetCell
 *    - If target found and has currentAction: cancel it, emit InterruptEvent
 *    - If target found but idle: emit InterruptMissEvent (target_idle)
 *    - If no target at cell: emit InterruptMissEvent (empty_cell)
 *
 * @param characters - All characters in the battle
 * @param tick - Current game tick
 * @returns InterruptResult with updated characters and events
 */
export function resolveInterrupts(
  characters: Character[],
  tick: number,
): InterruptResult {
  const events: (InterruptEvent | InterruptMissEvent)[] = [];

  // Create shallow copies for mutation
  const updatedCharacters = characters.map((c) => ({ ...c }));

  // Find all resolving interrupts, sorted by slotPosition for determinism
  const resolvingInterrupts = characters
    .filter(
      (c) =>
        c.currentAction?.type === "interrupt" &&
        c.currentAction.resolvesAtTick === tick,
    )
    .map((c) => ({ interrupter: c, action: c.currentAction! }))
    .sort((a, b) => a.interrupter.slotPosition - b.interrupter.slotPosition);

  for (const { interrupter, action } of resolvingInterrupts) {
    // Find target at the locked targetCell (using mutable copies for sequential visibility)
    const target = updatedCharacters.find((c) =>
      positionsEqual(c.position, action.targetCell),
    );

    if (!target) {
      // No character at targeted cell
      events.push({
        type: "interrupt_miss",
        tick,
        sourceId: interrupter.id,
        targetCell: action.targetCell,
        reason: "empty_cell",
      });
      continue;
    }

    if (target.currentAction === null) {
      // Target is idle, nothing to cancel
      events.push({
        type: "interrupt_miss",
        tick,
        sourceId: interrupter.id,
        targetCell: action.targetCell,
        reason: "target_idle",
      });
      continue;
    }

    // Target has a pending action -- cancel it
    const cancelledSkillId = target.currentAction.skill.id;
    target.currentAction = null;

    events.push({
      type: "interrupt",
      tick,
      sourceId: interrupter.id,
      targetId: target.id,
      cancelledSkillId,
    });
  }

  return { updatedCharacters, events };
}
