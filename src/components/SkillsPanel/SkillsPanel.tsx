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

// Type definitions for decomposed selector
type TargetCategory = "enemy" | "ally" | "self";
type TargetStrategy = "nearest" | "lowest_hp";

/**
 * Decompose a Selector type into category and strategy.
 * Returns { category, strategy } where strategy is "nearest" for "self".
 */
// eslint-disable-next-line react-refresh/only-export-components
export function decomposeSelector(type: Selector["type"]): {
  category: TargetCategory;
  strategy: TargetStrategy;
} {
  if (type === "self") {
    return { category: "self", strategy: "nearest" };
  }
  // "nearest_enemy" → ["nearest", "enemy"]
  // "lowest_hp_ally" → ["lowest", "hp", "ally"] - need special handling
  if (type.startsWith("lowest_hp_")) {
    const category = type.replace("lowest_hp_", "") as TargetCategory;
    return { category, strategy: "lowest_hp" };
  }
  const category = type.replace("nearest_", "") as TargetCategory;
  return { category, strategy: "nearest" };
}

/**
 * Compose category and strategy into a Selector type.
 * Returns "self" when category is "self", ignoring strategy.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function composeSelector(
  category: TargetCategory,
  strategy: TargetStrategy,
): Selector["type"] {
  if (category === "self") {
    return "self";
  }
  const composed = `${strategy}_${category}` as Selector["type"];

  // Validation: ensure composed value is valid
  const validTypes: Selector["type"][] = [
    "nearest_enemy",
    "nearest_ally",
    "lowest_hp_enemy",
    "lowest_hp_ally",
    "self",
  ];
  if (!validTypes.includes(composed)) {
    console.error("[composeSelector] Invalid composed selector:", {
      category,
      strategy,
      composed,
    });
    // Fallback to nearest_enemy if invalid
    return "nearest_enemy";
  }

  return composed;
}

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

  const handleCategoryChange = (skillId: string, category: TargetCategory) => {
    // Get current selector to preserve strategy when switching categories
    const skill = selectedCharacter.skills.find((s) => s.id === skillId);
    if (!skill) {
      console.error("[handleCategoryChange] Skill not found:", skillId);
      return;
    }

    const currentSelector = skill.selectorOverride || DEFAULT_SELECTOR;
    const { strategy } = decomposeSelector(currentSelector.type);

    const newType = composeSelector(category, strategy);
    updateSkill(selectedCharacter.id, skillId, {
      selectorOverride: { type: newType },
    });
  };

  const handleStrategyChange = (skillId: string, strategy: TargetStrategy) => {
    // Get current selector to preserve category when switching strategies
    const skill = selectedCharacter.skills.find((s) => s.id === skillId);
    if (!skill) {
      console.error("[handleStrategyChange] Skill not found:", skillId);
      return;
    }

    const currentSelector = skill.selectorOverride || DEFAULT_SELECTOR;
    const { category } = decomposeSelector(currentSelector.type);

    const newType = composeSelector(category, strategy);
    updateSkill(selectedCharacter.id, skillId, {
      selectorOverride: { type: newType },
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

          const decomposed = decomposeSelector(selector.type);

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
                    Target:
                    <select
                      value={decomposed.category}
                      onChange={(e) =>
                        handleCategoryChange(
                          skill.id,
                          e.target.value as TargetCategory,
                        )
                      }
                      aria-label="Target category"
                    >
                      <option value="enemy">Enemy</option>
                      <option value="ally">Ally</option>
                      <option value="self">Self</option>
                    </select>
                  </label>

                  <label>
                    Selection:
                    <select
                      value={decomposed.strategy}
                      onChange={(e) =>
                        handleStrategyChange(
                          skill.id,
                          e.target.value as TargetStrategy,
                        )
                      }
                      aria-label="Selection strategy"
                      disabled={decomposed.category === "self"}
                    >
                      <option value="nearest">Nearest</option>
                      <option value="lowest_hp">Lowest HP</option>
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
