/**
 * CharacterTooltip - Portal-rendered tooltip displaying rule evaluations for hovered character.
 * Renders with smart positioning to avoid viewport edges.
 */

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  useGameStore,
  selectCharacterById,
  selectNextTickDecision,
  selectTick,
  selectCharacters,
} from "../../stores/gameStore";
import type {
  Action,
  SkillEvaluationResult,
  CharacterEvaluationResult,
} from "../../engine/types";
import { evaluateSkillsForCharacter } from "../../engine/game";
import { slotPositionToLetter } from "../../utils/letterMapping";
import {
  formatActionDisplay,
  formatResolutionText,
  formatRejectionReason,
} from "../RuleEvaluations/rule-evaluations-formatters";
import styles from "./CharacterTooltip.module.css";

export interface CharacterTooltipProps {
  characterId: string;
  anchorRect: DOMRect;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Calculate smart tooltip position based on anchor rect and viewport.
 */
function calculateTooltipPosition(
  anchorRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
): { top: number; left: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const OFFSET = 12; // Gap between token and tooltip
  const MARGIN = 8; // Minimum distance from viewport edge

  let left: number;
  let top: number;

  // Horizontal positioning
  if (anchorRect.right + OFFSET + tooltipWidth + MARGIN < viewportWidth) {
    // Right of token (preferred)
    left = anchorRect.right + OFFSET;
  } else if (anchorRect.left - OFFSET - tooltipWidth > MARGIN) {
    // Left of token
    left = anchorRect.left - OFFSET - tooltipWidth;
  } else {
    // Fallback: align with left edge of token
    left = Math.max(MARGIN, anchorRect.left);
  }

  // Vertical positioning
  const tokenCenterY = anchorRect.top + anchorRect.height / 2;
  top = tokenCenterY - tooltipHeight / 2;

  // Clamp to viewport
  if (top < MARGIN) {
    top = MARGIN;
  } else if (top + tooltipHeight + MARGIN > viewportHeight) {
    top = viewportHeight - tooltipHeight - MARGIN;
  }

  return { top, left };
}

/**
 * Display next action with timing.
 */
function NextActionDisplay({
  nextAction,
  currentTick,
}: {
  nextAction: Action | null;
  currentTick: number;
}) {
  const actionDisplay = formatActionDisplay(nextAction);
  const resolutionText =
    nextAction && nextAction.type !== "idle"
      ? formatResolutionText(nextAction, currentTick)
      : "";

  return (
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
  );
}

/**
 * Display skill priority list with collapsible lower-priority skills.
 */
function SkillPriorityList({
  skillEvaluations,
  selectedSkillIndex,
}: {
  skillEvaluations: SkillEvaluationResult[];
  selectedSkillIndex: number | null;
}) {
  // Primary section: rejected skills + selected skill (always visible)
  const primarySkillsWithIndices = skillEvaluations
    .map((evaluation, index) => ({ evaluation, originalIndex: index }))
    .filter(
      ({ evaluation, originalIndex }) =>
        evaluation.status === "rejected" ||
        originalIndex === selectedSkillIndex,
    );

  // Expandable section: skipped skills only
  const skippedSkillsWithIndices = skillEvaluations
    .map((evaluation, index) => ({ evaluation, originalIndex: index }))
    .filter(({ evaluation }) => evaluation.status === "skipped");

  return (
    <div className={styles.skillPrioritySection}>
      <h3 className={styles.sectionHeader}>Skill Priority</h3>

      {/* Primary skills: rejected + selected */}
      <ol className={styles.skillList} role="list">
        {primarySkillsWithIndices.map(({ evaluation, originalIndex }) => (
          <SkillListItem
            key={evaluation.skill.id}
            evaluation={evaluation}
            displayIndex={originalIndex + 1}
            isSelected={originalIndex === selectedSkillIndex}
          />
        ))}
      </ol>

      {/* Expandable: skipped skills */}
      {skippedSkillsWithIndices.length > 0 && (
        <details className={styles.collapsedSkills}>
          <summary className={styles.collapsedSummary}>
            Show {skippedSkillsWithIndices.length} more skill
            {skippedSkillsWithIndices.length > 1 ? "s" : ""}
          </summary>
          <ol className={styles.skillList} role="list">
            {skippedSkillsWithIndices.map(({ evaluation, originalIndex }) => (
              <SkillListItem
                key={evaluation.skill.id}
                evaluation={evaluation}
                displayIndex={originalIndex + 1}
                isSelected={false}
              />
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

/**
 * Render a single skill list item.
 */
function SkillListItem({
  evaluation,
  displayIndex,
  isSelected,
}: {
  evaluation: SkillEvaluationResult;
  displayIndex: number;
  isSelected: boolean;
}) {
  const rejectionReason =
    evaluation.status === "rejected" ? formatRejectionReason(evaluation) : "";

  return (
    <li
      key={evaluation.skill.id}
      className={`${styles.skillItem} ${isSelected ? styles.activeSkill : ""}`}
    >
      <div className={styles.skillName}>
        {isSelected && <span className={styles.selectedArrow}>→ </span>}
        {displayIndex}. {evaluation.skill.name}
        {rejectionReason && (
          <span className={styles.rejectionReason}> — {rejectionReason}</span>
        )}
      </div>
    </li>
  );
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
    <>
      <div className={styles.tooltipHeader}>{characterName}</div>
      <div className={styles.nextActionSection}>
        <h3 className={styles.sectionHeader}>Continuing Action</h3>
        <div className={styles.nextAction}>
          <div className={styles.actionDisplay}>
            {formatActionDisplay(action)}
          </div>
          <div className={styles.actionTiming}>{resolutionText}</div>
        </div>
      </div>
    </>
  );
}

/**
 * CharacterTooltip component renders via portal.
 */
export function CharacterTooltip({
  characterId,
  anchorRect,
  onMouseEnter,
  onMouseLeave,
}: CharacterTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const character = useGameStore(selectCharacterById(characterId));
  const allCharacters = useGameStore(selectCharacters);
  const currentTick = useGameStore(selectTick);
  const nextAction = useGameStore(selectNextTickDecision(characterId));

  // Calculate position after rendering (using layout effect for synchronous positioning)
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      // Use actual dimensions if available, otherwise assume defaults (for test environment)
      const width = rect.width > 0 ? rect.width : 300;
      const height = rect.height > 0 ? rect.height : 150;
      const newPosition = calculateTooltipPosition(anchorRect, width, height);
      setPosition(newPosition);
    }
  }, [anchorRect]);

  // If character is removed, return null
  if (!character) {
    return null;
  }

  const letter = slotPositionToLetter(character.slotPosition);

  // Evaluate skills for the character
  const evaluation: CharacterEvaluationResult = evaluateSkillsForCharacter(
    character,
    allCharacters,
  );

  const tooltipId = `tooltip-${characterId}`;

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className={styles.tooltip}
      style={{ top: position.top, left: position.left }}
      role="tooltip"
      id={tooltipId}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.tooltipContent}>
        {evaluation.isMidAction && evaluation.currentAction ? (
          <MidActionDisplay
            characterName={letter}
            action={evaluation.currentAction}
            currentTick={currentTick}
          />
        ) : (
          <>
            <div className={styles.tooltipHeader}>{letter}</div>
            <NextActionDisplay
              nextAction={nextAction}
              currentTick={currentTick}
            />
            <SkillPriorityList
              skillEvaluations={evaluation.skillEvaluations}
              selectedSkillIndex={evaluation.selectedSkillIndex}
            />
          </>
        )}
      </div>
    </div>
  );

  return createPortal(tooltipContent, document.body);
}
