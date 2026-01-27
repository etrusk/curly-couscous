/**
 * Selectors for gameStore.
 * Extracted from gameStore.ts to reduce file size.
 */

import type { GameStore, SelectionMode } from "./gameStore-types";
import type {
  Character,
  Position,
  Faction,
  Action,
  DamageEvent,
  CharacterEvaluationResult,
} from "../engine/types";
import {
  computeDecisions,
  evaluateSkillsForCharacter as _evaluateSkillsForCharacter,
} from "../engine/game";

// ============================================================================
// Basic Selectors
// ============================================================================

/**
 * Select all characters.
 */
export const selectCharacters = (state: GameStore) =>
  state.gameState.characters;

/**
 * Select current tick.
 */
export const selectTick = (state: GameStore) => state.gameState.tick;

/**
 * Select current phase.
 */
export const selectPhase = (state: GameStore) => state.gameState.phase;

/**
 * Select battle status.
 */
export const selectBattleStatus = (state: GameStore) =>
  state.gameState.battleStatus;

/**
 * Select event history.
 */
export const selectHistory = (state: GameStore) => state.gameState.history;

/**
 * Select actions.
 */
export const selectActions = (state: GameStore) => state.actions;

/**
 * Select character by ID.
 */
export const selectCharacterById = (id: string) => (state: GameStore) =>
  state.gameState.characters.find((c) => c.id === id);

/**
 * Select characters by faction.
 */
export const selectCharactersByFaction =
  (faction: "friendly" | "enemy") => (state: GameStore) =>
    state.gameState.characters.filter((c) => c.faction === faction);

/**
 * Select living characters.
 */
export const selectLivingCharacters = (state: GameStore) =>
  state.gameState.characters.filter((c) => c.hp > 0);

/**
 * Select dead characters.
 */
export const selectDeadCharacters = (state: GameStore) =>
  state.gameState.characters.filter((c) => c.hp <= 0);

// ============================================================================
// BattleViewer Selectors
// ============================================================================

/**
 * Minimal data needed for token rendering.
 * Extracted shape prevents re-renders when other character props change.
 */
export interface TokenData {
  id: string;
  position: Position;
  faction: Faction;
  hp: number;
  maxHp: number;
  slotPosition: number;
}

/**
 * Select minimal token data for rendering.
 * Used by BattleViewer to render character tokens.
 */
export const selectTokenData = (state: GameStore): TokenData[] =>
  state.gameState.characters.map((c) => ({
    id: c.id,
    position: c.position,
    faction: c.faction,
    hp: c.hp,
    maxHp: c.maxHp,
    slotPosition: c.slotPosition,
  }));

/**
 * Pending actions for intent line rendering.
 */
export interface IntentData {
  characterId: string;
  characterPosition: Position;
  faction: Faction;
  action: Action;
  ticksRemaining: number;
}

/**
 * Select pending actions for intent line visualization.
 * Used by IntentOverlay to render lines from characters to their targets.
 *
 * Filters out:
 * - Idle actions (type "idle")
 * - Attack actions with ticksRemaining <= 0 (resolving this tick or already resolved)
 *
 * Movement exception:
 * - Movement actions are shown even with ticksRemaining = 0 because movement
 *   has no visible "damage effect" - showing intent aids battlefield readability.
 *
 * @param state - The game store state
 * @returns Array of intent data for rendering, empty if no pending actions
 */
export const selectIntentData = (state: GameStore): IntentData[] => {
  const { tick, characters } = state.gameState;
  const withActions = characters.filter(
    (c): c is Character & { currentAction: Action } => c.currentAction !== null,
  );

  const mapped = withActions.map((c) => ({
    characterId: c.id,
    characterPosition: c.position,
    faction: c.faction,
    action: c.currentAction,
    ticksRemaining: c.currentAction.resolvesAtTick - tick,
  }));

  const filtered = mapped.filter(
    (intent) =>
      intent.action.type !== "idle" &&
      (intent.ticksRemaining > 0 ||
        (intent.action.type === "move" && intent.ticksRemaining >= 0)),
  );

  return filtered;
};

