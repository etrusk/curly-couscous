import type {
  Action,
  SkillEvaluationResult,
  Trigger,
} from "../../engine/types";
import { slotPositionToLetter } from "../../utils/letterMapping";

/**
 * Format action summary for collapsed header (skill name only, no emoji).
 */
export function formatActionSummary(action: Action | null): string {
  if (!action) {
    return "Awaiting...";
  }

  if (action.type === "idle") {
    return "Idle";
  }

  if (action.type === "attack") {
    return action.skill.name;
  }

  if (action.type === "heal") {
    return action.skill.name;
  }

  // Move action
  return "Move";
}

/**
 * Format trigger with parameter for debugging display.
 */
export function formatTrigger(trigger: Trigger): string {
  const prefix = trigger.negated ? "NOT " : "";
  const scopePrefix = trigger.scope !== "enemy" ? `${trigger.scope}:` : "";
  if (trigger.conditionValue !== undefined) {
    return `${prefix}${scopePrefix}${trigger.condition}(${trigger.conditionValue})`;
  }
  return `${prefix}${scopePrefix}${trigger.condition}`;
}

/**
 * Format rejection reason for debugging display (compact format).
 */
export function formatRejectionReasonCompact(
  result: SkillEvaluationResult,
): string {
  switch (result.rejectionReason) {
    case "disabled":
      return "disabled";
    case "trigger_failed":
      if (result.failedTrigger) {
        return `trigger_failed: ${formatTrigger(result.failedTrigger)}`;
      }
      return "trigger_failed";
    case "no_target":
      return "no_target";
    case "out_of_range":
      return `out_of_range (distance=${result.distance}, range=${result.skill.range})`;
    case "filter_failed":
      if (result.failedFilter) {
        const prefix = result.failedFilter.negated ? "NOT " : "";
        const qualStr = result.failedFilter.qualifier
          ? `(${result.failedFilter.qualifier.type}:${result.failedFilter.qualifier.id})`
          : result.failedFilter.conditionValue !== undefined
            ? `(${result.failedFilter.conditionValue})`
            : "";
        return `filter_failed: ${prefix}${result.failedFilter.condition}${qualStr}`;
      }
      return "filter_failed";
    case "on_cooldown":
      return "on_cooldown";
    default:
      return "";
  }
}

/**
 * Format evaluation status for debugging display.
 */
export function formatEvaluationStatus(result: SkillEvaluationResult): string {
  if (result.status === "selected") {
    const targetInfo = result.target
      ? ` -> ${slotPositionToLetter(result.target.slotPosition)}`
      : "";
    return `SELECTED${targetInfo}`;
  }
  return `rejected (${formatRejectionReasonCompact(result)})`;
}

/**
 * Format rejection reason for display (legacy card-based format).
 */
export function formatRejectionReason(result: SkillEvaluationResult): string {
  switch (result.rejectionReason) {
    case "disabled":
      return "[disabled]";
    case "trigger_failed":
      return "trigger not met";
    case "no_target":
      return "no target";
    case "out_of_range":
      return `target out of range (${result.distance} > ${result.skill.range})`;
    case "filter_failed":
      return "filter condition not met";
    case "on_cooldown":
      return "on cooldown";
    default:
      return "";
  }
}

/**
 * Format action display text.
 */
export function formatActionDisplay(action: Action | null): string {
  if (!action) {
    return "Awaiting decision...";
  }

  if (action.type === "idle") {
    return "💤 Idle";
  }

  if (action.type === "attack") {
    const targetName = action.targetCharacter
      ? slotPositionToLetter(action.targetCharacter.slotPosition)
      : "Unknown target";
    return `⚔️ ${action.skill.name} → ${targetName}`;
  }

  if (action.type === "heal") {
    const targetName = action.targetCharacter
      ? slotPositionToLetter(action.targetCharacter.slotPosition)
      : "Unknown target";
    return `💚 ${action.skill.name} → ${targetName}`;
  }

  // Move action
  const behavior = action.skill.behavior;
  if (behavior === "towards") {
    return "🚶 Move towards";
  } else if (behavior === "away") {
    return "🚶 Move away";
  }

  return "Unknown action";
}

/**
 * Format resolution timing text.
 */
export function formatResolutionText(
  action: Action,
  currentTick: number,
): string {
  const ticksRemaining = action.resolvesAtTick - currentTick;
  if (ticksRemaining === 0) {
    return "Resolves: this tick";
  } else if (ticksRemaining === 1) {
    return "Resolves: next tick";
  } else {
    return `Resolves: in ${ticksRemaining} ticks`;
  }
}
