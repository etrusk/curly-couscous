/**
 * QualifierSelect - Shared qualifier dropdown for channeling condition.
 * Used by both SkillRow (filter qualifier) and TriggerDropdown (trigger qualifier).
 * Renders action type and skill optgroups with (any) default.
 */

import type { ConditionQualifier } from "../../engine/types";
import { SKILL_REGISTRY } from "../../engine/skill-registry";

interface QualifierSelectProps {
  value: ConditionQualifier | undefined;
  onChange: (qualifier: ConditionQualifier | undefined) => void;
  ariaLabel: string;
  className?: string;
}

export function QualifierSelect({
  value,
  onChange,
  ariaLabel,
  className,
}: QualifierSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "") {
      onChange(undefined);
    } else {
      const colonIdx = selected.indexOf(":");
      const type = selected.slice(0, colonIdx);
      const id = selected.slice(colonIdx + 1);
      onChange({ type: type as "action" | "skill", id });
    }
  };

  return (
    <select
      value={value ? `${value.type}:${value.id}` : ""}
      onChange={handleChange}
      className={className}
      aria-label={ariaLabel}
    >
      <option value="">(any)</option>
      <optgroup label="Action Type">
        <option value="action:attack">Attack</option>
        <option value="action:move">Move</option>
        <option value="action:heal">Heal</option>
        <option value="action:interrupt">Interrupt</option>
        <option value="action:charge">Charge</option>
      </optgroup>
      <optgroup label="Skill">
        {SKILL_REGISTRY.map((def) => (
          <option key={def.id} value={`skill:${def.id}`}>
            {def.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
