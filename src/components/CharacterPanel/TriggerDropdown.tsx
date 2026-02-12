/**
 * TriggerDropdown - Extracted sub-component for a single trigger dropdown + value input.
 * Controlled component: receives a Trigger and calls back with the new Trigger on changes.
 *
 * Two-state model:
 * - When condition === "always": renders a "+ Condition" ghost button only
 * - When condition is non-always: renders active trigger controls (scope, condition, value, etc.)
 */

import type {
  Trigger,
  ConditionQualifier,
  ConditionType,
  TriggerScope,
} from "../../engine/types";
import { QualifierSelect } from "./QualifierSelect";
import styles from "./TriggerDropdown.module.css";

interface TriggerDropdownProps {
  trigger: Trigger;
  skillName: string;
  triggerIndex: number;
  onTriggerChange: (trigger: Trigger) => void;
  onRemove?: () => void;
}

const VALUE_CONDITIONS = new Set<ConditionType>([
  "hp_below",
  "hp_above",
  "in_range",
]);

interface ConditionScopeRule {
  showScope: boolean;
  validScopes: TriggerScope[];
  impliedScope?: TriggerScope;
}

const CONDITION_SCOPE_RULES: Record<
  Exclude<ConditionType, "always">,
  ConditionScopeRule
> = {
  in_range: { showScope: true, validScopes: ["enemy", "ally"] },
  hp_below: { showScope: true, validScopes: ["self", "ally", "enemy"] },
  hp_above: { showScope: true, validScopes: ["self", "ally", "enemy"] },
  channeling: { showScope: true, validScopes: ["enemy", "ally"] },
  idle: { showScope: true, validScopes: ["enemy", "ally"] },
  targeting_me: {
    showScope: false,
    validScopes: ["enemy"],
    impliedScope: "enemy",
  },
  targeting_ally: {
    showScope: false,
    validScopes: ["enemy"],
    impliedScope: "enemy",
  },
};

function getDefaultValue(condition: ConditionType): number {
  if (condition === "hp_below" || condition === "hp_above") return 50;
  return 3; // in_range
}

const SCOPE_LABELS: Record<TriggerScope, string> = {
  enemy: "Enemy",
  ally: "Ally",
  self: "Self",
};

export function TriggerDropdown({
  trigger,
  skillName,
  triggerIndex,
  onTriggerChange,
  onRemove,
}: TriggerDropdownProps) {
  const ariaLabel =
    triggerIndex === 0
      ? `Trigger for ${skillName}`
      : `Second trigger for ${skillName}`;

  const handleAddCondition = () => {
    onTriggerChange({
      scope: "enemy",
      condition: "in_range",
      conditionValue: 1,
    });
  };

  const handleRemoveCondition = () => {
    onTriggerChange({ scope: "enemy", condition: "always" });
  };

  const handleScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newScope = e.target.value as TriggerScope;
    onTriggerChange({ ...trigger, scope: newScope });
  };

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCondition = e.target.value as Exclude<ConditionType, "always">;
    const rule = CONDITION_SCOPE_RULES[newCondition];

    // Determine scope: use implied if available, preserve if valid, else reset
    let newScope: TriggerScope = trigger.scope;
    if (rule.impliedScope) {
      newScope = rule.impliedScope;
    } else if (!rule.validScopes.includes(trigger.scope)) {
      newScope = rule.validScopes[0]!;
    }

    const newTrigger: Trigger = VALUE_CONDITIONS.has(newCondition)
      ? {
          scope: newScope,
          condition: newCondition,
          conditionValue: getDefaultValue(newCondition),
        }
      : { scope: newScope, condition: newCondition };

    // Preserve negated field if present
    if (trigger.negated) {
      newTrigger.negated = true;
    }

    onTriggerChange(newTrigger);
  };

  const handleNotToggle = () => {
    onTriggerChange({ ...trigger, negated: !trigger.negated });
  };

  const handleQualifierChange = (qualifier: ConditionQualifier | undefined) => {
    if (qualifier === undefined) {
      const { qualifier: _, ...rest } = trigger;
      onTriggerChange(rest);
    } else {
      onTriggerChange({ ...trigger, qualifier });
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (isNaN(parsed)) return;
    onTriggerChange({ ...trigger, conditionValue: parsed });
  };

  // Two-state: ghost button when unconditional
  if (trigger.condition === "always") {
    return (
      <button
        type="button"
        onClick={handleAddCondition}
        className={styles.addConditionBtn}
        aria-label={`Add condition for ${skillName}`}
      >
        + Condition
      </button>
    );
  }

  // Active trigger controls
  const rule = CONDITION_SCOPE_RULES[trigger.condition];
  const hasValue = VALUE_CONDITIONS.has(trigger.condition);

  return (
    <span className={styles.triggerControl}>
      <button
        type="button"
        onClick={handleNotToggle}
        className={`${styles.notToggle} ${trigger.negated ? styles.notToggleActive : ""}`}
        aria-label={`Toggle NOT modifier for ${skillName}`}
        aria-pressed={!!trigger.negated}
      >
        NOT
      </button>

      {rule.showScope && (
        <select
          value={trigger.scope}
          onChange={handleScopeChange}
          className={styles.select}
          aria-label={`Trigger scope for ${skillName}`}
        >
          {rule.validScopes.map((s) => (
            <option key={s} value={s}>
              {SCOPE_LABELS[s]}
            </option>
          ))}
        </select>
      )}

      <select
        value={trigger.condition}
        onChange={handleConditionChange}
        className={styles.select}
        aria-label={ariaLabel}
      >
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

      {trigger.condition === "channeling" && (
        <QualifierSelect
          value={trigger.qualifier}
          onChange={handleQualifierChange}
          ariaLabel={`Qualifier for ${skillName}`}
          className={styles.select}
        />
      )}

      <button
        type="button"
        onClick={onRemove ? onRemove : handleRemoveCondition}
        className={styles.removeBtn}
        aria-label={
          onRemove
            ? `Remove second trigger for ${skillName}`
            : `Remove condition for ${skillName}`
        }
      >
        x
      </button>
    </span>
  );
}
