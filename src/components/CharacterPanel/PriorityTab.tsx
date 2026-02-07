/**
 * PriorityTab - Displays skill priority list with configuration or battle evaluation.
 * In config mode, also shows an inventory section for assigning skills.
 */

import { useGameStore, selectActions } from "../../stores/gameStore";
import { MAX_SKILL_SLOTS } from "../../stores/gameStore-constants";
import { evaluateSkillsForCharacter } from "../../engine/game";
import { SKILL_REGISTRY } from "../../engine/skill-registry";
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
  const { assignSkillToCharacter } = useGameStore(selectActions);

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

  // Filter inventory: exclude innate skills and skills assigned to same-faction characters
  const availableSkills = isBattleMode
    ? []
    : SKILL_REGISTRY.filter((skillDef) => {
        if (skillDef.innate) return false;
        // Exclude skills assigned to any same-faction character (including this one)
        const assignedToSameFaction = allCharacters.some(
          (char) =>
            char.faction === character.faction &&
            char.skills.some((s) => s.id === skillDef.id),
        );
        return !assignedToSameFaction;
      });

  const canAssign = character.skills.length < MAX_SKILL_SLOTS;

  const handleAssign = (skillId: string) => {
    assignSkillToCharacter(character.id, skillId);
  };

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
            evaluation={evaluations[index]}
          />
        ))}
      </div>
      {!isBattleMode && (
        <section className={styles.inventorySection}>
          <h3 className={styles.sectionTitle}>Inventory</h3>
          <div className={styles.inventoryList}>
            {availableSkills.map((skillDef) => (
              <div key={skillDef.id} className={styles.inventoryRow}>
                <span className={styles.skillName}>{skillDef.name}</span>
                <button
                  onClick={() => handleAssign(skillDef.id)}
                  disabled={!canAssign}
                  className={styles.assignBtn}
                  aria-label={`Assign ${skillDef.name}`}
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
