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
  WhiffEvent,
  CharacterEvaluationResult,
} from "../engine/types";
import {
  computeDecisions,
  evaluateSkillsForCharacter as _evaluateSkillsForCharacter,
} from "../engine/game";
import { evaluateTargetCriterion } from "../engine/selectors";
import { evaluateTrigger } from "../engine/triggers";
import { SKILL_REGISTRY } from "../engine/skill-registry";
import { generateAllHexes, positionKey } from "../engine/hex";

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

// ============================================================================
// Skill Inventory Helpers
// ============================================================================

/**
 * Compute the set of assignable skill IDs currently assigned to any character
 * of the given faction. Used by both the store action (enforcement) and
 * CharacterPanel (display filtering).
 *
 * Innate skills are excluded because they are never part of the assignment flow.
 */
export function getFactionAssignedSkillIds(
  characters: Character[],
  faction: Faction,
): Set<string> {
  const ids = new Set<string>();
  for (const char of characters) {
    if (char.faction !== faction) continue;
    for (const skill of char.skills) {
      // Skip innate skills - they don't consume inventory slots
      const def = SKILL_REGISTRY.find((d) => d.id === skill.id);
      if (def?.innate) continue;
      ids.add(skill.id);
    }
  }
  return ids;
}

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
  targetPosition: Position; // Computed live position for rendering
}

/**
 * Get the current target position for an action.
 * For character-targeted skills, returns the live position of targetCharacter.
 * For cell-targeted skills, returns the locked targetCell.
 */
function getActionTargetPosition(
  action: Action,
  characters: Character[],
): Position {
  const skillDef = SKILL_REGISTRY.find((d) => d.id === action.skill.id);
  const targetingMode = skillDef?.targetingMode ?? "cell";

  if (targetingMode === "character" && action.targetCharacter) {
    // Find current position of target character
    const target = characters.find((c) => c.id === action.targetCharacter!.id);
    if (target) {
      return target.position;
    }
  }

  // Fall back to locked target cell
  return action.targetCell;
}

/**
 * Select pending actions for intent line visualization.
 * Used by IntentOverlay to render lines from characters to their targets.
 *
 * Includes both committed actions (characters with currentAction) and preview
 * decisions (idle characters without currentAction). Preview decisions show
 * what a character will do next, enabling intent lines at tick 0 and when
 * an action resolves.
 *
 * Filters out:
 * - Idle actions (type "idle")
 * - Actions with ticksRemaining < 0 (already resolved)
 *
 * All action types (attack, move) are treated uniformly.
 * Actions with ticksRemaining >= 0 are shown, matching the spec requirement
 * that all actions show intent lines for at least one tick before resolution.
 *
 * @param state - The game store state
 * @returns Array of intent data for rendering, empty if no pending actions
 */
export const selectIntentData = (state: GameStore): IntentData[] => {
  const { tick, characters } = state.gameState;

  // 1. Characters with committed actions (existing logic)
  const withActions = characters.filter(
    (c): c is Character & { currentAction: Action } => c.currentAction !== null,
  );

  const committed: IntentData[] = withActions
    .map((c) => ({
      characterId: c.id,
      characterPosition: c.position,
      faction: c.faction,
      action: c.currentAction,
      ticksRemaining: c.currentAction.resolvesAtTick - tick,
      targetPosition: getActionTargetPosition(c.currentAction, characters),
    }))
    .filter(
      (intent) => intent.action.type !== "idle" && intent.ticksRemaining >= 0,
    );

  // 2. Idle characters - compute preview decisions
  const idleCharacterIds = new Set(
    characters
      .filter((c) => c.currentAction === null && c.hp > 0)
      .map((c) => c.id),
  );

  // Early exit if no idle characters
  if (idleCharacterIds.size === 0) {
    return committed;
  }

  const decisions = computeDecisions(state.gameState);

  const afterIdleFilter = decisions.filter((d) =>
    idleCharacterIds.has(d.characterId),
  );

  const afterTypeFilter = afterIdleFilter.filter(
    (d) => d.action.type !== "idle",
  );

  const mapped = afterTypeFilter.map((d) => {
    const character = characters.find((c) => c.id === d.characterId)!;
    return {
      characterId: d.characterId,
      characterPosition: character.position,
      faction: character.faction,
      action: d.action,
      ticksRemaining: d.action.resolvesAtTick - tick,
      targetPosition: getActionTargetPosition(d.action, characters),
    };
  });

  const previews: IntentData[] = mapped.filter(
    (intent) => intent.ticksRemaining >= 0,
  );

  return [...committed, ...previews];
};

