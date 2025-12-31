/**
 * Core type definitions for the auto-battler game engine.
 * Pure TypeScript - no React dependencies.
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
export type Faction = 'friendly' | 'enemy';

// ============================================================================
// Character Types
// ============================================================================

/**
 * Character represents a combatant on the battlefield.
 */
export interface Character {
  id: string;
  name: string;
  faction: Faction;
  position: Position;
  
  // Combat stats
  hp: number;
  maxHp: number;
  
  // AI behavior - priority-based skill list (evaluated top-to-bottom)
  skillList: Skill[];
  
  // Current state
  pendingAction?: PendingAction;
  
  // Visual metadata
  slot: number; // Order character was added (for collision resolution)
}

/**
 * Pending action represents a skill execution in progress.
 * Actions are decided in the decision phase, visualized, then executed.
 */
export interface PendingAction {
  skill: Skill;
  targets: Character[]; // Selected targets
  ticksRemaining: number; // Countdown until execution
}

// ============================================================================
// Skill System Types
// ============================================================================

/**
 * Skill represents an ability that can be executed by a character.
 * Skills are evaluated in priority order (top-to-bottom in skillList).
 */
export interface Skill {
  id: string;
  name: string;
  
  // Execution timing
  ticksToExecute: number; // Multi-tick skills create dodge windows
  
  // Behavior definition
  trigger: Trigger; // When should this skill be used?
  selector: Selector; // Who should be targeted?
  action: ActionType; // What effect occurs?
}

/**
 * Trigger evaluates whether a skill should be used.
 * Strategy pattern - composable condition functions.
 */
export type Trigger = (character: Character, gameState: GameState) => boolean;

/**
 * Selector chooses target(s) for a skill.
 * Strategy pattern - composable selection functions.
 */
export type Selector = (character: Character, gameState: GameState) => Character[];

// ============================================================================
// Action Types
// ============================================================================

/**
 * ActionType defines the effect that occurs when a skill executes.
 */
export type ActionType = AttackAction | MoveAction | WaitAction;

/**
 * Attack action deals damage to target(s).
 */
export interface AttackAction {
  type: 'attack';
  damage: number;
}

/**
 * Move action changes character position.
 */
export interface MoveAction {
  type: 'move';
  direction: Direction;
  distance: number;
}

/**
 * Wait action does nothing (placeholder/defensive).
 */
export interface WaitAction {
  type: 'wait';
}

/**
 * Cardinal directions for movement.
 */
export type Direction = 'north' | 'south' | 'east' | 'west';

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
}

/**
 * Battle progresses through discrete phases each tick.
 */
export type BattlePhase = 'decision' | 'visualization' | 'execution';

/**
 * Battle status indicates whether combat is ongoing or finished.
 */
export type BattleStatus = 'active' | 'victory' | 'defeat' | 'draw';

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
  | MovementEvent
  | DeathEvent
  | TickEvent;

export interface SkillDecisionEvent {
  type: 'skill_decision';
  tick: number;
  characterId: string;
  skillId: string;
  targetIds: string[];
}

export interface SkillExecutionEvent {
  type: 'skill_execution';
  tick: number;
  characterId: string;
  skillId: string;
  targetIds: string[];
}

export interface DamageEvent {
  type: 'damage';
  tick: number;
  sourceId: string;
  targetId: string;
  damage: number;
  resultingHp: number;
}

export interface MovementEvent {
  type: 'movement';
  tick: number;
  characterId: string;
  from: Position;
  to: Position;
  collided: boolean;
}

export interface DeathEvent {
  type: 'death';
  tick: number;
  characterId: string;
}

export interface TickEvent {
  type: 'tick';
  tick: number;
  phase: BattlePhase;
}

// ============================================================================
// Utility Types
// ============================================================================

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
 * Helper to calculate Manhattan distance between positions.
 */
export const manhattanDistance = (a: Position, b: Position): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/**
 * Helper to get adjacent position in a direction.
 */
export const getAdjacentPosition = (pos: Position, dir: Direction): Position => {
  switch (dir) {
    case 'north': return { x: pos.x, y: pos.y - 1 };
    case 'south': return { x: pos.x, y: pos.y + 1 };
    case 'east': return { x: pos.x + 1, y: pos.y };
    case 'west': return { x: pos.x - 1, y: pos.y };
  }
};
