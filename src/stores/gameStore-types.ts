/**
 * Type definitions for gameStore.
 * Extracted from gameStore.ts to reduce file size and enable sharing across modules.
 */

import type {
  GameState,
  Character,
  GameEvent,
  Skill,
  Faction,
  Position,
} from "../engine/types";

/**
 * Selection mode for click-to-place functionality.
 */
export type SelectionMode =
  | "idle"
  | "placing-friendly"
  | "placing-enemy"
  | "moving";

export interface GameStore {
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
