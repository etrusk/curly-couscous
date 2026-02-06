import {
  useGameStore,
  selectSelectedCharacter,
  selectActions,
} from "../../stores/gameStore";
import type { Trigger, Criterion } from "../../engine/types";
import { SKILL_REGISTRY } from "../../engine/skill-registry";
import { MAX_SKILL_SLOTS } from "../../stores/gameStore-constants";
import { slotPositionToLetter } from "../../utils/letterMapping";
import styles from "./SkillsPanel.module.css";

// Default fallbacks extracted to module-level constants to avoid recreating on every render
const DEFAULT_TRIGGER: Trigger = { type: "always" };

// Type definitions for target and criterion selection
type TargetCategory = "enemy" | "ally" | "self";
type TargetStrategy = "nearest" | "furthest" | "lowest_hp" | "highest_hp";

export function SkillsPanel() {
  const selectedCharacter = useGameStore(selectSelectedCharacter);
  const {
    updateSkill,
    moveSkillUp,
    moveSkillDown,
    removeSkillFromCharacter,
    duplicateSkill,
  } = useGameStore(selectActions);

  if (!selectedCharacter) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.header}>Skills & Priority</h2>
        <p className={styles.placeholder}>
          Click a character on the grid to configure skills
        </p>
      </div>
    );
  }

  const handleEnabledToggle = (instanceId: string, currentEnabled: boolean) => {
    updateSkill(selectedCharacter.id, instanceId, { enabled: !currentEnabled });
  };

  const handleUnassignSkill = (instanceId: string) => {
    removeSkillFromCharacter(selectedCharacter.id, instanceId);
  };

  // Type assertion acceptable for 80/20 - select values are guaranteed to match Trigger['type']
  const handleTriggerTypeChange = (
    instanceId: string,
    triggerType: Trigger["type"],
  ) => {
    let newTriggers: Trigger[];

    if (
      triggerType === "always" ||
      triggerType === "my_cell_targeted_by_enemy"
    ) {
      newTriggers = [{ type: triggerType }];
    } else if (
      triggerType === "enemy_in_range" ||
      triggerType === "ally_in_range"
    ) {
      newTriggers = [{ type: triggerType, value: 3 }];
    } else if (triggerType === "hp_below") {
      newTriggers = [{ type: triggerType, value: 50 }];
    } else {
      newTriggers = [{ type: "always" }];
    }

    updateSkill(selectedCharacter.id, instanceId, { triggers: newTriggers });
  };

  const handleTriggerValueChange = (
    instanceId: string,
    triggerType: Trigger["type"],
    value: number,
  ) => {
    const newTriggers: Trigger[] = [{ type: triggerType, value }];
    updateSkill(selectedCharacter.id, instanceId, { triggers: newTriggers });
  };

  const handleCategoryChange = (
    instanceId: string,
    category: TargetCategory,
  ) => {
    // Get current skill to preserve criterion when switching target category
    const skill = selectedCharacter.skills.find(
      (s) => s.instanceId === instanceId,
    );
    if (!skill) {
      console.error("[handleCategoryChange] Skill not found:", instanceId);
      return;
    }

    // When changing to "self", always use "nearest" criterion
    // Otherwise, preserve current criterion
    const newCriterion =
      category === "self" ? "nearest" : skill.criterion || "nearest";

    updateSkill(selectedCharacter.id, instanceId, {
      target: category,
      criterion: newCriterion,
    });
  };

  const handleStrategyChange = (
    instanceId: string,
    strategy: TargetStrategy,
  ) => {
    // Get current skill to preserve target category when switching criterion
    const skill = selectedCharacter.skills.find(
      (s) => s.instanceId === instanceId,
    );
    if (!skill) {
      console.error("[handleStrategyChange] Skill not found:", instanceId);
      return;
    }

    // Preserve current target when changing criterion
    const currentTarget = skill.target || "enemy";

    updateSkill(selectedCharacter.id, instanceId, {
      target: currentTarget as "enemy" | "ally" | "self",
      criterion: strategy as Criterion,
    });
  };

  // Type assertion acceptable for 80/20 - select values are guaranteed to match behavior types
  const handleBehaviorChange = (
    instanceId: string,
    behavior: "towards" | "away",
  ) => {
    updateSkill(selectedCharacter.id, instanceId, { behavior });
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.header}>
        Skills & Priority:{" "}
        {slotPositionToLetter(selectedCharacter.slotPosition)}
      </h2>

      <div className={styles.skillsList}>
        {/* eslint-disable-next-line complexity */}
        {selectedCharacter.skills.map((skill, index) => {
          const trigger = skill.triggers[0] || DEFAULT_TRIGGER;
          const needsValue =
            trigger.type === "enemy_in_range" ||
            trigger.type === "ally_in_range" ||
            trigger.type === "hp_below";
          const isMove = skill.behavior !== undefined && skill.behavior !== "";
          const skillDef = SKILL_REGISTRY.find((def) => def.id === skill.id);
          const isInnate = !!skillDef?.innate;
          const moveCount = isMove
            ? selectedCharacter.skills.filter(
                (s) => s.behavior !== undefined && s.behavior !== "",
              ).length
            : 0;
          const canRemove = !isInnate || (isInnate && moveCount > 1);

          // Use target/criterion directly for display
          const displayTarget = skill.target;
          const displayCriterion = skill.criterion;

          return (
            <div key={skill.instanceId} className={styles.skillRow}>
              <div className={styles.skillHeader}>
                <input
                  type="checkbox"
                  id={`enable-${skill.instanceId}`}
                  checked={skill.enabled}
                  onChange={() =>
                    handleEnabledToggle(skill.instanceId, skill.enabled)
                  }
                  aria-label={`Enable ${skill.name}`}
                  className={styles.enabledCheckbox}
                />
                <label
                  htmlFor={`enable-${skill.instanceId}`}
                  className={styles.enabledLabel}
                >
                  <h3>{skill.name}</h3>
                </label>
                {isInnate && (
                  <span
                    className={styles.innateBadge}
                    aria-label="Innate skill"
                  >
                    Innate
                  </span>
                )}
                {isMove &&
                  selectedCharacter.skills.length < MAX_SKILL_SLOTS && (
                    <button
                      onClick={() =>
                        duplicateSkill(selectedCharacter.id, skill.instanceId)
                      }
                      className={styles.duplicateButton}
                      aria-label={`Duplicate ${skill.name}`}
                    >
                      Duplicate
                    </button>
                  )}
                {!isInnate && (
                  <button
                    onClick={() => handleUnassignSkill(skill.instanceId)}
                    className={styles.unassignButton}
                    aria-label={`Unassign ${skill.name}`}
                  >
                    Unassign
                  </button>
                )}
                {canRemove && isInnate && moveCount > 1 && (
                  <button
                    onClick={() => handleUnassignSkill(skill.instanceId)}
                    className={styles.removeButton}
                    aria-label={`Remove ${skill.name}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className={styles.skillControls}>
                <div className={styles.controlRow}>
                  <label>
                    Trigger:
                    <select
                      value={trigger.type}
                      onChange={(e) =>
                        handleTriggerTypeChange(
                          skill.instanceId,
                          e.target.value as Trigger["type"],
                        )
                      }
                      aria-label="Trigger"
                    >
                      <option value="always">Always</option>
                      <option value="enemy_in_range">Enemy in Range</option>
                      <option value="ally_in_range">Ally in Range</option>
                      <option value="hp_below">HP Below</option>
                      <option value="my_cell_targeted_by_enemy">
                        My Cell Targeted
                      </option>
                    </select>
                  </label>

                  {needsValue && (
                    <label>
                      {trigger.type === "hp_below" ? "Percentage:" : "Range:"}
                      <input
                        type="number"
                        value={trigger.value ?? 0}
                        onChange={(e) =>
                          handleTriggerValueChange(
                            skill.instanceId,
                            trigger.type,
                            parseInt(e.target.value, 10),
                          )
                        }
                        min="0"
                        max={trigger.type === "hp_below" ? "100" : "12"}
                        aria-label={
                          trigger.type === "hp_below" ? "Percentage" : "Range"
                        }
                      />
                    </label>
                  )}
                </div>

                <div className={styles.controlRow}>
                  <label>
                    Target:
                    <select
                      value={displayTarget}
                      onChange={(e) =>
                        handleCategoryChange(
                          skill.instanceId,
                          e.target.value as TargetCategory,
                        )
                      }
                      aria-label="Target category"
                    >
                      <option value="enemy">Enemy</option>
                      <option value="ally">Ally</option>
                      {!isMove && <option value="self">Self</option>}
                    </select>
                  </label>

                  <label>
                    Selection:
                    <select
                      value={displayCriterion}
                      onChange={(e) =>
                        handleStrategyChange(
                          skill.instanceId,
                          e.target.value as TargetStrategy,
                        )
                      }
                      aria-label="Selection strategy"
                      disabled={displayTarget === "self"}
                    >
                      <option value="nearest">Nearest</option>
                      <option value="furthest">Furthest</option>
                      <option value="lowest_hp">Lowest HP</option>
                      <option value="highest_hp">Highest HP</option>
                    </select>
                  </label>

                  {isMove && (
                    <label className={styles.behaviorLabel}>
                      Behavior:
                      <select
                        value={skill.behavior}
                        onChange={(e) =>
                          handleBehaviorChange(
                            skill.instanceId,
                            e.target.value as "towards" | "away",
                          )
                        }
                        aria-label="Behavior"
                      >
                        <option value="towards">Towards</option>
                        <option value="away">Away</option>
                      </select>
                    </label>
                  )}
                </div>

                <div className={styles.priorityButtons}>
                  <button
                    onClick={() => moveSkillUp(selectedCharacter.id, index)}
                    disabled={index === 0}
                    aria-label="Move Up"
                    title="Move skill up in priority"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveSkillDown(selectedCharacter.id, index)}
                    disabled={index === selectedCharacter.skills.length - 1}
                    aria-label="Move Down"
                    title="Move skill down in priority"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