/**
 * Select damage events from current tick only.
 * Simple filter - no grouping or enrichment.
 * Used by useDamageNumbers hook for damage display.
 */
export const selectRecentDamageEvents = (state: GameStore): DamageEvent[] => {
  const { history, tick } = state.gameState;
  return history.filter(
    (e): e is DamageEvent => e.type === "damage" && e.tick === tick,
  );
};

// ============================================================================
// SkillsPanel Selectors
// ============================================================================

/**
 * Select currently selected character ID.
 */
export const selectSelectedCharacterId = (state: GameStore): string | null =>
  state.selectedCharacterId;

/**
 * Select currently selected character.
 */
export const selectSelectedCharacter = (
  state: GameStore,
): Character | undefined =>
  state.gameState.characters.find((c) => c.id === state.selectedCharacterId);

// ============================================================================
// RuleEvaluations Selectors
// ============================================================================

/**
 * Preview what action a character will take next tick.
 *
 * If the character has a currentAction (mid-action), returns that.
 * If the character is idle, uses computeDecisions() to preview their next decision.
 *
 * Used by RuleEvaluations to show "Next Action" preview.
 *
 * @param characterId - ID of character to preview
 * @returns Action the character will take, or null if character not found
 */
export const selectNextTickDecision =
  (characterId: string) =>
  (state: GameStore): Action | null => {
    const character = state.gameState.characters.find(
      (c) => c.id === characterId,
    );
    if (!character) return null;

    // If character has current action, that's what they'll do next
    if (character.currentAction !== null) {
      return character.currentAction;
    }

    // Character is idle - preview what they would decide
    const decisions = computeDecisions(state.gameState);
    const decision = decisions.find((d) => d.characterId === characterId);
    return decision?.action ?? null;
  };

/**
 * Select evaluation results for all characters on the board.
 * Used by RuleEvaluations to show condensed view of all characters' AI decisions.
 *
 * Memoized to avoid re-computation on every render when characters haven't changed.
 *
 * @param state - The game store state
 * @returns Array of character evaluation results, one per character
 */
export const selectAllCharacterEvaluations = (() => {
  let lastCharacters: Character[] | null = null;
  let lastResult: CharacterEvaluationResult[] | null = null;

  return (state: GameStore): CharacterEvaluationResult[] => {
    const { characters } = state.gameState;

    // If characters reference hasn't changed, return cached result
    if (characters === lastCharacters && lastResult !== null) {
      return lastResult;
    }

    // Compute fresh result
    const result = characters.map((character) =>
      _evaluateSkillsForCharacter(character, characters),
    );

    // Update cache
    lastCharacters = characters;
    lastResult = result;

    return result;
  };
})();
// ============================================================================
// CharacterControls Selectors
// ============================================================================

/**
 * Check if grid is full (144 characters).
 * Used by CharacterControls to disable add buttons.
 */
export const selectIsGridFull = (state: GameStore): boolean =>
  state.gameState.characters.length >= 144;

/**
 * Select current selection mode.
 * Used by CharacterControls to show active button state.
 */
export const selectSelectionMode = (state: GameStore): SelectionMode =>
  state.selectionMode;

/**
 * Compute which cells are clickable based on current selection mode.
 * Returns empty Set in idle mode.
 * Returns Set of "x-y" formatted strings for empty cells in placement/moving modes.
 */
export const selectClickableCells = (state: GameStore): Set<string> => {
  const { selectionMode } = state;
  if (selectionMode === "idle") return new Set();

  // Build set of occupied positions
  const occupied = new Set(
    state.gameState.characters.map((c) => `${c.position.x}-${c.position.y}`),
  );

  // Return all empty cells (12×12 grid)
  const clickable = new Set<string>();
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const key = `${x}-${y}`;
      if (!occupied.has(key)) {
        clickable.add(key);
      }
    }
  }
  return clickable;
};
