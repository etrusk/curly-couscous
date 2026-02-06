/**
 * Test harness for smoke test state verification.
 * Attaches a read-only API to window.__TEST_HARNESS__ that exposes
 * game state from the Zustand store via direct getState() calls.
 *
 * Each method calls useGameStore.getState() fresh on every invocation
 * to ensure live binding (no stale cached state).
 *
 * Dev-only: conditionally loaded in main.tsx behind import.meta.env.DEV.
 */

import { useGameStore } from "./stores/gameStore";
import type { TestHarness } from "./types/test-harness";

export function installTestHarness(): void {
  const harness: TestHarness = {
    getState() {
      return useGameStore.getState().gameState;
    },
    getCharacters() {
      return useGameStore.getState().gameState.characters;
    },
    getTick() {
      return useGameStore.getState().gameState.tick;
    },
    getBattleStatus() {
      return useGameStore.getState().gameState.battleStatus;
    },
    getSelectedCharacterId() {
      return useGameStore.getState().selectedCharacterId;
    },
  };

  window.__TEST_HARNESS__ = harness;
}
