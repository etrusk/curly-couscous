/**
 * Zustand store for game state management.
 * Uses Immer middleware for immutable updates.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, Character, GameEvent } from '../engine/types';

// ============================================================================
// Store State Type
// ============================================================================

interface GameStore {
  // Current game state
  gameState: GameState;
  
  // Actions to mutate state
  actions: {
    // Initialize a new battle
    initBattle: (characters: Character[]) => void;
    
    // Advance to next tick
    nextTick: () => void;
    
    // Update character
    updateCharacter: (id: string, updates: Partial<Character>) => void;
    
    // Add event to history
    addEvent: (event: GameEvent) => void;
    
    // Reset battle
    reset: () => void;
  };
}

// ============================================================================
// Initial State
// ============================================================================

const initialGameState: GameState = {
  characters: [],
  tick: 0,
  phase: 'decision',
  battleStatus: 'active',
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
    
    // Actions
    actions: {
      initBattle: (characters) =>
        set((state) => {
          const seed = Date.now(); // Use timestamp as seed
          state.gameState = {
            characters: characters.map((char, index) => ({
              ...char,
              slotPosition: index, // Assign slot position based on order
            })),
            tick: 0,
            phase: 'decision',
            battleStatus: 'active',
            history: [],
            seed,
            rngState: seed, // Initialize RNG state with seed
          };
        }),
      
      nextTick: () =>
        set((state) => {
          state.gameState.tick += 1;
          state.gameState.history.push({
            type: 'tick',
            tick: state.gameState.tick,
            phase: state.gameState.phase,
          });
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
          state.gameState = initialGameState;
        }),
    },
  }))
);

// ============================================================================
// Selectors (for optimized subscriptions)
// ============================================================================

/**
 * Select all characters.
 */
export const selectCharacters = (state: GameStore) => state.gameState.characters;

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
export const selectBattleStatus = (state: GameStore) => state.gameState.battleStatus;

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
export const selectCharactersByFaction = (faction: 'friendly' | 'enemy') => (state: GameStore) =>
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
