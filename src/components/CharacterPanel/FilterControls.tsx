/**
 * FilterControls - Filter condition UI for a skill row.
 * Extracted from SkillRow to keep file sizes under 400 lines.
 * Manages filter state (add/remove/change condition/value/NOT/qualifier).
 */

import React from "react";
import type {
  Skill,
  SkillFilter,
  ConditionType,
  ConditionQualifier,
} from "../../engine/types";
import { useGameStore, selectActions } from "../../stores/gameStore";
import { QualifierSelect } from "./QualifierSelect";
import styles from "./SkillRow.module.css";

const FILTER_VALUE_CONDITIONS = new Set<ConditionType>([
  "hp_below",
  "hp_above",
  "in_range",
]);

function getFilterDefaultValue(condition: ConditionType): number {
  if (condition === "hp_below" || condition === "hp_above") return 50;
  return 3; // in_range
}

interface FilterControlsProps {
  skill: Skill;
  characterId: string;
}

export function FilterControls({ skill, characterId }: FilterControlsProps) {
  const { updateSkill } = useGameStore(selectActions);

  // Track local filter overrides for reactive UI updates after store mutations.
  // This ensures condition switches (e.g., channeling -> idle) immediately hide/show
  // qualifier dropdowns without waiting for parent re-render.
  const [filterOverride, setFilterOverride] = React.useState<
    SkillFilter | null | undefined
  >(undefined);
  const currentFilter =
    filterOverride !== undefined ? (filterOverride ?? undefined) : skill.filter;

  const handleAddFilter = () => {
    const newFilter: SkillFilter = {
      condition: "hp_below",
      conditionValue: 50,
    };
    setFilterOverride(newFilter);
    updateSkill(characterId, skill.instanceId, { filter: newFilter });
  };

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const filterType = e.target.value as ConditionType;
    const newFilter: SkillFilter = FILTER_VALUE_CONDITIONS.has(filterType)
      ? {
          condition: filterType,
          conditionValue: getFilterDefaultValue(filterType),
        }
      : { condition: filterType };

    // Preserve negated if present
    if (currentFilter?.negated) {
      newFilter.negated = true;
    }

    setFilterOverride(newFilter);
    updateSkill(characterId, skill.instanceId, { filter: newFilter });
  };

  const handleFilterValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (isNaN(parsed)) return;
    const newFilter: SkillFilter = {
      ...currentFilter!,
      conditionValue: parsed,
    };
    setFilterOverride(newFilter);
    updateSkill(characterId, skill.instanceId, { filter: newFilter });
  };

  const handleFilterNotToggle = () => {
    if (!currentFilter) return;
    const newFilter = { ...currentFilter, negated: !currentFilter.negated };
    setFilterOverride(newFilter);
    updateSkill(characterId, skill.instanceId, { filter: newFilter });
  };

  const handleFilterQualifierChange = (
    qualifier: ConditionQualifier | undefined,
  ) => {
    if (!currentFilter) return;
    if (qualifier === undefined) {
      const { qualifier: _, ...rest } = currentFilter;
      setFilterOverride(rest);
      updateSkill(characterId, skill.instanceId, { filter: rest });
    } else {
      const newFilter = { ...currentFilter, qualifier };
      setFilterOverride(newFilter);
      updateSkill(characterId, skill.instanceId, { filter: newFilter });
    }
  };

  const handleRemoveFilter = () => {
    setFilterOverride(null);
    updateSkill(characterId, skill.instanceId, { filter: undefined });
  };

  return (
    <div className={`${styles.fieldGroup} ${styles.filterField}`}>
      <span className={styles.fieldLabel}>FILTER</span>
      {currentFilter ? (
        <span className={styles.filterGroup}>
          <button
            type="button"
            onClick={handleFilterNotToggle}
            className={`${styles.notToggle} ${currentFilter.negated ? styles.notToggleActive : ""}`}
            aria-label={`Toggle NOT modifier for filter on ${skill.name}`}
            aria-pressed={!!currentFilter.negated}
          >
            NOT
          </button>
          <select
            value={currentFilter.condition}
            onChange={handleFilterTypeChange}
            className={styles.select}
            aria-label={`Filter type for ${skill.name}`}
          >
            <option value="hp_below">HP below</option>
            <option value="hp_above">HP above</option>
            <option value="in_range">In range</option>
            <option value="channeling">Channeling</option>
            <option value="idle">Idle</option>
            <option value="targeting_me">Cell targeted</option>
            <option value="targeting_ally">Targeting ally</option>
          </select>
          {FILTER_VALUE_CONDITIONS.has(currentFilter.condition) && (
            <input
              key={currentFilter.condition}
              type="number"
              defaultValue={currentFilter.conditionValue}
              onChange={handleFilterValueChange}
              className={styles.input}
              aria-label={`Filter value for ${skill.name}`}
            />
          )}
          {currentFilter.condition === "channeling" && (
            <QualifierSelect
              value={currentFilter.qualifier}
              onChange={handleFilterQualifierChange}
              ariaLabel={`Filter qualifier for ${skill.name}`}
              className={styles.select}
            />
          )}
          <button
            onClick={handleRemoveFilter}
            className={styles.removeFilterBtn}
            aria-label={`Remove filter for ${skill.name}`}
          >
            x
          </button>
        </span>
      ) : (
        <button
          onClick={handleAddFilter}
          className={styles.addFilterBtn}
          aria-label={`Add filter for ${skill.name}`}
        >
          + Filter
        </button>
      )}
    </div>
  );
}
