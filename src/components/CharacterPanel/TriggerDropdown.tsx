/**
 * TriggerDropdown - Extracted sub-component for a single trigger dropdown + value input.
 * Controlled component: receives a Trigger and calls back with the new Trigger on changes.
 */

import type { Trigger } from "../../engine/types";
import styles from "./TriggerDropdown.module.css";

interface TriggerDropdownProps {
  trigger: Trigger;
  skillName: string;
  triggerIndex: number;
  onTriggerChange: (trigger: Trigger) => void;
  onRemove?: () => void;
}

import type { ConditionType } from "../../engine/types";

const VALUE_CONDITIONS = new Set<ConditionType>([
  "hp_below",
  "hp_above",
  "in_range",
]);

function getDefaultValue(condition: ConditionType): number {
  if (condition === "hp_below" || condition === "hp_above") return 50;
  return 3; // in_range
}

export function TriggerDropdown({
  trigger,
  skillName,
  triggerIndex,
  onTriggerChange,
  onRemove,
}: TriggerDropdownProps) {
  const hasValue = VALUE_CONDITIONS.has(trigger.condition);
  const ariaLabel =
    triggerIndex === 0
      ? `Trigger for ${skillName}`
      : `Second trigger for ${skillName}`;

  const handleScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newScope = e.target.value as Trigger["scope"];
    onTriggerChange({ ...trigger, scope: newScope });
  };

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCondition = e.target.value as ConditionType;
    const newTrigger: Trigger = VALUE_CONDITIONS.has(newCondition)
      ? {
          scope: trigger.scope,
          condition: newCondition,
          conditionValue: getDefaultValue(newCondition),
        }
      : { scope: trigger.scope, condition: newCondition };

    // Preserve negated field if present, but clear it when switching to "always"
    if (trigger.negated && newCondition !== "always") {
      newTrigger.negated = true;
    }

    onTriggerChange(newTrigger);
  };

  const handleNotToggle = () => {
    onTriggerChange({ ...trigger, negated: !trigger.negated });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (isNaN(parsed)) return;
    onTriggerChange({ ...trigger, conditionValue: parsed });
  };

  return (
    <span className={styles.triggerControl}>
      {trigger.condition !== "always" && (
        <button
          type="button"
          onClick={handleNotToggle}
          className={`${styles.notToggle} ${trigger.negated ? styles.notToggleActive : ""}`}
          aria-label={`Toggle NOT modifier for ${skillName}`}
          aria-pressed={!!trigger.negated}
        >
          NOT
        </button>
      )}
      <select
        value={trigger.scope}
        onChange={handleScopeChange}
        className={styles.select}
        aria-label={`Trigger scope for ${skillName}`}
      >
        <option value="enemy">Enemy</option>
        <option value="ally">Ally</option>
        <option value="self">Self</option>
      </select>
      <select
        value={trigger.condition}
        onChange={handleConditionChange}
        className={styles.select}
        aria-label={ariaLabel}
      >
        <option value="always">Always</option>
        <option value="in_range">In range</option>
        <option value="hp_below">HP below</option>
        <option value="hp_above">HP above</option>
        <option value="targeting_me">Cell targeted</option>
        <option value="channeling">Channeling</option>
        <option value="idle">Idle</option>
        <option value="targeting_ally">Targeting ally</option>
      </select>

      {hasValue && (
        <input
          key={trigger.condition}
          type="number"
          defaultValue={trigger.conditionValue}
          onChange={handleValueChange}
          className={styles.input}
          aria-label={`Trigger value for ${skillName}`}
        />
      )}

      {onRemove && (
        <button
          onClick={onRemove}
          className={styles.removeBtn}
          aria-label={`Remove second trigger for ${skillName}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
