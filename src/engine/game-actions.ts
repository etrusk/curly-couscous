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
 * @returns 'attack' if skill has damage, 'heal' if skill has healing, 'move' if skill has mode
 * @throws Error if skill has multiple action properties or none
 */
export function getActionType(skill: Skill): "attack" | "move" | "heal" {
  const hasDamage = skill.damage !== undefined;
  const hasHealing = skill.healing !== undefined;
  const hasMode = skill.mode !== undefined;

  // Count how many action-defining properties are set
  const actionProperties = [hasDamage, hasHealing, hasMode].filter(
    Boolean,
  ).length;

  if (actionProperties === 0) {
    throw new Error(`Skill ${skill.id} must have damage, healing, or mode`);
  }

  if (actionProperties > 1) {
    throw new Error(
      `Skill ${skill.id} can only have one of damage, healing, or mode`,
    );
  }

  if (hasDamage) return "attack";
  if (hasHealing) return "heal";
  return "move";
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
    instanceId: "__idle__",
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

  if (actionType === "attack" || actionType === "heal") {
    // Attack and Heal: lock to target's current position (cell-based targeting)
    targetCell = target.position;
    targetCharacter = target;
  } else {
    // Move: compute destination
    targetCell = computeMoveDestination(
      character,
      target,
      skill.mode!,
      allCharacters,
    );
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
