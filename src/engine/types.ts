/**
 * Core type definitions for the auto-battler game engine.
 * Pure TypeScript - no React dependencies.
 *
 * This file matches the authoritative spec v0.3 Section 13 (Data Model).
 */

// ============================================================================
// Grid & Position Types
// ============================================================================

/**
 * Position on the 12×12 grid.
 */
export interface Position {
  x: number; // 0-11
  y: number; // 0-11
}

/**
 * Faction determines team allegiance and visual styling.
 */
export type Faction = "friendly" | "enemy";

// ============================================================================
// Character Types
// ============================================================================

/**
 * Character represents a combatant on the battlefield.
 * Matches spec Section 13.1.
 */
export interface Character {
  id: string;
  name: string;
  faction: Faction;
  slotPosition: number; // Order added to battle, used for tiebreaking
  hp: number;
  maxHp: number;
  position: Position;
  skills: Skill[]; // Ordered by priority (index 0 = highest)
  currentAction: Action | null;
}

// ============================================================================
// Skill System Types
// ============================================================================

/**
 * Skill represents an ability that can be executed by a character.
 * Matches spec Section 13.2.
 */
export interface Skill {
  id: string;
  name: string;
  tickCost: number;
  range: number;
  damage?: number;
  healing?: number;
  mode?: "towards" | "away"; // for Move skill
  enabled: boolean;
  triggers: Trigger[];
  selectorOverride?: Selector;
}

/**
 * Trigger defines a condition that must be met for a skill to activate.
 * Matches spec Section 13.3.
 */
export interface Trigger {
  type:
    | "always"
    | "enemy_in_range"
    | "ally_in_range"
    | "hp_below"
    | "my_cell_targeted_by_enemy";
  value?: number; // for range X or X% (undefined for 'always' and 'my_cell_targeted_by_enemy')
}

/**
 * Selector determines which character to target.
 * Matches spec Section 13.4.
 */
export interface Selector {
  type:
    | "nearest_enemy"
    | "nearest_ally"
    | "lowest_hp_enemy"
    | "lowest_hp_ally"
    | "self";
}

// ============================================================================
// Action Types
// ============================================================================

/**
 * Action represents a committed skill execution.
 * Uses absolute timing for deterministic replay.
 */
export interface Action {
  type: "attack" | "move" | "heal" | "idle";
  skill: Skill;
  targetCell: Position;
  targetCharacter: Character | null; // null for Move
  startedAtTick: number; // When action was committed
  resolvesAtTick: number; // Absolute tick when action fires
}

// ============================================================================
// Game State Types
// ============================================================================

/**
 * GameState represents the complete state of a battle.
 * All state mutations should be performed via actions for history/undo support.
 */
export interface GameState {
  // Battle participants
  characters: Character[];

  // Time tracking
  tick: number;

  // Game flow
  phase: BattlePhase;
  battleStatus: BattleStatus;

  // Event history (for undo/replay and event log)
  history: GameEvent[];

  // RNG for deterministic randomness
  seed: number; // Battle seed (immutable after init)
  rngState: number; // Current RNG state (mutates each use)
}

/**
 * Battle progresses through discrete phases each tick.
 * Spec Section 4: Decision phase and Resolution phase only.
 */
export type BattlePhase = "decision" | "resolution";

/**
 * Battle status indicates whether combat is ongoing or finished.
 */
export type BattleStatus = "active" | "victory" | "defeat" | "draw";

// ============================================================================
// Event System Types
// ============================================================================

/**
 * GameEvent records something that happened during battle.
 * Used for event log, history, and debugging.
 */
export type GameEvent =
  | SkillDecisionEvent
  | SkillExecutionEvent
  | DamageEvent
  | HealEvent
  | MovementEvent
  | DeathEvent
  | TickEvent;

export interface SkillDecisionEvent {
  type: "skill_decision";
  tick: number;
  characterId: string;
  skillId: string;
  targetIds: string[];
}

export interface SkillExecutionEvent {
  type: "skill_execution";
  tick: number;
  characterId: string;
  skillId: string;
  targetIds: string[];
}

