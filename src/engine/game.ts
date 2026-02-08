/**
 * Core game loop and tick processing.
 * Barrel file that re-exports functionality from decomposed modules.
 *
 * This file exists to maintain the public API while decomposing the original
 * 774-line game.ts into smaller, focused modules.
 */

// Re-export core tick processing
export {
  processTick,
  checkBattleStatus,
  applyDecisions,
  clearResolvedActions,
} from "./game-core";
export type { TickResult } from "./game-core";

// Re-export decision logic
export { computeDecisions, evaluateSkillsForCharacter } from "./game-decisions";
export type { Decision } from "./game-decisions";

// Re-export action utilities
export { getActionType } from "./game-actions";

// Re-export healing logic
export { resolveHealing } from "./healing";
export type { HealingResult } from "./healing";

// Re-export interrupt logic
export { resolveInterrupts } from "./interrupt";
export type { InterruptResult } from "./interrupt";

// Re-export charge logic
export { resolveCharges } from "./charge";
export type { ChargeResult } from "./charge";

// Note: DEFAULT_SELECTOR and IDLE_SKILL are internal constants
// and are not exported from this barrel file.
