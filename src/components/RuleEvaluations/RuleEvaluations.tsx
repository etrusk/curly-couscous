import {
  useGameStore,
  selectSelectedCharacter,
  selectTick,
} from "../../stores/gameStore";
import type { Trigger, Action } from "../../engine/types";
import styles from "./RuleEvaluations.module.css";

/**
 * Format a single trigger for display.
 */
function formatTrigger(trigger: Trigger): string {
  switch (trigger.type) {
    case "always":
      return "always";
    case "enemy_in_range":
      return `enemy_in_range ${trigger.value}`;
    case "ally_in_range":
      return `ally_in_range ${trigger.value}`;
    case "hp_below":
      return `hp_below ${trigger.value}%`;
    case "my_cell_targeted_by_enemy":
      return "my_cell_targeted";
    default:
      return "unknown trigger";
  }
}

/**
 * Format trigger array for display with AND joining.
 */
function formatTriggers(triggers: Trigger[]): string {
  if (triggers.length === 0) return "always";
  return triggers.map(formatTrigger).join(" AND ");
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
  const currentTick = useGameStore(selectTick);

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

  const { currentAction } = selectedCharacter;
  const actionDisplay = formatActionDisplay(currentAction);
  const resolutionText =
    currentAction && currentAction.type !== "idle"
      ? formatResolutionText(currentAction, currentTick)
      : "";

  return (
    <div
      className={styles.panel}
      role="region"
      aria-label={`Rule Evaluations: ${selectedCharacter.name}`}
    >
      <h2 className={styles.header}>
        Rule Evaluations: {selectedCharacter.name}
      </h2>

      {/* Current Action Section */}
      <div className={styles.currentActionSection}>
        <h3 className={styles.sectionHeader}>Current Action</h3>
        <div className={styles.currentAction}>
          <div className={styles.actionDisplay}>{actionDisplay}</div>
          {currentAction && currentAction.type === "idle" && (
            <div className={styles.actionNote}>No valid skill triggered</div>
          )}
          {currentAction && currentAction.type !== "idle" && (
            <div className={styles.actionTiming}>{resolutionText}</div>
          )}
        </div>
      </div>

      {/* Skill Priority Section */}
      <div className={styles.skillPrioritySection}>
        <h3 className={styles.sectionHeader}>Skill Priority</h3>
        <ol className={styles.skillList} role="list">
          {selectedCharacter.skills.map((skill, index) => {
            const isActiveSkill =
              currentAction?.type !== "idle" &&
              currentAction?.skill.id === skill.id;
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
                  if {formatTriggers(skill.triggers)}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
