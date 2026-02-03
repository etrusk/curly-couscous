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
  Selector,
  SkillEvaluationResult,
  CharacterEvaluationResult,
  hexDistance,
} from "./types";
import { evaluateTrigger } from "./triggers";
import { evaluateSelector } from "./selectors";
import {
  getActionType,
  createSkillAction,
  createIdleAction,
} from "./game-actions";

/**
 * Default selector when skill doesn't specify selectorOverride.
 */
export const DEFAULT_SELECTOR: Selector = { type: "nearest_enemy" };

/**
 * Synthetic idle skill for when no valid skill is selected.
 */
export const IDLE_SKILL: Skill = {
  id: "__idle__",
  name: "Idle",
  tickCost: 1,
  range: 0,
  enabled: true,
  triggers: [],
};

/**
 * Decision represents a character's chosen action for the current tick.
 */
export interface Decision {
  characterId: string;
  action: Action;
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

      // Graceful degradation for legacy "hold" mode
      if ((skill.mode as string) === "hold") {
        console.warn(
          `[game-decisions] Deprecated "hold" mode found on skill "${skill.name}". ` +
            `Treating as disabled.`,
        );
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

      // 6. Use selector to find target
      const selector = skill.selectorOverride ?? DEFAULT_SELECTOR;
      const target = evaluateSelector(selector, character, state.characters);

      // Check if we have a valid target
      if (!target) {
        // No valid target → continue to next skill
        continue;
      }

      // Determine action type and validate
      const actionType = getActionType(skill);

      if (actionType === "attack") {
        // Validate range for attack skills
        if (hexDistance(character.position, target.position) > skill.range) {
          // Target out of range → continue to next skill
          continue;
        }
      }

      if (actionType === "heal") {
        // Validate range for heal skills
        if (hexDistance(character.position, target.position) > skill.range) {
          // Target out of range → continue to next skill
          continue;
        }
        // Reject if target is at full HP
        if (target.hp >= target.maxHp) {
          // Target at full HP → continue to next skill
          continue;
        }
      }

      // 7. Create Action with locked targetCell
      action = createSkillAction(
        skill,
        character,
        target,
        state.tick,
        state.characters,
      );
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

    // Graceful degradation for legacy "hold" mode
    if ((skill.mode as string) === "hold") {
      console.warn(
        `[game-decisions] Deprecated "hold" mode found on skill "${skill.name}". ` +
          `Treating as disabled.`,
      );
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
      const distance = hexDistance(character.position, target.position);
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

    // Check range and full HP for heals
    if (actionType === "heal") {
      const distance = hexDistance(character.position, target.position);
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
      if (target.hp >= target.maxHp) {
        evaluations.push({
          skill,
          status: "rejected",
          rejectionReason: "no_target",
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
