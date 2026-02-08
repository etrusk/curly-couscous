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
 * Position on the hexagonal grid using axial coordinates.
 * Hexagon-shaped map with radius 5 (91 total hexes).
 */
export interface Position {
  q: number; // Axial coordinate q
  r: number; // Axial coordinate r
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
  id: string; // Registry ID (shared by duplicates)
  instanceId: string; // Unique per-instance (for React keys, targeted updates, removal)
  name: string;
  actionType: "attack" | "move" | "heal";
  tickCost: number;
  range: number;
  damage?: number;
  healing?: number;
  distance?: number;
  behavior: string; // Universal behavior value
  enabled: boolean;
  trigger: Trigger;
  target: Target;
  criterion: Criterion;
  cooldownRemaining?: number; // Ticks remaining until skill is ready
  filter?: SkillFilter; // Optional pre-criterion candidate filter
}

/**
 * Skill filter narrows the candidate pool before criterion selection.
 * Uses the unified condition model shared with triggers.
 */
export interface SkillFilter {
  condition: ConditionType;
  conditionValue?: number;
  qualifier?: ConditionQualifier;
  negated?: boolean;
}

/**
 * Trigger scope determines which character pool to evaluate against.
 */
export type TriggerScope = "enemy" | "ally" | "self";

/**
 * Condition type for trigger evaluation.
 */
export type ConditionType =
  | "always"
  | "in_range"
  | "hp_below"
  | "hp_above"
  | "targeting_me"
  | "channeling"
  | "idle"
  | "targeting_ally";

/**
 * Qualifier narrows condition matching (e.g., channeling a specific skill).
 */
export interface ConditionQualifier {
  type: "action" | "skill";
  id: string;
}

/**
 * Trigger defines a condition that must be met for a skill to activate.
 * Uses unified scope + condition model (Phase 1 refactor).
 */
export interface Trigger {
  scope: TriggerScope;
  condition: ConditionType;
  conditionValue?: number;
  qualifier?: ConditionQualifier;
  negated?: boolean;
}

/**
 * Target specifies which group to select from.
 */
export type Target = "enemy" | "ally" | "self";

/**
 * Criterion specifies how to select within the target group.
 */
export type Criterion =
  | "nearest"
  | "furthest"
  | "lowest_hp"
  | "highest_hp"
  | "most_enemies_nearby";

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
  | TickEvent
  | WhiffEvent;

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

export interface WhiffEvent {
  type: "whiff";
  tick: number;
  sourceId: string;
  actionType: "attack" | "heal";
  targetCell: Position;
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
 * Helper to check if two positions are equal.
 */
export const positionsEqual = (a: Position, b: Position): boolean =>
  a.q === b.q && a.r === b.r;

/**
 * Helper to check if position is within hex grid bounds.
 * Re-exported from hex.ts for convenience.
 */
import {
  isValidHex as isValidHexInternal,
  hexDistance as hexDistanceInternal,
} from "./hex";

export const isValidPosition = (pos: Position): boolean =>
  isValidHexInternal(pos);

/**
 * Helper to calculate hex distance between positions.
 * Hex distance: uniform cost for all 6 directions.
 * Re-exported from hex.ts for convenience.
 */
export const hexDistance = hexDistanceInternal;

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
  | "out_of_range" // Target exists but beyond skill.range
  | "on_cooldown" // Skill is on cooldown
  | "filter_failed"; // Selector filter rejected the target

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
  failedTrigger?: Trigger; // Which trigger failed (for trigger_failed)
  failedFilter?: SkillFilter; // Which filter failed (for filter_failed)
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
