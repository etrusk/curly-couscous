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

const VALUE_TRIGGERS = new Set<Trigger["type"]>([
  "hp_below",
  "ally_hp_below",
  "enemy_in_range",
  "ally_in_range",
]);

function getDefaultValue(type: Trigger["type"]): number {
  if (type === "hp_below" || type === "ally_hp_below") return 50;
  return 3; // enemy_in_range, ally_in_range
}

export function TriggerDropdown({
  trigger,
  skillName,
  triggerIndex,
  onTriggerChange,
  onRemove,
}: TriggerDropdownProps) {
  const hasValue = VALUE_TRIGGERS.has(trigger.type);
  const ariaLabel =
    triggerIndex === 0
      ? `Trigger for ${skillName}`
      : `Second trigger for ${skillName}`;

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as Trigger["type"];
    const newTrigger: Trigger = VALUE_TRIGGERS.has(newType)
      ? { type: newType, value: getDefaultValue(newType) }
      : { type: newType };

    // Preserve negated field if present
    if (trigger.negated) {
      newTrigger.negated = true;
    }

    onTriggerChange(newTrigger);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (isNaN(parsed)) return;
    onTriggerChange({ ...trigger, value: parsed });
  };

  return (
    <span className={styles.triggerControl}>
      <select
        value={trigger.type}
        onChange={handleTypeChange}
        className={styles.select}
        aria-label={ariaLabel}
      >
        <option value="always">Always</option>
        <option value="enemy_in_range">Enemy in range</option>
        <option value="ally_in_range">Ally in range</option>
        <option value="hp_below">HP below</option>
        <option value="ally_hp_below">Ally HP below</option>
        <option value="my_cell_targeted_by_enemy">Cell targeted</option>
      </select>

      {hasValue && (
        <input
          key={trigger.type}
          type="number"
          defaultValue={trigger.value}
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