export interface DamageEvent {
  type: "damage";
  tick: number;
  sourceId: string;
  targetId: string;
  damage: number;
  resultingHp: number;
}

export interface HealEvent {
  type: "heal";
  tick: number;
  sourceId: string;
  targetId: string;
  healing: number;
  resultingHp: number;
}

export interface MovementEvent {
  type: "movement";
  tick: number;
  characterId: string;
  from: Position;
  to: Position;
  collided: boolean;
}

export interface DeathEvent {
  type: "death";
  tick: number;
  characterId: string;
}

export interface TickEvent {
  type: "tick";
  tick: number;
  phase: BattlePhase;
}

// ============================================================================
// Movement System Types
// ============================================================================

/**
 * Result of movement collision resolution.
 * Returned by resolveMovement() to update game state.
 */
export interface MovementResult {
  /** Characters with updated positions after movement */
  updatedCharacters: Character[];

  /** Movement events generated during resolution */
  events: MovementEvent[];

  /** Updated RNG state after collision resolutions */
  rngState: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Directions for 8-directional movement.
 * Includes cardinal directions (north, south, east, west) and diagonal directions.
 */
export type Direction =
  | "north"
  | "south"
  | "east"
  | "west"
  | "northeast"
  | "northwest"
  | "southeast"
  | "southwest";

/**
 * Helper to check if two positions are equal.
 */
export const positionsEqual = (a: Position, b: Position): boolean =>
  a.x === b.x && a.y === b.y;

/**
 * Helper to check if position is within grid bounds (12×12).
 */
export const isValidPosition = (pos: Position): boolean =>
  pos.x >= 0 && pos.x < 12 && pos.y >= 0 && pos.y < 12;

/**
 * Helper to calculate Chebyshev distance between positions.
 * Chebyshev distance: 8-directional movement where diagonals cost 1.
 * Used by the game for range calculations per spec Section 2.1.
 */
export const chebyshevDistance = (a: Position, b: Position): number =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/**
 * Helper to get adjacent position in a direction.
 */
export const getAdjacentPosition = (
  pos: Position,
  dir: Direction,
): Position => {
  switch (dir) {
    case "north":
      return { x: pos.x, y: pos.y - 1 };
    case "south":
      return { x: pos.x, y: pos.y + 1 };
    case "east":
      return { x: pos.x + 1, y: pos.y };
    case "west":
      return { x: pos.x - 1, y: pos.y };
    case "northeast":
      return { x: pos.x + 1, y: pos.y - 1 };
    case "northwest":
      return { x: pos.x - 1, y: pos.y - 1 };
    case "southeast":
      return { x: pos.x + 1, y: pos.y + 1 };
    case "southwest":
      return { x: pos.x - 1, y: pos.y + 1 };
  }
};

// ============================================================================
// Skill Evaluation Types
// ============================================================================

/**
 * Reason why a skill was not selected during decision phase.
 */
export type SkillRejectionReason =
  | "disabled" // skill.enabled === false
  | "trigger_failed" // One or more triggers didn't pass
  | "no_target" // Selector returned null (no valid target exists)
  | "out_of_range"; // Target exists but beyond skill.range

/**
 * Result of evaluating a single skill for a character.
 */
export interface SkillEvaluationResult {
  skill: Skill;
  status: "selected" | "rejected" | "skipped";
  rejectionReason?: SkillRejectionReason;

  // Additional context for display (optional, enriches understanding)
  target?: Character; // The selected/attempted target
  distance?: number; // Distance to target (for out_of_range context)
  failedTriggers?: Trigger[]; // Which triggers failed (for trigger_failed)
}

/**
 * Complete evaluation results for a character's skill list.
 */
export interface CharacterEvaluationResult {
  characterId: string;
  isMidAction: boolean; // True if continuing existing action
  currentAction?: Action; // The action being continued (if mid-action)
  skillEvaluations: SkillEvaluationResult[];
  selectedSkillIndex: number | null; // Index of selected skill, null if idle
}
