/**
 * Zustand store for game state management.
 * Uses Immer middleware for immutable updates.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { processTick as engineProcessTick } from "../engine/game";
import type {
  GameState,
  Character,
  GameEvent,
  DamageEvent,
  Position,
  Faction,
  Action,
  Skill,
} from "../engine/types";

// ============================================================================
// Store State Type
// ============================================================================

interface GameStore {
  // Current game state
  gameState: GameState;

  // Initial state for reset
  initialCharacters: Character[];
  initialSeed: number;
  initialRngState: number;

  // UI state
  selectedCharacterId: string | null;

  // Actions to mutate state
  actions: {
    // Initialize a new battle
    initBattle: (characters: Character[]) => void;

    // Advance to next tick (legacy - increments only)
    nextTick: () => void;

    // Process a full game tick via engine
    processTick: () => void;

    // Update character
    updateCharacter: (id: string, updates: Partial<Character>) => void;

    // Add event to history
    addEvent: (event: GameEvent) => void;

    // Reset battle to initial state
    reset: () => void;

    // Character selection
    selectCharacter: (id: string | null) => void;

    // Skill management
    updateSkill: (
      charId: string,
      skillId: string,
      updates: Partial<Skill>,
    ) => void;
    moveSkillUp: (charId: string, skillIndex: number) => void;
    moveSkillDown: (charId: string, skillIndex: number) => void;
  };
}

// ============================================================================
// Initial State
// ============================================================================

const initialGameState: GameState = {
  characters: [],
  tick: 0,
  phase: "decision",
  battleStatus: "active",
  history: [],
  seed: 0,
  rngState: 0,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useGameStore = create<GameStore>()(
  immer((set) => ({
    // Initial state
    gameState: initialGameState,
    initialCharacters: [],
    initialSeed: 0,
    initialRngState: 0,
    selectedCharacterId: null,

    // Actions
    actions: {
      initBattle: (characters) =>
        set((state) => {
          const seed = Date.now(); // Use timestamp as seed

          // Strip transient state before cloning to avoid circular references
          const sanitized = characters.map((char, index) => ({
            ...char,
            slotPosition: index, // Assign slot position based on order
            currentAction: null, // Strip transient state
          }));

          // Store deep clone of initial state for reset
          state.initialCharacters = structuredClone(sanitized);
          state.initialSeed = seed;
          state.initialRngState = seed;

          // Set active game state
          state.gameState = {
            characters: structuredClone(sanitized),
            tick: 0,
            phase: "decision",
            battleStatus: characters.length === 0 ? "draw" : "active",
            history: [],
            seed,
            rngState: seed,
          };
        }),

      nextTick: () =>
        set((state) => {
          state.gameState.tick += 1;
          state.gameState.history.push({
            type: "tick",
            tick: state.gameState.tick,
            phase: state.gameState.phase,
          });
        }),

      processTick: () =>
        set((state) => {
          // Guard: don't process if battle is over
          if (state.gameState.battleStatus !== "active") {
            return;
          }

          const result = engineProcessTick(state.gameState);
          state.gameState = result.state;
        }),

      updateCharacter: (id, updates) =>
        set((state) => {
          const character = state.gameState.characters.find((c) => c.id === id);
          if (character) {
            Object.assign(character, updates);
          }
        }),

      addEvent: (event) =>
        set((state) => {
          state.gameState.history.push(event);
        }),

      reset: () =>
        set((state) => {
          // Immer handles immutability - just assign from initial state
          // Deep copy using JSON for characters to avoid shared references
          // Note: JSON.parse(JSON.stringify()) is used here instead of structuredClone
          // because Immer wraps state in Proxy objects that structuredClone cannot handle
          const restoredCharacters = JSON.parse(
            JSON.stringify(state.initialCharacters),
          ) as Character[];

          state.gameState = {
            characters: restoredCharacters,
            tick: 0,
            phase: "decision",
            battleStatus:
              state.initialCharacters.length === 0 ? "draw" : "active",
            history: [],
            seed: state.initialSeed,
            rngState: state.initialRngState,
          };
        }),

      selectCharacter: (id) =>
        set((state) => {
          state.selectedCharacterId = id;
        }),

      updateSkill: (charId, skillId, updates) =>
        set((state) => {
          const character = state.gameState.characters.find(
            (c) => c.id === charId,
          );
          if (character) {
            const skill = character.skills.find((s) => s.id === skillId);
            if (skill) {
              Object.assign(skill, updates);
            }
          }
        }),

      moveSkillUp: (charId, skillIndex) =>
        set((state) => {
          const character = state.gameState.characters.find(
            (c) => c.id === charId,
          );
          if (
            character &&
            skillIndex > 0 &&
            skillIndex < character.skills.length
          ) {
            // Array destructuring swap - bounds check ensures elements exist
            const skills = character.skills;
            const a = skills[skillIndex]!;
            const b = skills[skillIndex - 1]!;
            skills[skillIndex - 1] = a;
            skills[skillIndex] = b;
          }
        }),

      moveSkillDown: (charId, skillIndex) =>
        set((state) => {
          const character = state.gameState.characters.find(
            (c) => c.id === charId,
          );
          if (
            character &&
            skillIndex >= 0 &&
            skillIndex < character.skills.length - 1
          ) {
            // Array destructuring swap - bounds check ensures elements exist
            const skills = character.skills;
            const a = skills[skillIndex]!;
            const b = skills[skillIndex + 1]!;
            skills[skillIndex] = b;
            skills[skillIndex + 1] = a;
          }
        }),
    },
  })),
);

// ============================================================================
// Selectors (for optimized subscriptions)
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
 */
export const selectIntentData = (state: GameStore): IntentData[] => {
  const { tick, characters } = state.gameState;
  return characters
    .filter((c) => c.currentAction !== null)
    .map((c) => ({
      characterId: c.id,
      characterPosition: c.position,
      faction: c.faction,
      action: c.currentAction!,
      ticksRemaining: c.currentAction!.resolvesAtTick - tick,
    }));
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