/**
 * Select damage events from the just-resolved tick.
 * After `processTick`, `state.tick` represents the *next* tick to process,
 * so events from the just-resolved tick are stamped at `tick - 1`.
 * Simple filter - no grouping or enrichment.
 * Used by useDamageNumbers hook for damage display.
 */
export const selectRecentDamageEvents = (state: GameStore): DamageEvent[] => {
  const { history, tick } = state.gameState;
  if (tick === 0) return [];
  return history.filter(
    (e): e is DamageEvent => e.type === "damage" && e.tick === tick - 1,
  );
};

/**
 * Select whiff events from the just-resolved tick.
 * After `processTick`, `state.tick` represents the *next* tick to process,
 * so events from the just-resolved tick are stamped at `tick - 1`.
 * Used by useWhiffIndicators hook for whiff display.
 */
export const selectRecentWhiffEvents = (state: GameStore): WhiffEvent[] => {
  const { history, tick } = state.gameState;
  if (tick === 0) return [];
  return history.filter(
    (e): e is WhiffEvent => e.type === "whiff" && e.tick === tick - 1,
  );
};

/**
 * Data needed for targeting line rendering.
 */
export interface MovementTargetData {
  fromId: string;
  fromPosition: Position;
  toPosition: Position;
  toId: string;
}

/**
 * Select movement target data for targeting lines.
 * Shows which character each character is moving toward based on their Move skill selector.
 *
 * Evaluates the Move skill's selector for each living character to determine their movement target.
 * Returns data connecting each character to their target position.
 *
 * Memoized to avoid re-computation when characters haven't changed.
 *
 * @param state - The game store state
 * @returns Array of movement target data for rendering targeting lines
 */
export const selectMovementTargetData = (() => {
  let lastCharacters: Character[] | null = null;
  let lastResult: MovementTargetData[] | null = null;

  return (state: GameStore): MovementTargetData[] => {
    const { characters } = state.gameState;

    // If characters reference hasn't changed, return cached result
    if (characters === lastCharacters && lastResult !== null) {
      return lastResult;
    }

    // Filter living characters
    const living = characters.filter((c) => c.hp > 0);

    // Compute fresh result
    const result = living
      .map((character) => {
        // Find first Move skill that passes all checks (mirrors decision engine)
        let moveSkill = null;
        for (const s of character.skills) {
          if (s.actionType !== "move") continue;
          if (!s.enabled) continue;
          if (s.cooldownRemaining && s.cooldownRemaining > 0) continue;
          if (s.behavior === "hold") continue;
          if (!evaluateTrigger(s.trigger, character, characters)) continue;
          moveSkill = s;
          break;
        }
        if (!moveSkill) return null;

        // Evaluate target selection
        const target = evaluateTargetCriterion(
          moveSkill.target,
          moveSkill.criterion,
          character,
          characters,
        );
        if (!target || target.id === character.id) return null;

        return {
          fromId: character.id,
          fromPosition: character.position,
          toPosition: target.position,
          toId: target.id,
        };
      })
      .filter((data): data is MovementTargetData => data !== null);

    // Update cache
    lastCharacters = characters;
    lastResult = result;

    return result;
  };
})();

// ============================================================================
// CharacterPanel Selectors
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
  state.gameState.characters.length >= 91;

/**
 * Select current selection mode.
 * Used by CharacterControls to show active button state.
 */
export const selectSelectionMode = (state: GameStore): SelectionMode =>
  state.selectionMode;

/**
 * Compute which cells are clickable based on current selection mode.
 * Returns empty Set in idle mode.
 * Returns Set of "q,r" formatted strings (positionKey format) for empty cells in placement/moving modes.
 */
export const selectClickableCells = (state: GameStore): Set<string> => {
  const { selectionMode } = state;
  if (selectionMode === "idle") return new Set();

  // Build set of occupied positions
  const occupied = new Set(
    state.gameState.characters.map((c) => positionKey(c.position)),
  );

  // Return all empty cells (hex grid with radius 5)
  const clickable = new Set<string>();
  for (const hex of generateAllHexes()) {
    const key = positionKey(hex);
    if (!occupied.has(key)) {
      clickable.add(key);
    }
  }
  return clickable;
};
