/**
 * Charge resolution logic for the auto-battler game engine.
 * Handles charge action resolution during the Resolution Phase.
 * Charge moves toward target up to N hexes, then attacks if adjacent.
 */

import {
  Character,
  ChargeEvent,
  DamageEvent,
  DeathEvent,
  Position,
  positionsEqual,
  hexDistance,
} from "./types";
import { getHexNeighbors } from "./hex";

/**
 * Result of charge resolution containing updated state and events.
 */
export interface ChargeResult {
  updatedCharacters: Character[];
  events: (ChargeEvent | DamageEvent | DeathEvent)[];
  rngState: number;
}

/**
 * Resolves all charge actions for the current tick.
 *
 * Resolution logic:
 * 1. Find all charge actions resolving this tick (resolvesAtTick === tick)
 * 2. Sort by slotPosition for deterministic ordering
 * 3. For each charger:
 *    a. Record pre-move position
 *    b. Move toward targetCell using computeMultiStepDestination
 *    c. If adjacent to a character at targetCell after movement, apply damage
 *    d. Emit ChargeEvent (always) and DamageEvent (if hit)
 * 4. Check for deaths after all charges processed
 *
 * @param characters - All characters in the battle
 * @param tick - Current game tick
 * @param rngState - Current RNG state (passed through unchanged)
 * @returns ChargeResult with updated characters, events, and rngState
 */
export function resolveCharges(
  characters: Character[],
  tick: number,
  rngState: number,
): ChargeResult {
  const events: (ChargeEvent | DamageEvent | DeathEvent)[] = [];

  // Create shallow copies for mutation
  const updatedCharacters = characters.map((c) => ({ ...c }));

  // Find all resolving charges, sorted by slotPosition for determinism
  const resolvingCharges = characters
    .filter(
      (c) =>
        c.currentAction?.type === "charge" &&
        c.currentAction.resolvesAtTick === tick,
    )
    .map((c) => ({ charger: c, action: c.currentAction! }))
    .sort((a, b) => a.charger.slotPosition - b.charger.slotPosition);

  for (const { charger, action } of resolvingCharges) {
    // Find the mutable copy of the charger
    const chargerCopy = updatedCharacters.find((c) => c.id === charger.id)!;
    const fromPosition = { ...chargerCopy.position };

    // Move phase: step-by-step movement toward target cell
    const distance = action.skill.distance ?? 1;
    const destination = computeChargeDestination(
      chargerCopy,
      action.targetCell,
      updatedCharacters,
      distance,
    );

    // Update charger position
    chargerCopy.position = destination;

    // Attack phase: check if any enemy at targetCell is adjacent after movement
    const targetAtCell = updatedCharacters.find(
      (c) =>
        c.id !== chargerCopy.id &&
        positionsEqual(c.position, action.targetCell) &&
        c.hp > 0,
    );

    let hitTarget: Character | undefined;
    if (
      targetAtCell &&
      hexDistance(chargerCopy.position, targetAtCell.position) <= 1
    ) {
      hitTarget = targetAtCell;
      const damage = action.skill.damage ?? 0;
      hitTarget.hp -= damage;

      events.push({
        type: "damage",
        tick,
        sourceId: charger.id,
        targetId: hitTarget.id,
        damage,
        resultingHp: hitTarget.hp,
      });
    }

    // Emit ChargeEvent (always)
    const chargeEvent: ChargeEvent = {
      type: "charge",
      tick,
      sourceId: charger.id,
      fromPosition,
      toPosition: { ...chargerCopy.position },
      ...(hitTarget
        ? {
            targetId: hitTarget.id,
            damage: action.skill.damage ?? 0,
            resultingHp: hitTarget.hp,
          }
        : {}),
    };
    events.push(chargeEvent);
  }

  // Check for deaths after all charges processed
  for (const character of updatedCharacters) {
    if (character.hp <= 0) {
      events.push({
        type: "death",
        tick,
        characterId: character.id,
      });
    }
  }

  return { updatedCharacters, events, rngState };
}

/**
 * Compute charge movement destination step by step.
 * Uses computeMoveDestination for each step, stopping before occupied cells.
 * Unlike regular multi-step movement, charge does NOT exclude the target from
 * the obstacle set, so the charger stops adjacent to the target rather than
 * landing on the target's cell.
 *
 * @param charger - The charging character
 * @param targetCell - The locked target cell position
 * @param allCharacters - All characters (for obstacle detection)
 * @param distance - Number of steps to take
 * @returns Final position after charge movement
 */
/**
 * Compute charge movement destination using greedy step-by-step approach.
 * Unlike regular A* movement, charge moves in a straight line toward the
 * target cell and stops when blocked. It does not route around obstacles.
 *
 * At each step:
 * 1. Find all unoccupied hex neighbors
 * 2. Select the one that minimizes hex distance to targetCell
 * 3. If no neighbor reduces distance, or all are occupied, stop
 *
 * The charger stops adjacent to the target cell if occupied by a character.
 */
function computeChargeDestination(
  charger: Character,
  targetCell: Position,
  allCharacters: Character[],
  distance: number,
): Position {
  let currentPosition = charger.position;

  for (let step = 0; step < distance; step++) {
    // Already at or past target cell
    if (positionsEqual(currentPosition, targetCell)) {
      break;
    }

    const neighbors = getHexNeighbors(currentPosition);

    // Filter to unoccupied neighbors (not occupied by any other character)
    const validNeighbors = neighbors.filter((pos) => {
      return !allCharacters.some(
        (c) => c.id !== charger.id && positionsEqual(c.position, pos),
      );
    });

    if (validNeighbors.length === 0) {
      break; // Fully surrounded, can't move
    }

    // Find the neighbor that minimizes distance to target cell
    const currentDist = hexDistance(currentPosition, targetCell);
    let bestNeighbor: Position | null = null;
    let bestDist = currentDist;

    for (const neighbor of validNeighbors) {
      const dist = hexDistance(neighbor, targetCell);
      if (dist < bestDist) {
        bestDist = dist;
        bestNeighbor = neighbor;
      } else if (dist === bestDist && bestNeighbor !== null) {
        // Tiebreak: lower r, then lower q (for determinism)
        if (
          neighbor.r < bestNeighbor.r ||
          (neighbor.r === bestNeighbor.r && neighbor.q < bestNeighbor.q)
        ) {
          bestNeighbor = neighbor;
        }
      } else if (dist === bestDist && bestNeighbor === null) {
        // No progress possible, but save as candidate in case it's the only option
        // Actually if dist === currentDist and no bestNeighbor, don't move
      }
    }

    if (!bestNeighbor) {
      break; // Can't get closer
    }

    currentPosition = bestNeighbor;
  }

  return currentPosition;
}
