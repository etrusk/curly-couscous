/**
 * Zustand store for game state management.
 * Uses Immer middleware for immutable updates.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  processTick as engineProcessTick,
  computeDecisions,
} from "../engine/game";
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
// Constants
// ============================================================================

/**
 * Grid size (12×12 grid).
 */
const GRID_SIZE = 12;

/**
 * Helper function to create consistent position keys.
 * Uses hyphen format: "x-y"
 */
const positionKey = (x: number, y: number): string => `${x}-${y}`;

// ============================================================================
// Default Skills and Character Counter
// ============================================================================

/**
 * Counter for generating unique character IDs.
 * Format: ${faction}-${timestamp}-${counter}
 */
let characterIdCounter = 0;

/**
 * Default skills assigned to newly added characters.
 */
const DEFAULT_SKILLS: Skill[] = [
  {
    id: "light-punch",
    name: "Light Punch",
    tickCost: 1,
    range: 1,
    damage: 10,
    enabled: true,
    triggers: [{ type: "always" }],
    selectorOverride: { type: "nearest_enemy" },
  },
  {
    id: "heavy-punch",
    name: "Heavy Punch",
    tickCost: 2,
    range: 2,
    damage: 25,
    enabled: true,
    triggers: [{ type: "always" }],
    selectorOverride: { type: "nearest_enemy" },
  },
  {
    id: "move-towards",
    name: "Move Towards",
    tickCost: 1,
    range: 1,
    mode: "towards",
    enabled: true,
    triggers: [{ type: "always" }],
    selectorOverride: { type: "nearest_enemy" },
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find the first unoccupied position on the grid (row-major order).
 * @param characters - Current characters on the grid
 * @returns Position if available, null if grid is full
 */
function findNextAvailablePosition(characters: Character[]): Position | null {
  const occupiedPositions = new Set(
    characters.map((c) => positionKey(c.position.x, c.position.y)),
  );

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const key = positionKey(x, y);
      if (!occupiedPositions.has(key)) {
        return { x, y };
      }
    }
  }

  return null; // Grid is full
}

/**
 * Calculate battle status for mid-battle/post-removal scenarios.
 * @param characters - Current characters
 * @returns Battle status
 */
function calculateBattleStatus(
  characters: Character[],
): "active" | "victory" | "defeat" | "draw" {
  const hasFriendly = characters.some((c) => c.faction === "friendly");
  const hasEnemy = characters.some((c) => c.faction === "enemy");

  if (!hasFriendly && !hasEnemy) return "draw";
  if (!hasEnemy) return "victory";
  if (!hasFriendly) return "defeat";
  return "active";
}

/**
 * Calculate battle status for pre-battle setup (addCharacter).
 * Requires both factions for "active", otherwise "draw".
 * @param characters - Current characters
 * @returns Battle status
 */
function calculatePreBattleStatus(characters: Character[]): "active" | "draw" {
  const hasFriendly = characters.some((c) => c.faction === "friendly");
  const hasEnemy = characters.some((c) => c.faction === "enemy");

  return hasFriendly && hasEnemy ? "active" : "draw";
}

// ============================================================================
// Store State Type
// ============================================================================

/**
 * Selection mode for click-to-place functionality.
 */
export type SelectionMode =
  | "idle"
  | "placing-friendly"
  | "placing-enemy"
  | "moving";

interface GameStore {
  // Current game state
  gameState: GameState;

  // Initial state for reset
  initialCharacters: Character[];
  initialSeed: number;
  initialRngState: number;

  // UI state
  selectedCharacterId: string | null;
  selectionMode: SelectionMode;

  // Selectors
  selectIsGridFull: () => boolean;

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

    // Character add/remove
    addCharacter: (faction: Faction) => boolean;
    removeCharacter: (id: string) => void;

