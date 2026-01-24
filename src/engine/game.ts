/**
 * Core game loop and tick processing.
 * Implements snapshot→decisions→outcomes→apply flow for deterministic gameplay.
 */

import {
  GameState,
  Character,
  Action,
  GameEvent,
  BattleStatus,
  Skill,
  Selector,
  Position,
  chebyshevDistance,
  SkillEvaluationResult,
  CharacterEvaluationResult,
} from "./types";
import { resolveCombat } from "./combat";
import { resolveMovement } from "./movement";
import { evaluateTrigger } from "./triggers";
import { evaluateSelector } from "./selectors";

/**
 * Result of processing a single tick.
 */
export interface TickResult {
  state: GameState;
  events: GameEvent[];
}

/**
 * Decision represents a character's chosen action for the current tick.
 */
export interface Decision {
  characterId: string;
  action: Action;
}

/**
 * Process a single game tick using the snapshot→decisions→outcomes→apply flow.
 *
 * Flow:
 * 1. Create immutable snapshot of current state
 * 2. Decision Phase: Compute decisions for idle characters
 * 3. Resolution Phase: Find actions resolving this tick
 * 4. Calculate outcomes (combat, then movement)
 * 5. Apply all mutations, check victory, return new state
 *
 * @param state - Current game state
 * @returns TickResult with updated state and events
 */
export function processTick(state: GameState): TickResult {
  const events: GameEvent[] = [];
  let characters = state.characters;

  // 1. Decision Phase: Compute decisions for idle characters
  const decisions = computeDecisions(state);

  // 2. Apply decisions → set currentAction
  characters = applyDecisions(characters, decisions);

  // 3. Resolution Phase: Find actions resolving this tick
  events.push({
    type: "tick",
    tick: state.tick,
    phase: "resolution",
  });

  // 4. Calculate outcomes
  // 4a. Combat resolution (attacks resolve first)
  const combatResult = resolveCombat(characters, state.tick);
  characters = combatResult.updatedCharacters;
  events.push(...combatResult.events);

  // 4b. Movement resolution (using updated characters from combat)
  const movementResult = resolveMovement(
    characters,
    state.tick,
    state.rngState,
  );
  characters = movementResult.updatedCharacters;
  events.push(...movementResult.events);

  // 5. Clear resolved actions
  characters = clearResolvedActions(characters, state.tick);

  // 6. Apply all mutations
  // Remove dead characters (HP <= 0)
  const aliveCharacters = characters.filter((c) => c.hp > 0);

  // Check battle status
  const battleStatus = checkBattleStatus(aliveCharacters);

  // Create new state
  const newState: GameState = {
    ...state,
    characters: aliveCharacters,
    tick: state.tick + 1,
    battleStatus,
    history: [...state.history, ...events],
    rngState: movementResult.rngState,
  };

  return {
    state: newState,
    events,
  };
}

/**
 * Default selector when skill doesn't specify selectorOverride.
 */
const DEFAULT_SELECTOR: Selector = { type: "nearest_enemy" };

/**
 * Synthetic idle skill for when no valid skill is selected.
 */
const IDLE_SKILL: Skill = {
  id: "__idle__",
  name: "Idle",
  tickCost: 1,
  range: 0,
  enabled: true,
  triggers: [],
};

/**
 * Infer action type from skill properties.
 *
 * @param skill - Skill to check
 * @returns 'attack' if skill has damage, 'move' if skill has mode
 * @throws Error if skill has both or neither damage and mode
 */
export function getActionType(skill: Skill): "attack" | "move" {
  const hasDamage = skill.damage !== undefined;
  const hasMode = skill.mode !== undefined;

  if (hasDamage && hasMode) {
    throw new Error(`Skill ${skill.id} cannot have both damage and mode`);
  }

  if (!hasDamage && !hasMode) {
    throw new Error(`Skill ${skill.id} must have damage or mode`);
  }

  return hasDamage ? "attack" : "move";
}

