import {
  useGameStore,
  selectSelectedCharacter,
  selectTick,
  selectNextTickDecision,
  selectCharacters,
} from "../../stores/gameStore";
import type { Trigger, Action, Skill, Character } from "../../engine/types";
import { evaluateTrigger } from "../../engine/triggers";
import styles from "./RuleEvaluations.module.css";

/**
 * Trigger evaluation result with pass/fail status.
 */
interface TriggerEvaluationResult {
  trigger: Trigger;
  passed: boolean;
}

/**
 * Evaluate all triggers for a skill and return pass/fail status for each.
 */
function evaluateSkillTriggers(
  skill: Skill,
  character: Character,
  allCharacters: Character[],
): TriggerEvaluationResult[] {
  if (skill.triggers.length === 0) {
    return [{ trigger: { type: "always" }, passed: true }];
  }
  return skill.triggers.map((trigger) => ({
    trigger,
    passed: evaluateTrigger(trigger, character, allCharacters),
  }));
}

/**
 * Format a single trigger for display with pass/fail status.
 */
function formatTrigger(trigger: Trigger, passed: boolean): string {
  const status = passed ? " ✓" : " ✗";
  switch (trigger.type) {
    case "always":
      return `always${status}`;
    case "enemy_in_range":
      return `enemy_in_range ${trigger.value}${status}`;
    case "ally_in_range":
      return `ally_in_range ${trigger.value}${status}`;
    case "hp_below":
      return `hp_below ${trigger.value}%${status}`;
    case "my_cell_targeted_by_enemy":
      return `my_cell_targeted${status}`;
    default:
      return "unknown trigger";
  }
}

/**
 * Format trigger array for display with AND joining and pass/fail status.
 */
function formatTriggers(evaluations: TriggerEvaluationResult[]): string {
  if (evaluations.length === 0) return "always ✓";
  return evaluations
    .map((e) => formatTrigger(e.trigger, e.passed))
    .join(" AND ");
}

/**
 * Format action display text.
 */
function formatActionDisplay(action: Action | null): string {
  if (!action) {
    return "Awaiting decision...";
  }

  if (action.type === "idle") {
    return "💤 Idle";
  }

  if (action.type === "attack") {
    const targetName = action.targetCharacter?.name || "Unknown target";
    return `⚔️ ${action.skill.name} → ${targetName}`;
  }

  // Move action
  const mode = action.skill.mode;
  if (mode === "towards") {
    return "🚶 Move towards";
  } else if (mode === "away") {
    return "🚶 Move away";
  } else if (mode === "hold") {
    return "🚶 Move (hold)";
  }

  return "Unknown action";
}

/**
 * Format resolution timing text.
 */
function formatResolutionText(action: Action, currentTick: number): string {
  const ticksRemaining = action.resolvesAtTick - currentTick;
  if (ticksRemaining === 0) {
    return "Resolves: this tick";
  } else if (ticksRemaining === 1) {
    return "Resolves: next tick";
  } else {
    return `Resolves: in ${ticksRemaining} ticks`;
  }
}

export function RuleEvaluations() {
  const selectedCharacter = useGameStore(selectSelectedCharacter);
  const allCharacters = useGameStore(selectCharacters);
  const currentTick = useGameStore(selectTick);
  const nextAction = useGameStore(
    selectNextTickDecision(selectedCharacter?.id ?? ""),
  );

  if (!selectedCharacter) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.header}>Rule Evaluations</h2>
        <p className={styles.placeholder}>
          Click a character on the grid to see AI decisions
        </p>
      </div>
    );
  }

  const actionDisplay = formatActionDisplay(nextAction);
  const resolutionText =
    nextAction && nextAction.type !== "idle"
      ? formatResolutionText(nextAction, currentTick)
      : "";

  // Find index of active skill (for collapsible section)
  const activeSkillIndex = selectedCharacter.skills.findIndex(
    (s) => nextAction?.type !== "idle" && nextAction?.skill.id === s.id,
  );

  // Skills up to and including active skill (always shown)
  const visibleSkills =
    activeSkillIndex >= 0
      ? selectedCharacter.skills.slice(0, activeSkillIndex + 1)
      : selectedCharacter.skills;

  // Skills below active skill (collapsible)
  const collapsedSkills =
    activeSkillIndex >= 0
      ? selectedCharacter.skills.slice(activeSkillIndex + 1)
      : [];

  return (
    <div
      className={styles.panel}
      role="region"
      aria-label={`Rule Evaluations: ${selectedCharacter.name}`}
    >
      <h2 className={styles.header}>
        Rule Evaluations: {selectedCharacter.name}
      </h2>

      {/* Next Action Section */}
      <div className={styles.nextActionSection}>
        <h3 className={styles.sectionHeader}>Next Action</h3>
        <div className={styles.nextAction}>
          <div className={styles.actionDisplay}>{actionDisplay}</div>
          {nextAction && nextAction.type === "idle" && (
            <div className={styles.actionNote}>No valid skill triggered</div>
          )}
          {nextAction && nextAction.type !== "idle" && (
            <div className={styles.actionTiming}>{resolutionText}</div>
          )}
        </div>
      </div>

      {/* Skill Priority Section */}
      <div className={styles.skillPrioritySection}>
        <h3 className={styles.sectionHeader}>Skill Priority</h3>
        <ol className={styles.skillList} role="list">
          {visibleSkills.map((skill, index) => {
            const isActiveSkill =
              nextAction?.type !== "idle" && nextAction?.skill.id === skill.id;
            const triggerEvaluations = evaluateSkillTriggers(
              skill,
              selectedCharacter,
              allCharacters,
            );
            return (
              <li
                key={skill.id}
                className={`${styles.skillItem} ${isActiveSkill ? styles.activeSkill : ""}`}
              >
                <div className={styles.skillName}>
                  {index + 1}. {skill.name}{" "}
                  {!skill.enabled && (
                    <span className={styles.disabled}>[disabled]</span>
                  )}
                </div>
                <div className={styles.skillTrigger}>
                  if {formatTriggers(triggerEvaluations)}
                </div>
              </li>
            );
          })}
        </ol>

        {/* Collapsible lower-priority skills */}
        {collapsedSkills.length > 0 && (
          <details className={styles.collapsedSkills}>
            <summary className={styles.collapsedSummary}>
              Show {collapsedSkills.length} more skill
              {collapsedSkills.length > 1 ? "s" : ""}
            </summary>
            <ol
              className={styles.skillList}
              role="list"
              start={activeSkillIndex + 2}
            >
              {collapsedSkills.map((skill, index) => {
                const absoluteIndex = activeSkillIndex + 1 + index;
                const triggerEvaluations = evaluateSkillTriggers(
                  skill,
                  selectedCharacter,
                  allCharacters,
                );
                return (
                  <li key={skill.id} className={styles.skillItem}>
                    <div className={styles.skillName}>
                      {absoluteIndex + 1}. {skill.name}{" "}
                      {!skill.enabled && (
                        <span className={styles.disabled}>[disabled]</span>
                      )}
                    </div>
                    <div className={styles.skillTrigger}>
                      if {formatTriggers(triggerEvaluations)}
                    </div>
                  </li>
                );
              })}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
}
