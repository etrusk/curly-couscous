import {
  useGameStore,
  selectSelectedCharacter,
  selectTick,
  selectNextTickDecision,
  selectCharacters,
} from "../../stores/gameStore";
import type {
  Action,
  SkillEvaluationResult,
  Character,
  CharacterEvaluationResult,
} from "../../engine/types";
import { evaluateSkillsForCharacter } from "../../engine/game";
import styles from "./RuleEvaluations.module.css";

/**
 * Format rejection reason for display.
 */
function formatRejectionReason(result: SkillEvaluationResult): string {
  switch (result.rejectionReason) {
    case "disabled":
      return "[disabled]";
    case "trigger_failed":
      return "trigger not met";
    case "no_target":
      return "no target";
    case "out_of_range":
      return `target out of range (${result.distance} > ${result.skill.range})`;
    default:
      return "";
  }
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

/**
 * Display mid-action state for a character.
 */
function MidActionDisplay({
  characterName,
  action,
  currentTick,
}: {
  characterName: string;
  action: Action;
  currentTick: number;
}) {
  const resolutionText = formatResolutionText(action, currentTick);
  return (
    <div
      className={styles.panel}
      role="region"
      aria-label={`Rule Evaluations: ${characterName}`}
    >
      <h2 className={styles.header}>Rule Evaluations: {characterName}</h2>
      <div className={styles.nextActionSection}>
        <h3 className={styles.sectionHeader}>Continuing Action</h3>
        <div className={styles.nextAction}>
          <div className={styles.actionDisplay}>
            {formatActionDisplay(action)}
          </div>
          <div className={styles.actionTiming}>{resolutionText}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Render skill list items for visible skills.
 */
function renderSkillListItems(
  skills: SkillEvaluationResult[],
  startIndex: number = 0,
  selectedIndex: number | null = null,
) {
  return skills.map((evalResult, index) => {
    const absoluteIndex = startIndex + index;
    const isSelected =
      selectedIndex !== null && absoluteIndex === selectedIndex;
    const rejectionReason =
      evalResult.status === "rejected" ? formatRejectionReason(evalResult) : "";

    return (
      <li
        key={evalResult.skill.id}
        className={`${styles.skillItem} ${isSelected ? styles.activeSkill : ""}`}
      >
        <div className={styles.skillName}>
          {isSelected && <span className={styles.selectedArrow}>→ </span>}
          {absoluteIndex + 1}. {evalResult.skill.name}
          {rejectionReason && (
            <span className={styles.rejectionReason}> — {rejectionReason}</span>
          )}
        </div>
      </li>
    );
  });
}

/**
 * Render the main content when a character is selected.
 */
function renderSelectedCharacterContent(
  selectedCharacter: Character,
  allCharacters: Character[],
  currentTick: number,
  nextAction: Action | null,
) {
  // Evaluate skills for the selected character
  const evaluation: CharacterEvaluationResult = evaluateSkillsForCharacter(
    selectedCharacter,
    allCharacters,
  );

  // Handle mid-action display
  if (evaluation.isMidAction && evaluation.currentAction) {
    return (
      <MidActionDisplay
        characterName={selectedCharacter.name}
        action={evaluation.currentAction}
        currentTick={currentTick}
      />
    );
  }

  const actionDisplay = formatActionDisplay(nextAction);
  const resolutionText =
    nextAction && nextAction.type !== "idle"
      ? formatResolutionText(nextAction, currentTick)
      : "";

  // Find index of selected skill (for collapsible section)
  const selectedSkillIndex = evaluation.selectedSkillIndex;

  // Skills up to and including selected skill (always shown)
  const visibleSkills =
    selectedSkillIndex !== null
      ? evaluation.skillEvaluations.slice(0, selectedSkillIndex + 1)
      : evaluation.skillEvaluations;

  // Skills below selected skill (collapsible)
  const collapsedSkills =
    selectedSkillIndex !== null
      ? evaluation.skillEvaluations.slice(selectedSkillIndex + 1)
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
            <div className={styles.actionNote}>💤 No valid action</div>
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
          {renderSkillListItems(visibleSkills, 0, selectedSkillIndex)}
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
              start={(selectedSkillIndex ?? -1) + 2}
            >
              {renderSkillListItems(
                collapsedSkills,
                (selectedSkillIndex ?? -1) + 1,
                null,
              )}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
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

  return renderSelectedCharacterContent(
    selectedCharacter,
    allCharacters,
    currentTick,
    nextAction,
  );
}