/**
 * Compute move destination with tiebreaking rules.
 *
 * Tiebreaking (when multiple cells equidistant):
 * 1. Prefer horizontal movement (lower X difference)
 * 2. Then vertical movement (lower Y difference)
 * 3. Then lower Y coordinate
 * 4. Then lower X coordinate
 *
 * @param mover - Character that is moving
 * @param target - Target character to move towards/away from
 * @param mode - Movement mode ('towards' or 'away')
 * @returns Destination position (1 cell away from mover)
 */
function computeMoveDestination(
  mover: Character,
  target: Character,
  mode: "towards" | "away",
): Position {
  const dx = target.position.x - mover.position.x;
  const dy = target.position.y - mover.position.y;

  // Calculate step direction based on mode
  const stepX = mode === "towards" ? Math.sign(dx) : -Math.sign(dx);
  const stepY = mode === "towards" ? Math.sign(dy) : -Math.sign(dy);

  // Tiebreaking: prefer horizontal movement (lower X difference)
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let destination: Position;

  if (absDx > absDy) {
    // Move horizontally - clamp to valid grid bounds [0, 11]
    destination = {
      x: Math.max(0, Math.min(11, mover.position.x + stepX)),
      y: mover.position.y,
    };
  } else if (absDy > absDx) {
    // Move vertically - clamp to valid grid bounds [0, 11]
    destination = {
      x: mover.position.x,
      y: Math.max(0, Math.min(11, mover.position.y + stepY)),
    };
  } else if (absDx === absDy && absDx > 0) {
    // Equal distance: prefer horizontal per tiebreaking rules - clamp to valid grid bounds [0, 11]
    destination = {
      x: Math.max(0, Math.min(11, mover.position.x + stepX)),
      y: mover.position.y,
    };
  } else {
    // Already at target position (dx === dy === 0)
    return mover.position;
  }

  // Wall-boundary fallback for "away" mode
  if (
    mode === "away" &&
    destination.x === mover.position.x &&
    destination.y === mover.position.y
  ) {
    // Primary movement was blocked by wall, try perpendicular escape
    if (absDx >= absDy) {
      // Primary was horizontal, try perpendicular (vertical) escape
      if (dy !== 0) {
        // Natural secondary direction exists
        const newY = Math.max(0, Math.min(11, mover.position.y + stepY));
        destination = { x: mover.position.x, y: newY };
      } else {
        // No natural secondary (same row), try lower Y first, then higher Y
        if (mover.position.y > 0) {
          destination = { x: mover.position.x, y: mover.position.y - 1 };
        } else if (mover.position.y < 11) {
          destination = { x: mover.position.x, y: mover.position.y + 1 };
        }
        // else: stuck at corner, no escape possible - destination remains current position
      }
    } else {
      // Primary was vertical, try perpendicular (horizontal) escape
      if (dx !== 0) {
        // Natural secondary direction exists
        const newX = Math.max(0, Math.min(11, mover.position.x + stepX));
        destination = { x: newX, y: mover.position.y };
      } else {
        // No natural secondary (same column), try lower X first, then higher X
        if (mover.position.x > 0) {
          destination = { x: mover.position.x - 1, y: mover.position.y };
        } else if (mover.position.x < 11) {
          destination = { x: mover.position.x + 1, y: mover.position.y };
        }
        // else: stuck at corner, no escape possible - destination remains current position
      }
    }
  }

  return destination;
}

/**
 * Create synthetic idle action.
 *
 * @param character - Character that will idle
 * @param tick - Current tick
 * @returns Idle action with targetCell set to character's position
 */
function createIdleAction(character: Character, tick: number): Action {
  return {
    type: "idle",
    skill: IDLE_SKILL,
    targetCell: character.position,
    targetCharacter: null,
    startedAtTick: tick,
    resolvesAtTick: tick + IDLE_SKILL.tickCost - 1,
  };
}

/**
 * Create skill action (attack or move).
 *
 * @param skill - Skill to execute
 * @param character - Character executing the skill
 * @param target - Target character (must not be null)
 * @param tick - Current tick
 * @returns Action with locked targetCell
 */
