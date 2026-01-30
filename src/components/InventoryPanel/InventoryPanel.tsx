import {
  useGameStore,
  selectSelectedCharacter,
  selectActions,
} from "../../stores/gameStore";
import { SKILL_REGISTRY } from "../../engine/skill-registry";
import { MAX_SKILL_SLOTS } from "../../stores/gameStore-constants";
import styles from "./InventoryPanel.module.css";

export function InventoryPanel() {
  const selectedCharacter = useGameStore(selectSelectedCharacter);
  const { assignSkillToCharacter } = useGameStore(selectActions);

  // Determine if we should show the skill list or placeholder
  const shouldShowSkills = selectedCharacter;

  // Check if character has all slots filled
  const slotsAreFull =
    selectedCharacter && selectedCharacter.skills.length >= MAX_SKILL_SLOTS;

  const handleAssignSkill = (skillId: string) => {
    if (selectedCharacter) {
      assignSkillToCharacter(selectedCharacter.id, skillId);
    }
  };

  return (
    <div className={styles.panel} role="region" aria-label="Inventory">
      <h2 className={styles.header}>Inventory</h2>

      {!shouldShowSkills ? (
        <p className={styles.placeholder}>
          Select a character to view available skills
        </p>
      ) : (
        <div className={styles.skillsList}>
          {SKILL_REGISTRY.filter((skill) => {
            if (skill.innate) return false;
            const isAssigned = selectedCharacter.skills.some(
              (s) => s.id === skill.id,
            );
            return !isAssigned;
          }).map((skill) => {
            return (
              <div key={skill.id} className={styles.skillItem}>
                <div className={styles.skillName}>
                  <h3>{skill.name}</h3>
                </div>
                <div className={styles.skillStats}>
                  Tick Cost: {skill.tickCost} | Range: {skill.range}
                  {skill.damage !== undefined && ` | Damage: ${skill.damage}`}
                  {skill.mode !== undefined && ` | Mode: ${skill.mode}`}
                </div>
                <div className={styles.skillActions}>
                  <button
                    onClick={() => handleAssignSkill(skill.id)}
                    className={styles.assignButton}
                    aria-label={`Assign ${skill.name} to character`}
                    disabled={slotsAreFull}
                  >
                    Assign
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
