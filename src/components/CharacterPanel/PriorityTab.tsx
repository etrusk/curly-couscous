/**
 * PriorityTab - Displays skill priority list with configuration or battle evaluation
 */

import { useGameStore } from "../../stores/gameStore";
import { SkillRow } from "./SkillRow";
import styles from "./PriorityTab.module.css";

interface PriorityTabProps {
  mode: "config" | "battle";
}

export function PriorityTab({ mode }: PriorityTabProps) {
  const allCharacters = useGameStore((state) => state.gameState.characters);
  const selectedCharacterId = useGameStore(
    (state) => state.selectedCharacterId,
  );

  const character = allCharacters.find((c) => c.id === selectedCharacterId);
  if (!character) {
    return null;
  }

  const isBattleMode = mode === "battle";

  // In battle mode, get evaluation data from character's current action and skill evaluation
  const evaluations = character.skills.map((skill) => {
    if (!isBattleMode) {
      return undefined;
    }

    // Check if this skill was selected (currentAction matches)
    if (
      character.currentAction &&
      character.currentAction.skill.id === skill.id
    ) {
      // Find target character
      const targetChar = allCharacters.find(
        (c) =>
          c.position.q === character.currentAction!.targetCell.q &&
          c.position.r === character.currentAction!.targetCell.r,
      );

      return {
        status: "selected" as const,
        resolvedTarget: targetChar,
      };
    }

    // For now, mark other skills as skipped (could be enhanced with rejection tracking)
    return {
      status: "skipped" as const,
    };
  });

  return (
    <div className={styles.priorityTab}>
      <div className={styles.skillList}>
        {character.skills.map((skill, index) => (
          <SkillRow
            key={skill.instanceId}
            skill={skill}
            character={character}
            index={index}
            isFirst={index === 0}
            isLast={index === character.skills.length - 1}
            mode={isBattleMode ? "battle" : "config"}
            evaluation={evaluations[index]}
          />
        ))}
      </div>
    </div>
  );
}