function createSkillAction(
  skill: Skill,
  character: Character,
  target: Character,
  tick: number,
): Action {
  const actionType = getActionType(skill);

  let targetCell: Position;
  let targetCharacter: Character | null;

  if (actionType === "attack") {
    // Attack: lock to target's position
    targetCell = target.position;
    targetCharacter = target;
  } else {
    // Move: compute destination
    if (skill.mode === "hold") {
      targetCell = character.position;
    } else {
      targetCell = computeMoveDestination(character, target, skill.mode!);
    }
    targetCharacter = null;
  }

  return {
    type: actionType,
    skill,
    targetCell,
    targetCharacter,
    startedAtTick: tick,
    resolvesAtTick: tick + skill.tickCost - 1,
  };
}

/**
 * Compute decisions for all idle characters.
 *
 * Algorithm (per spec Decision Phase):
 * 1. Skip if character.currentAction !== null (mid-action)
 * 2. Scan character.skills top-to-bottom
 * 3. Skip if skill.enabled === false
 * 4. Check all triggers pass (AND logic: triggers.every(...))
 * 5. Select first skill where all triggers pass
 * 6. Use selector (skill.selectorOverride ?? DEFAULT_SELECTOR) to find target
 * 7. Create Action with locked targetCell
 * 8. If no skills match → create idle action
 *
 * @param state - Read-only snapshot of game state
 * @returns Array of decisions for idle characters
 */
export function computeDecisions(state: Readonly<GameState>): Decision[] {
  const decisions: Decision[] = [];

  for (const character of state.characters) {
    // 1. Skip if mid-action
    if (character.currentAction !== null) {
      continue;
    }

    // 2. Scan skills top-to-bottom to find a valid executable skill
    let action: Action | null = null;

    for (const skill of character.skills) {
      // 3. Skip disabled skills
      if (!skill.enabled) {
        continue;
      }

      // 4. Check all triggers (AND logic)
      const allTriggersPass = skill.triggers.every((trigger) =>
        evaluateTrigger(trigger, character, state.characters),
      );

      if (!allTriggersPass) {
        continue;
      }

      // 5. Skill triggers passed - now validate target and range
      // Special case: hold mode doesn't need a target
      if (skill.mode === "hold") {
        // Create move action targeting own cell
        action = {
          type: "move",
          skill,
          targetCell: character.position,
          targetCharacter: null,
          startedAtTick: state.tick,
          resolvesAtTick: state.tick + skill.tickCost - 1,
        };
        break;
      }

      // 6. Use selector to find target
      const selector = skill.selectorOverride ?? DEFAULT_SELECTOR;
      const target = evaluateSelector(selector, character, state.characters);

      // Check if we have a valid target
      if (!target) {
        // No valid target → continue to next skill
        continue;
      }

      // Determine action type and validate range for attacks
      const actionType = getActionType(skill);

      if (actionType === "attack") {
        // Validate range for attack skills
        if (
          chebyshevDistance(character.position, target.position) > skill.range
        ) {
          // Target out of range → continue to next skill
          continue;
        }
      }

      // 7. Create Action with locked targetCell
      action = createSkillAction(skill, character, target, state.tick);
      break;
    }

    // 8. If no valid skill found → create idle action
    if (action === null) {
      action = createIdleAction(character, state.tick);
    }

    decisions.push({
      characterId: character.id,
      action,
    });
  }

  return decisions;
}

/**
 * Check the battle status based on remaining characters.
 *
 * Victory conditions:
 * - Victory: All enemies eliminated
 * - Defeat: All friendly characters eliminated
 * - Draw: Mutual elimination on same tick
 * - Active: Both factions still have characters alive
 *
 * @param characters - Remaining alive characters
 * @returns Battle status
 */
export function checkBattleStatus(characters: Character[]): BattleStatus {
  const friendlyCount = characters.filter(
    (c) => c.faction === "friendly",
  ).length;
  const enemyCount = characters.filter((c) => c.faction === "enemy").length;

  if (friendlyCount === 0 && enemyCount === 0) {
    return "draw";
  }

  if (friendlyCount === 0) {
    return "defeat";
  }

  if (enemyCount === 0) {
    return "victory";
  }

  return "active";
}

