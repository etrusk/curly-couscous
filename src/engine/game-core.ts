/**
 * Core game loop and tick processing.
 * Implements snapshot→decisions→outcomes→apply flow for deterministic gameplay.
 */

import { GameState, Character, Action, GameEvent, BattleStatus } from "./types";
import { resolveCombat } from "./combat";
import { resolveHealing } from "./healing";
import { resolveMovement } from "./movement";
import { computeDecisions, Decision } from "./game-decisions";

/**
 * Result of processing a single tick.
 */
export interface TickResult {
  state: GameState;
  events: GameEvent[];
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
  const events: GameEvent[] = [];
  let characters = state.characters;

  // 1. Decision Phase: Compute decisions for idle characters
  const decisions = computeDecisions(state);

  // 2. Apply decisions → set currentAction
  characters = applyDecisions(characters, decisions);

  // 3. Resolution Phase: Find actions resolving this tick
  events.push({
    type: "tick",
    tick: state.tick,
    phase: "resolution",
  });

  // 4. Calculate outcomes
  // 4a. Healing resolution (heals resolve before combat)
  const healingResult = resolveHealing(characters, state.tick);
  characters = healingResult.updatedCharacters;
  events.push(...healingResult.events);

  // 4b. Combat resolution (attacks resolve after heals)
  const combatResult = resolveCombat(characters, state.tick);
  characters = combatResult.updatedCharacters;
  events.push(...combatResult.events);

  // 4c. Movement resolution (using updated characters from combat)
  const movementResult = resolveMovement(
    characters,
    state.tick,
    state.rngState,
  );
  characters = movementResult.updatedCharacters;
  events.push(...movementResult.events);

  // 5. Clear resolved actions
  characters = clearResolvedActions(characters, state.tick);

  // 6. Apply all mutations
  // Remove dead characters (HP <= 0)
  const aliveCharacters = characters.filter((c) => c.hp > 0);

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
  const friendlyCount = characters.filter(
    (c) => c.faction === "friendly",
  ).length;
  const enemyCount = characters.filter((c) => c.faction === "enemy").length;

  if (friendlyCount === 0 && enemyCount === 0) {
    return "draw";
  }

  if (friendlyCount === 0) {
    return "defeat";
  }

  if (enemyCount === 0) {
    return "victory";
  }

  return "active";
}

/**
 * Apply decisions to characters by setting their currentAction.
 *
 * @param characters - Characters to update
 * @param decisions - Decisions to apply
 * @returns New array with updated characters (immutable)
 */
export function applyDecisions(
  characters: Character[],
  decisions: Decision[],
): Character[] {
  // Create a map for O(1) lookup
  const decisionMap = new Map<string, Action>();
  for (const decision of decisions) {
    decisionMap.set(decision.characterId, decision.action);
  }

  // Map characters, setting currentAction if decision exists
  return characters.map((character) => {
    const action = decisionMap.get(character.id);
    if (action) {
      return { ...character, currentAction: action };
    }
    return character;
  });
}

/**
 * Clear currentAction for characters whose actions resolved this tick.
 *
 * @param characters - Characters to check
 * @param tick - Current tick
 * @returns New array with cleared actions (immutable)
 */
export function clearResolvedActions(
  characters: Character[],
  tick: number,
): Character[] {
  return characters.map((character) => {
    if (character.currentAction?.resolvesAtTick === tick) {
      return { ...character, currentAction: null };
    }
    return character;
  });
}
