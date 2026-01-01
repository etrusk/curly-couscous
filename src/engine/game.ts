/**
 * Core game loop and tick processing.
 * Implements snapshot→decisions→outcomes→apply flow for deterministic gameplay.
 */

import { GameState, Character, Action, GameEvent, BattleStatus } from './types';
import { resolveCombat } from './combat';
import { resolveMovement } from './movement';

/**
 * Result of processing a single tick.
 */
export interface TickResult {
  state: GameState;
  events: GameEvent[];
}

/**
 * Decision represents a character's chosen action for the current tick.
 */
export interface Decision {
  characterId: string;
  action: Action;
}

/**
 * Process a single game tick using the snapshot→decisions→outcomes→apply flow.
 * 
 * Flow:
 * 1. Create immutable snapshot of current state
 * 2. Decision Phase: Compute decisions for idle characters
 * 3. Resolution Phase: Find actions resolving this tick
 * 4. Calculate outcomes (combat, then movement)
 * 5. Apply all mutations, check victory, return new state
 * 
 * @param state - Current game state
 * @returns TickResult with updated state and events
 */
export function processTick(state: GameState): TickResult {
  // 1. Create immutable snapshot (for future decision phase)
  // const snapshot = structuredClone(state) as Readonly<GameState>;
  
  // 2. Decision Phase: Compute decisions for idle characters
  // TODO: Implement computeDecisions() when decision logic is ready
  // const decisions = computeDecisions(snapshot);
  
  // 3. Resolution Phase: Find actions resolving this tick
  const events: GameEvent[] = [];
  
  // Add tick event
  events.push({
    type: 'tick',
    tick: state.tick,
    phase: 'resolution',
  });
  
  // 4. Calculate outcomes
  // 4a. Combat resolution (attacks resolve first)
  const combatResult = resolveCombat(state.characters, state.tick);
  events.push(...combatResult.events);
  
  // 4b. Movement resolution (using updated characters from combat)
  const movementResult = resolveMovement(
    combatResult.updatedCharacters,
    state.tick,
    state.rngState
  );
  events.push(...movementResult.events);
  
  // 5. Apply all mutations
  // Remove dead characters (HP <= 0)
  const aliveCharacters = movementResult.updatedCharacters.filter(c => c.hp > 0);
  
  // Check battle status
  const battleStatus = checkBattleStatus(aliveCharacters);
  
  // Create new state
  const newState: GameState = {
    ...state,
    characters: aliveCharacters,
    tick: state.tick + 1,
    battleStatus,
    history: [...state.history, ...events],
    rngState: movementResult.rngState,
  };
  
  return {
    state: newState,
    events,
  };
}

/**
 * Compute decisions for all idle characters.
 *
 * This will be implemented when the decision/AI system is ready.
 * For now, returns empty array as characters keep their existing actions.
 *
 * @param _state - Read-only snapshot of game state
 * @returns Array of decisions for idle characters
 */
export function computeDecisions(_state: Readonly<GameState>): Decision[] {
  // TODO: Implement decision logic
  // - Scan each character's skill list top-to-bottom
  // - Evaluate trigger conditions
  // - Select first valid skill
  // - Lock targeting to target's current cell
  // - Create Action with startedAtTick and resolvesAtTick
  return [];
}

/**
 * Check the battle status based on remaining characters.
 * 
 * Victory conditions:
 * - Victory: All enemies eliminated
 * - Defeat: All friendly characters eliminated
 * - Draw: Mutual elimination on same tick
 * - Active: Both factions still have characters alive
 * 
 * @param characters - Remaining alive characters
 * @returns Battle status
 */
export function checkBattleStatus(characters: Character[]): BattleStatus {
  const friendlyCount = characters.filter(c => c.faction === 'friendly').length;
  const enemyCount = characters.filter(c => c.faction === 'enemy').length;
  
  if (friendlyCount === 0 && enemyCount === 0) {
    return 'draw';
  }
  
  if (friendlyCount === 0) {
    return 'defeat';
  }
  
  if (enemyCount === 0) {
    return 'victory';
  }
  
  return 'active';
}
