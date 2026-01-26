import { useState, useMemo } from "react";
import {
  useGameStore,
  selectSelectedCharacter,
  selectTick,
  selectNextTickDecision,
  selectCharacters,
  selectAllCharacterEvaluations,
} from "../../stores/gameStore";
import type {
  Action,
  SkillEvaluationResult,
  Character,
  CharacterEvaluationResult,
} from "../../engine/types";
import { evaluateSkillsForCharacter } from "../../engine/game";
import styles from "./RuleEvaluations.module.css";

// Constants for letter mapping
const LETTER_A_CHAR_CODE = 65; // ASCII code for 'A'
const LETTER_COUNT = 26; // Number of letters in alphabet

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
  // Skills up to and including selected skill (always shown)
  const visibleSkills =
    selectedSkillIndex !== null
      ? skillEvaluations.slice(0, selectedSkillIndex + 1)
      : skillEvaluations;

  // Skills below selected skill (collapsible)
  const collapsedSkills =
    selectedSkillIndex !== null
      ? skillEvaluations.slice(selectedSkillIndex + 1)
      : [];

  return (
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

  return (
    <div
      className={styles.panel}
      role="region"
      aria-label={`Rule Evaluations: ${selectedCharacter.name}`}
    >
      <h2 className={styles.header}>
        Rule Evaluations: {selectedCharacter.name}
      </h2>

      <NextActionDisplay nextAction={nextAction} currentTick={currentTick} />
      <SkillPriorityList
        skillEvaluations={evaluation.skillEvaluations}
        selectedSkillIndex={evaluation.selectedSkillIndex}
      />
    </div>
  );
}

/**
 * Render a single character section in the multi-character list.
 *
 * @param character - The character data
 * @param evaluation - Evaluation result for the character
 * @param currentTick - Current game tick
 * @param isExpanded - Whether the section is expanded
 * @param onToggle - Callback to toggle expansion
 */
function CharacterSection({
  character,
  evaluation,
  currentTick,
  isExpanded,
  onToggle,
}: {
  character: Character;
  evaluation: CharacterEvaluationResult;
  currentTick: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // Determine character letter (A, B, C, ...) based on slotPosition
  const letter = String.fromCharCode(
    LETTER_A_CHAR_CODE + (character.slotPosition % LETTER_COUNT),
  );
  const factionClass =
    character.faction === "friendly" ? styles.friendly : styles.enemy;
  const nextAction = useGameStore(selectNextTickDecision(character.id));

  return (
    <section
      className={styles.characterSection}
      role="region"
      aria-label={`Rule Evaluations: ${character.name}`}
    >
      <button
        className={styles.characterHeader}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`character-details-${character.id}`}
        aria-label={`Toggle details for ${character.name}`}
      >
        <div className={styles.characterHeaderContent}>
          <span className={`${styles.characterLetter} ${factionClass}`}>
            {letter}
          </span>
          <span className={styles.characterName}>{character.name}</span>
          <span className={styles.characterHp}>
            HP: {character.hp}/{character.maxHp}
          </span>
        </div>
        <span className={styles.expandButton} aria-hidden="true">
          {isExpanded ? "▼" : "▶"}
        </span>
      </button>
      {isExpanded && (
        <div
          id={`character-details-${character.id}`}
          className={styles.characterDetails}
        >
          <NextActionDisplay
            nextAction={nextAction}
            currentTick={currentTick}
          />
          <SkillPriorityList
            skillEvaluations={evaluation.skillEvaluations}
            selectedSkillIndex={evaluation.selectedSkillIndex}
          />
        </div>
      )}
    </section>
  );
}

/**
 * Render multi-character view when no character is selected.
 */
function MultiCharacterView({
  evaluations,
  currentTick,
}: {
  evaluations: CharacterEvaluationResult[];
  currentTick: number;
}) {
  const [expandedCharacterId, setExpandedCharacterId] = useState<string | null>(
    null,
  );
  const allCharacters = useGameStore(selectCharacters);

  // Create a map from character ID to character for O(1) lookup
  const characterMap = useMemo(() => {
    const map = new Map<string, Character>();
    allCharacters.forEach((c: Character) => map.set(c.id, c));
    return map;
  }, [allCharacters]);

  if (evaluations.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.header}>Rule Evaluations</h2>
        <p className={styles.emptyBoardMessage}>No characters on the board</p>
      </div>
    );
  }

  const handleToggle = (characterId: string) => {
    setExpandedCharacterId(
      expandedCharacterId === characterId ? null : characterId,
    );
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.header}>Rule Evaluations</h2>
      <div className={styles.characterList}>
        {evaluations.map((evaluation) => {
          const character = characterMap.get(evaluation.characterId);
          if (!character) {
            // Issue 4: Add console.warn for missing character
            console.warn(
              `Character not found for evaluation: ${evaluation.characterId}`,
            );
            return null;
          }
          return (
            <CharacterSection
              key={character.id}
              character={character}
              evaluation={evaluation}
              currentTick={currentTick}
              isExpanded={expandedCharacterId === character.id}
              onToggle={() => handleToggle(character.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function RuleEvaluations() {
  const selectedCharacter = useGameStore(selectSelectedCharacter);
  const allCharacters = useGameStore(selectCharacters);
  const currentTick = useGameStore(selectTick);
  const evaluations = useGameStore(selectAllCharacterEvaluations);
  const nextAction = useGameStore(
    selectNextTickDecision(selectedCharacter?.id ?? ""),
  );

  // If a character is selected, show single-character view
  if (selectedCharacter) {
    return renderSelectedCharacterContent(
      selectedCharacter,
      allCharacters,
      currentTick,
      nextAction,
    );
  }

  // Otherwise show multi-character view
  return (
    <MultiCharacterView evaluations={evaluations} currentTick={currentTick} />
  );
}