    // Selection mode management
    setSelectionMode: (mode: SelectionMode) => void;
    addCharacterAtPosition: (faction: Faction, position: Position) => boolean;
    moveCharacter: (characterId: string, newPosition: Position) => boolean;
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
  immer((set, get) => ({
    // Initial state
    gameState: initialGameState,
    initialCharacters: [],
    initialSeed: 0,
    initialRngState: 0,
    selectedCharacterId: null,
    selectionMode: "idle",

    // Selectors
    selectIsGridFull: () => get().gameState.characters.length >= 144,

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

      addCharacter: (faction) => {
        let success = false;
        set((state) => {
          // Check if grid is full
          if (state.gameState.characters.length >= 144) {
            success = false;
            return;
          }

          // Find next available position
          const position = findNextAvailablePosition(
            state.gameState.characters,
          );
          if (!position) {
            success = false;
            return;
          }

          // Generate unique ID
          const id = `${faction}-${Date.now()}-${characterIdCounter++}`;

          // Determine slotPosition (next sequential number)
          const slotPosition = state.gameState.characters.length;

          // Create new character
          const newCharacter: Character = {
            id,
            name: `${faction === "friendly" ? "Friendly" : "Enemy"} ${slotPosition + 1}`,
            faction,
            slotPosition,
            hp: 100,
            maxHp: 100,
            position,
            skills: structuredClone(DEFAULT_SKILLS),
            currentAction: null,
          };

          // Add to gameState
          state.gameState.characters.push(newCharacter);

          // Add to initialCharacters
          state.initialCharacters.push(structuredClone(newCharacter));

          // Recalculate battleStatus (pre-battle setup)
          state.gameState.battleStatus = calculatePreBattleStatus(
            state.gameState.characters,
          );

          success = true;
        });
        return success;
      },

      removeCharacter: (id) =>
        set((state) => {
          // Remove from gameState.characters
          state.gameState.characters = state.gameState.characters.filter(
            (c) => c.id !== id,
          );

          // Remove from initialCharacters
          state.initialCharacters = state.initialCharacters.filter(
            (c) => c.id !== id,
          );

          // Clear selectedCharacterId if removed character was selected
          if (state.selectedCharacterId === id) {
            state.selectedCharacterId = null;
          }

          // Recalculate battleStatus
          state.gameState.battleStatus = calculateBattleStatus(
            state.gameState.characters,
          );
        }),

      setSelectionMode: (mode) =>
        set((state) => {
          state.selectionMode = mode;
        }),

      addCharacterAtPosition: (faction, position) => {
        let success = false;
        set((state) => {
          // Validate position is within bounds
          if (
            position.x < 0 ||
            position.x >= 12 ||
            position.y < 0 ||
            position.y >= 12
          ) {
            success = false;
            return;
          }

          // Check if position is occupied
          const isOccupied = state.gameState.characters.some(
            (c) => c.position.x === position.x && c.position.y === position.y,
          );
          if (isOccupied) {
            success = false;
            return;
          }

          // Generate unique ID
          const id = `${faction}-${Date.now()}-${characterIdCounter++}`;

          // Determine slotPosition (next sequential number)
          const slotPosition = state.gameState.characters.length;

          // Create new character
          const newCharacter: Character = {
            id,
            name: `${faction === "friendly" ? "Friendly" : "Enemy"} ${slotPosition + 1}`,
            faction,
            slotPosition,
            hp: 100,
            maxHp: 100,
            position,
            skills: structuredClone(DEFAULT_SKILLS),
            currentAction: null,
          };

          // Add to gameState
          state.gameState.characters.push(newCharacter);

          // Add to initialCharacters
          state.initialCharacters.push(structuredClone(newCharacter));

          // Recalculate battleStatus (pre-battle setup)
          state.gameState.battleStatus = calculatePreBattleStatus(
            state.gameState.characters,
          );

          success = true;
        });
        return success;
      },

      moveCharacter: (characterId, newPosition) => {
        let success = false;
        set((state) => {
          // Find character
          const character = state.gameState.characters.find(
            (c) => c.id === characterId,
          );
          if (!character) {
            success = false;
            return;
          }

          // Validate position is within bounds
          if (
            newPosition.x < 0 ||
            newPosition.x >= 12 ||
            newPosition.y < 0 ||
            newPosition.y >= 12
          ) {
            success = false;
            return;
          }

          // Check if position is occupied
          const isOccupied = state.gameState.characters.some(
            (c) =>
              c.position.x === newPosition.x && c.position.y === newPosition.y,
          );
          if (isOccupied) {
            success = false;
            return;
          }

          // Update position in gameState
          character.position = newPosition;

          // Update position in initialCharacters
          const initialCharacter = state.initialCharacters.find(
            (c) => c.id === characterId,
          );
          if (initialCharacter) {
            initialCharacter.position = newPosition;
          }

          success = true;
        });
        return success;
      },
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
