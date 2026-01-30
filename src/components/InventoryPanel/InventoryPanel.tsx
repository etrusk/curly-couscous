import {
  useGameStore,
  selectSelectedCharacter,
  selectActions,
} from "../../stores/gameStore";
import { SKILL_REGISTRY } from "../../engine/skill-registry";
import styles from "./InventoryPanel.module.css";

export function InventoryPanel() {
  const selectedCharacter = useGameStore(selectSelectedCharacter);
  const { assignSkillToCharacter, removeSkillFromCharacter } =
    useGameStore(selectActions);

  // Determine if we should show the skill list or placeholder
  const shouldShowSkills = selectedCharacter;

  const handleAssignSkill = (skillId: string) => {
    if (selectedCharacter) {
      assignSkillToCharacter(selectedCharacter.id, skillId);
    }
  };

  const handleRemoveSkill = (skillId: string) => {
    if (selectedCharacter) {
      removeSkillFromCharacter(selectedCharacter.id, skillId);
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
          {SKILL_REGISTRY.map((skill) => {
            const isAssigned = selectedCharacter.skills.some(
              (s) => s.id === skill.id,
            );

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
                  {isAssigned ? (
                    <>
                      <span className={styles.assignedBadge}>Assigned</span>
                      {!skill.innate && (
                        <button
                          onClick={() => handleRemoveSkill(skill.id)}
                          className={styles.removeButton}
                          aria-label={`Remove ${skill.name} from character`}
                        >
                          Remove
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleAssignSkill(skill.id)}
                      className={styles.assignButton}
                      aria-label={`Assign ${skill.name} to character`}
                    >
                      Assign
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
