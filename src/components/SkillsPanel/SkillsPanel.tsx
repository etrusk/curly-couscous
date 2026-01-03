import {
  useGameStore,
  selectSelectedCharacter,
  selectActions,
} from "../../stores/gameStore";
import type { Trigger, Selector } from "../../engine/types";
import styles from "./SkillsPanel.module.css";

// Default fallbacks extracted to module-level constants to avoid recreating on every render
const DEFAULT_TRIGGER: Trigger = { type: "always" };
const DEFAULT_SELECTOR: Selector = { type: "nearest_enemy" };

export function SkillsPanel() {
  const selectedCharacter = useGameStore(selectSelectedCharacter);
  const { updateSkill, moveSkillUp, moveSkillDown } =
    useGameStore(selectActions);

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

  const handleEnabledToggle = (skillId: string, currentEnabled: boolean) => {
    updateSkill(selectedCharacter.id, skillId, { enabled: !currentEnabled });
  };

  // Type assertion acceptable for 80/20 - select values are guaranteed to match Trigger['type']
  const handleTriggerTypeChange = (
    skillId: string,
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

    updateSkill(selectedCharacter.id, skillId, { triggers: newTriggers });
  };

  const handleTriggerValueChange = (
    skillId: string,
    triggerType: Trigger["type"],
    value: number,
  ) => {
    const newTriggers: Trigger[] = [{ type: triggerType, value }];
    updateSkill(selectedCharacter.id, skillId, { triggers: newTriggers });
  };

  // Type assertion acceptable for 80/20 - select values are guaranteed to match Selector['type']
  const handleSelectorChange = (
    skillId: string,
    selectorType: Selector["type"],
  ) => {
    updateSkill(selectedCharacter.id, skillId, {
      selectorOverride: { type: selectorType },
    });
  };

  // Type assertion acceptable for 80/20 - select values are guaranteed to match mode types
  const handleModeChange = (
    skillId: string,
    mode: "towards" | "away" | "hold",
  ) => {
    updateSkill(selectedCharacter.id, skillId, { mode });
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.header}>
        Skills & Priority: {selectedCharacter.name}
      </h2>

      <div className={styles.skillsList}>
        {selectedCharacter.skills.map((skill, index) => {
          const trigger = skill.triggers[0] || DEFAULT_TRIGGER;
          const needsValue =
            trigger.type === "enemy_in_range" ||
            trigger.type === "ally_in_range" ||
            trigger.type === "hp_below";
          const selector = skill.selectorOverride || DEFAULT_SELECTOR;
          const isMove = skill.mode !== undefined;

          return (
            <div key={skill.id} className={styles.skillRow}>
              <div className={styles.skillHeader}>
                <input
                  type="checkbox"
                  id={`enable-${skill.id}`}
                  checked={skill.enabled}
                  onChange={() => handleEnabledToggle(skill.id, skill.enabled)}
                  aria-label={`Enable ${skill.name}`}
                  className={styles.enabledCheckbox}
                />
                <label
                  htmlFor={`enable-${skill.id}`}
                  className={styles.enabledLabel}
                >
                  <h3>{skill.name}</h3>
                </label>
              </div>

              <div className={styles.skillControls}>
                <div className={styles.controlRow}>
                  <label>
                    Trigger:
                    <select
                      value={trigger.type}
                      onChange={(e) =>
                        handleTriggerTypeChange(
                          skill.id,
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
                            skill.id,
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
                    Selector:
                    <select
                      value={selector.type}
                      onChange={(e) =>
                        handleSelectorChange(
                          skill.id,
                          e.target.value as Selector["type"],
                        )
                      }
                      aria-label="Selector"
                    >
                      <option value="nearest_enemy">Nearest Enemy</option>
                      <option value="nearest_ally">Nearest Ally</option>
                      <option value="lowest_hp_enemy">Lowest HP Enemy</option>
                      <option value="lowest_hp_ally">Lowest HP Ally</option>
                      <option value="self">Self</option>
                    </select>
                  </label>
                </div>

                {isMove && (
                  <div className={styles.controlRow}>
                    <label>
                      Mode:
                      <select
                        value={skill.mode}
                        onChange={(e) =>
                          handleModeChange(
                            skill.id,
                            e.target.value as "towards" | "away" | "hold",
                          )
                        }
                        aria-label="Mode"
                      >
                        <option value="towards">Towards</option>
                        <option value="away">Away</option>
                        <option value="hold">Hold</option>
                      </select>
                    </label>
                  </div>
                )}

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
