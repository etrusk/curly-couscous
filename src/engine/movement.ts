/**
 * Movement collision resolution system.
 * Implements deterministic movement with seeded PRNG for collision resolution.
 * 
 * Design doc: docs/design-movement-collision.md
 */

import { Character, Position, MovementResult, MovementEvent, positionsEqual } from './types';

// ============================================================================
// RNG Functions
// ============================================================================

/**
 * Creates initial RNG state from seed.
 * Adds mixing to improve distribution for small sequential seeds.
 *
 * @param seed - Seed value (e.g., Date.now())
 * @returns Initial RNG state (unsigned 32-bit integer)
 */
export function initRNG(seed: number): number {
  // Add mixing to improve small seed distribution
  let state = seed >>> 0;
  state = (state ^ 0x9E3779B9) >>> 0; // Mix with golden ratio bits
  state = Math.imul(state ^ (state >>> 16), 0x21F0AAAD);
  state = Math.imul(state ^ (state >>> 15), 0x735A2D97);
  return (state ^ (state >>> 15)) >>> 0;
}

/**
 * Pure PRNG using mulberry32 algorithm.
 * Returns next random value in [0, 1) and the updated state.
 * 
 * @param state - Current RNG state (unsigned 32-bit integer)
 * @returns Object with value in [0, 1) and nextState
 */
export function nextRandom(state: number): { value: number; nextState: number } {
  let t = state >>> 0; // Ensure unsigned 32-bit
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const nextState = (t ^ (t >>> 14)) >>> 0;
  return {
    value: nextState / 4294967296, // Normalize to [0, 1)
    nextState,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a character is a blocker at a given position.
 *
 * Snapshot-based blocking: A character occupying position X blocks that position
 * for the entire tick, even if they're moving away. This prevents chain movement
 * exploits and matches the design spec: "decisions made against game state at tick start".
 *
 * @param character - Character to check
 * @param position - Position to check for blocking
 * @returns true if character blocks this position
 */
function isBlocker(character: Character, position: Position): boolean {
  // A character at a position always blocks that position (snapshot-based)
  return positionsEqual(character.position, position);
}

// ============================================================================
// Movement Resolution
// ============================================================================

/**
 * Resolves all movement actions for the current tick.
 * 
 * Handles the movement portion of Resolution Phase:
 * 1. Find all move actions ready to resolve (ticksRemaining === 1)
 * 2. Group movers by target cell
 * 3. Resolve each collision group:
 *    - Blocker present: all movers blocked
 *    - Single mover: move succeeds
 *    - Multiple movers: random winner selected
 * 4. Generate MovementEvent for each mover
 * 
 * @param characters - All characters in the battle
 * @param tick - Current game tick (for event timestamps)
 * @param rngState - Current RNG state for deterministic collision resolution
 * @returns MovementResult with updated characters, events, and new RNG state
 */
export function resolveMovement(
  characters: Character[],
  tick: number,
  rngState: number
): MovementResult {
  // 1. Find all resolving movers (excluding hold actions)
  const movers = characters.filter(c => {
    if (c.currentAction?.type !== 'move') return false;
    if (c.currentAction.ticksRemaining !== 1) return false;
    // Exclude hold actions (moving to current cell)
    if (positionsEqual(c.currentAction.targetCell, c.position)) return false;
    return true;
  });

  // Handle empty case
  if (movers.length === 0) {
    return {
      updatedCharacters: characters,
      events: [],
      rngState,
    };
  }

  // 2. Group movers by target cell
  const groups = new Map<string, Character[]>();
  for (const mover of movers) {
    const target = mover.currentAction!.targetCell;
    const key = `${target.x},${target.y}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(mover);
  }

  // 3. Sort groups by target position (Y then X) for determinism
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
    const [keyA, keyB] = [a[0], b[0]];
    const [axStr, ayStr] = keyA.split(',');
    const [bxStr, byStr] = keyB.split(',');
    const ax = parseInt(axStr, 10);
    const ay = parseInt(ayStr, 10);
    const bx = parseInt(bxStr, 10);
    const by = parseInt(byStr, 10);
    return ay !== by ? ay - by : ax - bx;
  });

  // 4. Resolve each collision group
  let currentRngState = rngState;
  const positionUpdates = new Map<string, Position>();
  const events: MovementEvent[] = [];

  for (const [, groupMovers] of sortedGroups) {
    const targetCell = groupMovers[0].currentAction!.targetCell;

    // Check for blockers at target
    const blockers = characters.filter(c => isBlocker(c, targetCell));

    if (blockers.length > 0) {
      // Blocker wins - all movers stay in place
      for (const mover of groupMovers) {
        events.push({
          type: 'movement',
          tick,
          characterId: mover.id,
          from: mover.position,
          to: mover.position,
          collided: true,
        });
      }
    } else if (groupMovers.length === 1) {
      // Single unobstructed mover
      const mover = groupMovers[0];
      positionUpdates.set(mover.id, targetCell);
      events.push({
        type: 'movement',
        tick,
        characterId: mover.id,
        from: mover.position,
        to: targetCell,
        collided: false,
      });
    } else {
      // Multiple movers competing - select random winner
      const { value, nextState } = nextRandom(currentRngState);
      currentRngState = nextState;
      const winnerIndex = Math.floor(value * groupMovers.length);
      const winner = groupMovers[winnerIndex];

      for (const mover of groupMovers) {
        if (mover.id === winner.id) {
          positionUpdates.set(mover.id, targetCell);
          events.push({
            type: 'movement',
            tick,
            characterId: mover.id,
            from: mover.position,
            to: targetCell,
            collided: false,
          });
        } else {
          events.push({
            type: 'movement',
            tick,
            characterId: mover.id,
            from: mover.position,
            to: mover.position,
            collided: true,
          });
        }
      }
    }
  }

  // 5. Apply position updates to characters
  const updatedCharacters = characters.map(c => {
    const newPosition = positionUpdates.get(c.id);
    if (newPosition) {
      return { ...c, position: newPosition };
    }
    return c;
  });

  return {
    updatedCharacters,
    events,
    rngState: currentRngState,
  };
}
