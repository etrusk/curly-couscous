/**
 * Zustand store for game state management.
 * Uses Immer middleware for immutable updates.
 *
 * This is the main entry point that imports from decomposed modules.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { processTick as engineProcessTick } from "../engine/game";
import type { Character } from "../engine/types";

// Import from decomposed modules
import {
  getNextCharacterIdCounter,
  DEFAULT_SKILLS,
  initialGameState,
} from "./gameStore-constants";
import {
  findNextAvailablePosition,
  calculateBattleStatus,
  calculatePreBattleStatus,
} from "./gameStore-helpers";
import type { GameStore, SelectionMode } from "./gameStore-types";
import {
  selectCharacters,
  selectTick,
  selectPhase,
  selectBattleStatus,
  selectHistory,
  selectActions,
  selectCharacterById,
  selectCharactersByFaction,
  selectLivingCharacters,
  selectDeadCharacters,
  selectTokenData,
  selectIntentData,
  selectRecentDamageEvents,
  selectSelectedCharacterId,
  selectSelectedCharacter,
  selectNextTickDecision,
  selectAllCharacterEvaluations,
  selectIsGridFull as selectorIsGridFull,
  selectSelectionMode,
  selectClickableCells,
  type TokenData,
  type IntentData,
} from "./gameStore-selectors";

// Re-export all selectors and types for external use
export type { GameStore, SelectionMode, TokenData, IntentData };
export {
  selectCharacters,
  selectTick,
  selectPhase,
  selectBattleStatus,
  selectHistory,
  selectActions,
  selectCharacterById,
  selectCharactersByFaction,
  selectLivingCharacters,
  selectDeadCharacters,
  selectTokenData,
  selectIntentData,
  selectRecentDamageEvents,
  selectSelectedCharacterId,
  selectSelectedCharacter,
  selectNextTickDecision,
  selectAllCharacterEvaluations,
  selectorIsGridFull as selectIsGridFull,
  selectSelectionMode,
  selectClickableCells,
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
          // Preserve currentAction if set (for testing scenarios)
          const sanitized = characters.map((char, index) => ({
            ...char,
            slotPosition: index + 1, // Assign 1-based slot position (first = 1)
            currentAction: char.currentAction ?? null, // Preserve if set, otherwise null
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

          // Immer requires mutating the draft, not replacing references
          // Use splice to replace array contents in place
          state.gameState.characters.splice(
            0,
            state.gameState.characters.length,
            ...result.state.characters,
          );
          state.gameState.tick = result.state.tick;
          state.gameState.phase = result.state.phase;
          state.gameState.battleStatus = result.state.battleStatus;

          // For history array, also use splice
          state.gameState.history.splice(
            0,
            state.gameState.history.length,
            ...result.state.history,
          );
          state.gameState.rngState = result.state.rngState;
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
          const id = `${faction}-${Date.now()}-${getNextCharacterIdCounter()}`;

          // Determine slotPosition (next sequential number)
          const slotPosition = state.gameState.characters.length + 1;

          // Create new character
          const newCharacter: Character = {
            id,
            name: `${faction === "friendly" ? "Friendly" : "Enemy"} ${slotPosition}`,
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
          const id = `${faction}-${Date.now()}-${getNextCharacterIdCounter()}`;

          // Determine slotPosition (next sequential number)
          const slotPosition = state.gameState.characters.length + 1;

          // Create new character
          const newCharacter: Character = {
            id,
            name: `${faction === "friendly" ? "Friendly" : "Enemy"} ${slotPosition}`,
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
