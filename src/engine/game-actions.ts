/**
 * Action creation utilities for skill execution.
 * Functions to create attack, move, and idle actions with proper targeting.
 */

import { Skill, Character, Action, Position } from "./types";
import {
  computeMoveDestination,
  computeMultiStepDestination,
  computePluralMoveDestination,
  computeMultiStepPluralDestination,
} from "./game-movement";

/**
 * Get action type from skill.
 *
 * @param skill - Skill to check
 * @returns Action type from skill.actionType field
 */
export function getActionType(
  skill: Skill,
): "attack" | "move" | "heal" | "interrupt" | "charge" {
  return skill.actionType;
}

/**
 * Create synthetic idle action.
 *
 * @param character - Character that will idle
 * @param tick - Current tick
 * @returns Idle action with targetCell set to character's position
 */
export function createIdleAction(character: Character, tick: number): Action {
  // Import IDLE_SKILL from game-decisions to avoid duplication
  const IDLE_SKILL: Skill = {
    id: "__idle__",
    instanceId: "__idle__",
    name: "Idle",
    actionType: "attack" as const, // Idle doesn't use actionType, but field is required
    tickCost: 1,
    range: 0,
    behavior: "",
    enabled: true,
    trigger: { scope: "enemy" as const, condition: "always" as const },
    target: "enemy",
    criterion: "nearest",
  };

  return {
    type: "idle",
    skill: IDLE_SKILL,
    targetCell: character.position,
    targetCharacter: null,
    startedAtTick: tick,
    resolvesAtTick: tick + IDLE_SKILL.tickCost,
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
export function createSkillAction(
  skill: Skill,
  character: Character,
  target: Character,
  tick: number,
  allCharacters: Character[],
): Action {
  const actionType = getActionType(skill);

  let targetCell: Position;
  let targetCharacter: Character | null;

  if (
    actionType === "attack" ||
    actionType === "heal" ||
    actionType === "interrupt" ||
    actionType === "charge"
  ) {
    // Attack, Heal, Interrupt, and Charge: lock to target's current position (cell-based targeting)
    targetCell = target.position;
    targetCharacter = target;
  } else {
    // Move: compute destination (supports multi-step via distance)
    const distance = skill.distance ?? 1;
    if (distance > 1) {
      targetCell = computeMultiStepDestination(
        character,
        target,
        skill.behavior as "towards" | "away",
        allCharacters,
        distance,
      );
    } else {
      targetCell = computeMoveDestination(
        character,
        target,
        skill.behavior as "towards" | "away",
        allCharacters,
      );
    }
    targetCharacter = null;
  }

  return {
    type: actionType,
    skill,
    targetCell,
    targetCharacter,
    startedAtTick: tick,
    resolvesAtTick: tick + skill.tickCost,
  };
}

/**
 * Create move action for plural targets (enemies/allies groups).
 *
 * @param skill - Move skill with plural target
 * @param character - Character executing the skill
 * @param targets - Target group (all enemies or all allies)
 * @param tick - Current tick
 * @param allCharacters - All characters on the battlefield
 * @returns Move action with computed targetCell
 */
export function createPluralMoveAction(
  skill: Skill,
  character: Character,
  targets: Character[],
  tick: number,
  allCharacters: Character[],
): Action {
  const distance = skill.distance ?? 1;
  let targetCell: Position;
  if (distance > 1) {
    targetCell = computeMultiStepPluralDestination(
      character,
      targets,
      skill.behavior as "towards" | "away",
      allCharacters,
      distance,
    );
  } else {
    targetCell = computePluralMoveDestination(
      character,
      targets,
      skill.behavior as "towards" | "away",
      allCharacters,
    );
  }

  return {
    type: "move",
    skill,
    targetCell,
    targetCharacter: null,
    startedAtTick: tick,
    resolvesAtTick: tick + skill.tickCost,
  };
}
