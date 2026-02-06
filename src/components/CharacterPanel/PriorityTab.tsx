/**
 * PriorityTab - Displays skill priority list with configuration or battle evaluation
 */

import { useGameStore } from "../../stores/gameStore";
import { evaluateSkillsForCharacter } from "../../engine/game";
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

  // In battle mode, get evaluation data from real engine evaluation
  const evaluations = (() => {
    if (!isBattleMode) {
      return character.skills.map(() => undefined);
    }

    const result = evaluateSkillsForCharacter(character, allCharacters);

    if (result.isMidAction) {
      // Mid-action: no per-skill evaluations available
      return character.skills.map(() => undefined);
    }

    return result.skillEvaluations.map((evalResult) => ({
      status: evalResult.status,
      rejectionReason: evalResult.rejectionReason,
      resolvedTarget: evalResult.target,
    }));
  })();

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
