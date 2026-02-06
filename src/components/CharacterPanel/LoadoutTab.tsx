/**
 * LoadoutTab - Displays equipped skills and available inventory for assignment
 */

import { useGameStore, selectActions } from "../../stores/gameStore";
import { SKILL_REGISTRY } from "../../engine/skill-registry";
import { MAX_SKILL_SLOTS } from "../../stores/gameStore-constants";
import styles from "./LoadoutTab.module.css";

export function LoadoutTab() {
  const {
    assignSkillToCharacter,
    removeSkillFromCharacter,
    updateSkill,
    duplicateSkill,
  } = useGameStore(selectActions);
  const allCharacters = useGameStore((state) => state.gameState.characters);
  const selectedCharacterId = useGameStore(
    (state) => state.selectedCharacterId,
  );

  const character = allCharacters.find((c) => c.id === selectedCharacterId);
  if (!character) {
    return null;
  }

  const handleAssign = (skillId: string) => {
    assignSkillToCharacter(character.id, skillId);
  };

  const handleUnassign = (instanceId: string) => {
    removeSkillFromCharacter(character.id, instanceId);
  };

  const handleToggleEnabled = (instanceId: string, enabled: boolean) => {
    updateSkill(character.id, instanceId, { enabled: !enabled });
  };

  const handleDuplicate = (instanceId: string) => {
    duplicateSkill(character.id, instanceId);
  };

  // Filter out innate skills and skills assigned to other characters in same faction
  const availableSkills = SKILL_REGISTRY.filter((skillDef) => {
    if (skillDef.innate) return false;

    // Check if assigned to a DIFFERENT character in the same faction
    const assignedToOtherCharInFaction = allCharacters.some(
      (char) =>
        char.id !== character.id && // Different character
        char.faction === character.faction &&
        char.skills.some((s) => s.id === skillDef.id),
    );

    return !assignedToOtherCharInFaction;
  });

  const canAssign = character.skills.length < MAX_SKILL_SLOTS;

  const isSkillAssignedToThisChar = (skillId: string) => {
    return character.skills.some((s) => s.id === skillId);
  };

  return (
    <div className={styles.loadoutTab}>
      {/* Equipped Skills Section */}
      <section className={styles.section}>
        <div>
          <h3 className={styles.sectionTitle}>Equipped Skills</h3>
          <div className={styles.skillList}>
            {character.skills.map((skill) => {
              const skillDef = SKILL_REGISTRY.find(
                (def) => def.id === skill.id,
              );
              if (!skillDef) return null;

              const instanceCount = character.skills.filter(
                (s) => s.id === skillDef.id,
              ).length;
              const canDuplicate = instanceCount < skillDef.maxInstances;
              const isDuplicate = instanceCount > 1;

              return (
                <div key={skill.instanceId} className={styles.skillRow}>
                  <h4>{skill.name}</h4>
                  <label className={styles.enableCheckbox}>
                    <input
                      type="checkbox"
                      checked={skill.enabled}
                      onChange={() =>
                        handleToggleEnabled(skill.instanceId, skill.enabled)
                      }
                      aria-label={`Enable ${skillDef.name}`}
                    />
                    Enable
                  </label>

                  {skillDef.innate && (
                    <span className={styles.innateBadge}>Innate</span>
                  )}

                  <div className={styles.skillActions}>
                    {canDuplicate && (
                      <button
                        onClick={() => handleDuplicate(skill.instanceId)}
                        className={styles.duplicateBtn}
                        aria-label={`Duplicate ${skillDef.name}`}
                      >
                        Duplicate
                      </button>
                    )}
                    {!skillDef.innate && (
                      <button
                        onClick={() => handleUnassign(skill.instanceId)}
                        className={styles.unassignBtn}
                        aria-label={`Remove ${skillDef.name}`}
                      >
                        Unassign
                      </button>
                    )}
                    {skillDef.innate && isDuplicate && (
                      <button
                        onClick={() => handleUnassign(skill.instanceId)}
                        className={styles.removeBtn}
                        aria-label={`Remove ${skillDef.name}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Available Skills Inventory */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Inventory</h3>
        <div className={styles.inventoryList}>
          {availableSkills.map((skillDef) => {
            const isAssigned = isSkillAssignedToThisChar(skillDef.id);
            const isDisabled = !canAssign || isAssigned;

            return (
              <div key={skillDef.id} className={styles.inventoryRow}>
                <span className={styles.skillName}>{skillDef.name}</span>
                <button
                  onClick={() => handleAssign(skillDef.id)}
                  disabled={isDisabled}
                  className={styles.assignBtn}
                  aria-label={`Assign ${skillDef.name}`}
                >
                  Assign
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
