/**
 * Decision logic for character skill selection.
 * Implements the Decision Phase: scanning skills top-to-bottom, evaluating triggers,
 * selecting targets, and creating actions.
 */

import {
  GameState,
  Character,
  Action,
  Skill,
  SkillEvaluationResult,
  CharacterEvaluationResult,
  hexDistance,
} from "./types";
import { evaluateTrigger } from "./triggers";
import { evaluateTargetCriterion } from "./selectors";
import {
  getActionType,
  createSkillAction,
  createIdleAction,
} from "./game-actions";

/**
 * Check if a character is busy with a non-idle action.
 * Idle characters can re-decide each tick (idle actions are transparent to decisions).
 */
function isBusyWithAction(character: Character): boolean {
  return (
    character.currentAction !== null && character.currentAction.type !== "idle"
  );
}

/**
 * Synthetic idle skill for when no valid skill is selected.
 */
export const IDLE_SKILL: Skill = {
  id: "__idle__",
  instanceId: "__idle__",
  name: "Idle",
  actionType: "attack", // Idle doesn't use actionType, but field is required
  tickCost: 1,
  range: 0,
  behavior: "",
  enabled: true,
  triggers: [],
  target: "enemy",
  criterion: "nearest",
};

/**
 * Decision represents a character's chosen action for the current tick.
 */
export interface Decision {
  characterId: string;
  action: Action;
  evaluations?: CharacterEvaluationResult; // Optional: populated by computeDecisions for UI display
}

/**
 * Evaluate a single skill for execution eligibility.
 * Returns an action if the skill can be executed, null otherwise.
 */
function tryExecuteSkill(
  skill: Skill,
  character: Character,
  allCharacters: Character[],
  tick: number,
): Action | null {
  // Skip disabled skills
  if (!skill.enabled) {
    return null;
  }

  // Skip skills on cooldown
  if (skill.cooldownRemaining && skill.cooldownRemaining > 0) {
    return null;
  }

  // Graceful degradation for legacy "hold" behavior
  if (skill.behavior === "hold") {
    console.warn(
      `[game-decisions] Deprecated "hold" behavior found on skill "${skill.name}". ` +
        `Treating as disabled.`,
    );
    return null;
  }

  // Check all triggers (AND logic)
  const allTriggersPass = skill.triggers.every((trigger) =>
    evaluateTrigger(trigger, character, allCharacters),
  );
  if (!allTriggersPass) {
    return null;
  }

  // Use target/criterion to find target
  const target = evaluateTargetCriterion(
    skill.target,
    skill.criterion,
    character,
    allCharacters,
  );
  if (!target) {
    return null;
  }

  // Validate action-specific conditions
  const actionType = getActionType(skill);

  // Range check only applies to attack and heal, not move actions
  if (actionType === "attack" || actionType === "heal") {
    const distance = hexDistance(character.position, target.position);
    if (distance > skill.range) {
      return null;
    }
    // Reject heal if target is at full HP
    if (actionType === "heal" && target.hp >= target.maxHp) {
      return null;
    }
  }

  // Create action with locked targetCell
  return createSkillAction(skill, character, target, tick, allCharacters);
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
 * 6. Use target + criterion (skill.target, skill.criterion) to find target
 * 7. Create Action with locked targetCell
 * 8. If no skills match → create idle action
 *
 * @param state - Read-only snapshot of game state
 * @returns Array of decisions for idle characters
 */
export function computeDecisions(state: Readonly<GameState>): Decision[] {
  const decisions: Decision[] = [];

  for (const character of state.characters) {
    // 1. Skip if mid-action (but idle characters can re-decide)
    if (isBusyWithAction(character)) {
      continue;
    }

    // 2. Get detailed evaluation results for UI display
    const evaluations = evaluateSkillsForCharacter(character, state.characters);

    // 3. Scan skills top-to-bottom to find a valid executable skill
    let action: Action | null = null;

    for (const skill of character.skills) {
      action = tryExecuteSkill(skill, character, state.characters, state.tick);
      if (action !== null) {
        break;
      }
    }

    // 4. If no valid skill found → create idle action
    if (action === null) {
      action = createIdleAction(character, state.tick);
    }

    decisions.push({
      characterId: character.id,
      action,
      evaluations,
    });
  }

  return decisions;
}

/**
 * Evaluate a single skill and return a detailed result for UI display.
 */
function evaluateSingleSkill(
  skill: Skill,
  character: Character,
  allCharacters: Character[],
): SkillEvaluationResult {
  if (!skill.enabled) {
    return { skill, status: "rejected", rejectionReason: "disabled" };
  }

  if (skill.cooldownRemaining && skill.cooldownRemaining > 0) {
    return { skill, status: "rejected", rejectionReason: "on_cooldown" };
  }

  if (skill.behavior === "hold") {
    console.warn(
      `[game-decisions] Deprecated "hold" behavior found on skill "${skill.name}". ` +
        `Treating as disabled.`,
    );
    return { skill, status: "rejected", rejectionReason: "disabled" };
  }

  const failedTriggers = skill.triggers.filter(
    (t) => !evaluateTrigger(t, character, allCharacters),
  );
  if (failedTriggers.length > 0) {
    return {
      skill,
      status: "rejected",
      rejectionReason: "trigger_failed",
      failedTriggers,
    };
  }

  const target = evaluateTargetCriterion(
    skill.target,
    skill.criterion,
    character,
    allCharacters,
  );
  if (!target) {
    return { skill, status: "rejected", rejectionReason: "no_target" };
  }

  const actionType = getActionType(skill);
  if (actionType === "attack" || actionType === "heal") {
    const distance = hexDistance(character.position, target.position);
    if (distance > skill.range) {
      return {
        skill,
        status: "rejected",
        rejectionReason: "out_of_range",
        target,
        distance,
      };
    }
  }
  if (actionType === "heal" && target.hp >= target.maxHp) {
    return { skill, status: "rejected", rejectionReason: "no_target" };
  }

  return { skill, status: "selected", target };
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
  // 1. Check if mid-action (idle characters can re-decide)
  if (isBusyWithAction(character)) {
    return {
      characterId: character.id,
      isMidAction: true,
      currentAction: character.currentAction ?? undefined,
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

    const evaluation = evaluateSingleSkill(skill, character, allCharacters);
    evaluations.push(evaluation);
    if (evaluation.status === "selected") {
      selectedIndex = currentIndex;
    }
    currentIndex++;
  }

  return {
    characterId: character.id,
    isMidAction: false,
    skillEvaluations: evaluations,
    selectedSkillIndex: selectedIndex,
  };
}
