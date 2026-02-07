/**
 * Global type augmentation for the test harness API.
 * Only available in development mode (import.meta.env.DEV).
 */

import type { GameState, Character, BattleStatus } from "../engine/types";

export interface TestHarness {
  getState(): GameState;
  getCharacters(): Character[];
  getTick(): number;
  getBattleStatus(): BattleStatus;
  getSelectedCharacterId(): string | null;
}

declare global {
  interface Window {
    __TEST_HARNESS__?: TestHarness;
  }
}
