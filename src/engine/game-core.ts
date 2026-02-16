/**
 * Core game loop and tick processing.
 * Implements snapshot→decisions→outcomes→apply flow for deterministic gameplay.
 */

import { GameState, Character, Action, GameEvent, BattleStatus } from "./types";
import { resolveCombat } from "./combat";
import { resolveHealing } from "./healing";
import { resolveInterrupts } from "./interrupt";
import { resolveCharges } from "./charge";
import { resolveMovement } from "./movement";
import { computeDecisions, Decision } from "./game-decisions";
import { getSkillDefinition } from "./skill-registry";

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
 * 4. Calculate outcomes (healing, movement, then combat)
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
  // 4a. Healing resolution (heals resolve before movement)
  const healingResult = resolveHealing(characters, state.tick);
  characters = healingResult.updatedCharacters;
  events.push(...healingResult.events);

  // 4b. Interrupt resolution (interrupts resolve before charges, movement, and combat)
  const interruptResult = resolveInterrupts(characters, state.tick);
  characters = interruptResult.updatedCharacters;
  events.push(...interruptResult.events);

  // 4c. Charge resolution (charges resolve before regular movement)
  const chargeResult = resolveCharges(characters, state.tick, state.rngState);
  characters = chargeResult.updatedCharacters;
  events.push(...chargeResult.events);

  // 4d. Movement resolution (movement before combat enables dodge)
  // Note: characters array already has post-charge positions from step 4c,
  // so chargers naturally block at their new positions without exclusion.
  const movementResult = resolveMovement(
    characters,
    state.tick,
    state.rngState,
  );
  characters = movementResult.updatedCharacters;
  events.push(...movementResult.events);

  // 4f. Combat resolution (attacks resolve after movement)
  const combatResult = resolveCombat(characters, state.tick);
  characters = combatResult.updatedCharacters;
  events.push(...combatResult.events);

  // 5a. Clear resolved actions
  characters = clearResolvedActions(characters, state.tick);

  // 5b. Decrement cooldowns (after clearing actions)
  // Only decrement for characters without pending actions (idle after resolution)
  characters = decrementCooldowns(characters);

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
      // Find the skill that was used and set its cooldown
      const skillDef = getSkillDefinition(action.skill.id);
      const cooldown = skillDef?.cooldown;

      // Update skills array with cooldown (if applicable)
      const updatedSkills = cooldown
        ? character.skills.map((s) =>
            s.instanceId === action.skill.instanceId
              ? { ...s, cooldownRemaining: cooldown }
              : s,
          )
        : character.skills;

      return {
        ...character,
        currentAction: action,
        skills: updatedSkills,
      };
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

/**
 * Decrement cooldownRemaining for all skills that have active cooldowns.
 * Only decrements for characters without pending actions (idle characters).
 * Called at the end of each tick after actions resolve.
 *
 * @param characters - Characters to update
 * @returns New array with decremented cooldowns (immutable)
 */
export function decrementCooldowns(characters: Character[]): Character[] {
  return characters.map((character) => {
    // Skip if character has a pending action - cooldown ticks after resolution
    if (
      character.currentAction !== null &&
      character.currentAction.type !== "idle"
    ) {
      return character;
    }

    const hasActiveCooldowns = character.skills.some(
      (s) => s.cooldownRemaining && s.cooldownRemaining > 0,
    );

    if (!hasActiveCooldowns) {
      return character;
    }

    return {
      ...character,
      skills: character.skills.map((skill) => {
        if (skill.cooldownRemaining && skill.cooldownRemaining > 0) {
          return { ...skill, cooldownRemaining: skill.cooldownRemaining - 1 };
        }
        return skill;
      }),
    };
  });
}