/**
 * Apply decisions to characters by setting their currentAction.
 *
 * @param characters - Characters to update
 * @param decisions - Decisions to apply
 * @returns New array with updated characters (immutable)
 */
export function applyDecisions(
  characters: Character[],
  decisions: Decision[],
): Character[] {
  // Create a map for O(1) lookup
  const decisionMap = new Map<string, Action>();
  for (const decision of decisions) {
    decisionMap.set(decision.characterId, decision.action);
  }

  // Map characters, setting currentAction if decision exists
  return characters.map((character) => {
    const action = decisionMap.get(character.id);
    if (action) {
      return { ...character, currentAction: action };
    }
    return character;
  });
}

/**
 * Clear currentAction for characters whose actions resolved this tick.
 *
 * @param characters - Characters to check
 * @param tick - Current tick
 * @returns New array with cleared actions (immutable)
 */
export function clearResolvedActions(
  characters: Character[],
  tick: number,
): Character[] {
  return characters.map((character) => {
    if (character.currentAction?.resolvesAtTick === tick) {
      return { ...character, currentAction: null };
    }
    return character;
  });
}

/**
 * Evaluate all skills for a character and return detailed results.
 *
 * This function mirrors the decision logic in computeDecisions() but
 * returns structured data for UI display instead of creating actions.
 *
 * @param character - Character to evaluate skills for
 * @param allCharacters - All characters in battle (for targeting)
 * @returns Detailed evaluation results for all skills
 */
export function evaluateSkillsForCharacter(
  character: Character,
  allCharacters: Character[],
): CharacterEvaluationResult {
  // 1. Check if mid-action
  if (character.currentAction !== null) {
    return {
      characterId: character.id,
      isMidAction: true,
      currentAction: character.currentAction,
      skillEvaluations: [],
      selectedSkillIndex: null,
    };
  }

  const evaluations: SkillEvaluationResult[] = [];
  let selectedIndex: number | null = null;
  let currentIndex = 0;

  for (const skill of character.skills) {
    // Already found a valid skill - mark remaining as skipped
    if (selectedIndex !== null) {
      evaluations.push({ skill, status: "skipped" });
      currentIndex++;
      continue;
    }

    // Check disabled
    if (!skill.enabled) {
      evaluations.push({
        skill,
        status: "rejected",
        rejectionReason: "disabled",
      });
      currentIndex++;
      continue;
    }

    // Check triggers
    const failedTriggers = skill.triggers.filter(
      (t) => !evaluateTrigger(t, character, allCharacters),
    );
    if (failedTriggers.length > 0) {
      evaluations.push({
        skill,
        status: "rejected",
        rejectionReason: "trigger_failed",
        failedTriggers,
      });
      currentIndex++;
      continue;
    }

    // Special case: hold mode doesn't need target
    if (skill.mode === "hold") {
      evaluations.push({ skill, status: "selected" });
      selectedIndex = currentIndex;
      currentIndex++;
      continue;
    }

    // Evaluate selector
    const selector = skill.selectorOverride ?? DEFAULT_SELECTOR;
    const target = evaluateSelector(selector, character, allCharacters);

    if (!target) {
      evaluations.push({
        skill,
        status: "rejected",
        rejectionReason: "no_target",
      });
      currentIndex++;
      continue;
    }

    // Check range for attacks
    const actionType = getActionType(skill);
    if (actionType === "attack") {
      const distance = chebyshevDistance(character.position, target.position);
      if (distance > skill.range) {
        evaluations.push({
          skill,
          status: "rejected",
          rejectionReason: "out_of_range",
          target,
          distance,
        });
        currentIndex++;
        continue;
      }
    }

    // Skill selected!
    evaluations.push({ skill, status: "selected", target });
    selectedIndex = currentIndex;
    currentIndex++;
  }

  return {
    characterId: character.id,
    isMidAction: false,
    skillEvaluations: evaluations,
    selectedSkillIndex: selectedIndex,
  };
}
