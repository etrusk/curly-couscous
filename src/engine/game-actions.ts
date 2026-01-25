/**
 * Action creation utilities for skill execution.
 * Functions to create attack, move, and idle actions with proper targeting.
 */

import { Skill, Character, Action, Position } from "./types";
import { computeMoveDestination } from "./game-movement";

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
 * Create synthetic idle action.
 *
 * @param character - Character that will idle
 * @param tick - Current tick
 * @returns Idle action with targetCell set to character's position
 */
export function createIdleAction(character: Character, tick: number): Action {
  // Import IDLE_SKILL from game-decisions to avoid duplication
  const IDLE_SKILL = {
    id: "__idle__",
    name: "Idle",
    tickCost: 1,
    range: 0,
    enabled: true,
    triggers: [],
  };

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

  if (actionType === "attack") {
    // Attack: lock to target's position
    targetCell = target.position;
    targetCharacter = target;
  } else {
    // Move: compute destination
    if (skill.mode === "hold") {
      targetCell = character.position;
    } else {
      targetCell = computeMoveDestination(
        character,
        target,
        skill.mode!,
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
    resolvesAtTick: tick + skill.tickCost - 1,
  };
}
