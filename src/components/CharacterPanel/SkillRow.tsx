/**
 * SkillRow - Displays a single skill in priority list.
 */

import type {
  Character,
  Skill,
  Trigger,
  SelectorFilterType,
} from "../../engine/types";
import { useGameStore, selectActions } from "../../stores/gameStore";
import { MAX_SKILL_SLOTS } from "../../stores/gameStore-constants";
import { getSkillDefinition } from "../../engine/skill-registry";
import { TriggerDropdown } from "./TriggerDropdown";
import { SkillRowActions } from "./SkillRowActions";
import styles from "./SkillRow.module.css";

interface SkillRowProps {
  skill: Skill;
  character: Character;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  evaluation?: {
    status: "selected" | "rejected" | "skipped";
    rejectionReason?: string;
    resolvedTarget?: Character;
  };
}

// eslint-disable-next-line complexity -- UI component with multiple conditional rendering paths
export function SkillRow({
  skill,
  character,
  index,
  isFirst,
  isLast,
  evaluation,
}: SkillRowProps) {
  const { updateSkill, moveSkillUp, moveSkillDown } =
    useGameStore(selectActions);
  const allCharacters = useGameStore((state) => state.gameState.characters);

  const skillDef = getSkillDefinition(skill.id);

  const handleTriggerUpdate = (newTrigger: Trigger) => {
    updateSkill(character.id, skill.instanceId, { trigger: newTrigger });
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const target = e.target.value as "enemy" | "ally" | "self";
    updateSkill(character.id, skill.instanceId, {
      target,
      criterion: target === "self" ? "nearest" : skill.criterion,
    });
  };

  const handleCriterionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSkill(character.id, skill.instanceId, {
      criterion: e.target.value as
        | "nearest"
        | "furthest"
        | "lowest_hp"
        | "highest_hp",
    });
  };

  const handleBehaviorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSkill(character.id, skill.instanceId, {
      behavior: e.target.value,
    });
  };

  const handleAddFilter = () => {
    updateSkill(character.id, skill.instanceId, {
      selectorFilter: { type: "hp_below", value: 50 },
    });
  };

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const filterType = e.target.value as SelectorFilterType;
    updateSkill(character.id, skill.instanceId, {
      selectorFilter: {
        type: filterType,
        value: skill.selectorFilter?.value ?? 50,
      },
    });
  };

  const handleFilterValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (isNaN(parsed)) return;
    updateSkill(character.id, skill.instanceId, {
      selectorFilter: { type: skill.selectorFilter!.type, value: parsed },
    });
  };

  const handleRemoveFilter = () => {
    updateSkill(character.id, skill.instanceId, {
      selectorFilter: undefined,
    });
  };

  const instanceCount = character.skills.filter(
    (s) => s.id === skill.id,
  ).length;
  const canDuplicate = character.skills.length < MAX_SKILL_SLOTS;
  const isDuplicate = instanceCount > 1;
  const isInnate = skillDef?.innate ?? false;

  const handleToggleEnabled = () => {
    updateSkill(character.id, skill.instanceId, { enabled: !skill.enabled });
  };

  // Compute evaluation display data when available
  const evalDisplay = evaluation
    ? {
        statusIcon:
          evaluation.status === "selected"
            ? "✓"
            : evaluation.status === "rejected"
              ? "✗"
              : "—",
        statusLabel:
          evaluation.status === "selected"
            ? "Selected"
            : evaluation.status === "rejected"
              ? "Rejected"
              : "Skipped",
        statusClass:
          evaluation.status === "selected"
            ? styles.statusSelected
            : evaluation.status === "rejected"
              ? styles.statusRejected
              : styles.statusSkipped,
      }
    : null;

  // Always show config controls; add evaluation indicators when available
  return (
    <div
      className={[
        styles.skillRow,
        evalDisplay && styles.battleMode,
        evalDisplay && evalDisplay.statusClass,
        skill.cooldownRemaining &&
          skill.cooldownRemaining > 0 &&
          styles.onCooldown,
      ]
        .filter(Boolean)
        .join(" ")}
      data-mode={evaluation ? "battle" : undefined}
    >
      {evalDisplay && (
        <span
          className={styles.statusIcon}
          aria-label={evalDisplay.statusLabel}
        >
          {evalDisplay.statusIcon}
        </span>
      )}
      <label className={styles.enableCheckbox}>
        <input
          type="checkbox"
          checked={skill.enabled}
          onChange={handleToggleEnabled}
          aria-label={`Enable ${skill.name}`}
        />
      </label>
      <div className={styles.priorityControls}>
        <button
          onClick={() => moveSkillUp(character.id, index)}
          disabled={isFirst}
          aria-label="Move up"
        >
          ↑
        </button>
        <button
          onClick={() => moveSkillDown(character.id, index)}
          disabled={isLast}
          aria-label="Move down"
        >
          ↓
        </button>
      </div>

      <h3 className={styles.skillName}>{skill.name}</h3>
      {skill.cooldownRemaining != null && skill.cooldownRemaining > 0 && (
        <span className={styles.cooldownBadge}>
          CD: {skill.cooldownRemaining}
        </span>
      )}

      {evaluation?.status === "selected" && evaluation.resolvedTarget && (
        <span className={styles.target}>
          →{" "}
          {evaluation.resolvedTarget.faction === "friendly"
            ? "Friendly"
            : "Enemy"}{" "}
          {(() => {
            const factionChars = allCharacters
              .filter((c) => c.faction === evaluation.resolvedTarget!.faction)
              .sort((a, b) => a.slotPosition - b.slotPosition);
            const factionIndex = factionChars.findIndex(
              (c) => c.id === evaluation.resolvedTarget!.id,
            );
            const letterIndex =
              factionIndex >= 0
                ? factionIndex
                : evaluation.resolvedTarget.slotPosition - 1;
            return String.fromCharCode(65 + letterIndex);
          })()}
        </span>
      )}
      {evaluation?.status === "rejected" && evaluation.rejectionReason && (
        <span className={styles.rejectionReason}>
          {formatRejectionReason(evaluation.rejectionReason)}
        </span>
      )}

      <div className={styles.triggerGroup}>
        <TriggerDropdown
          trigger={skill.trigger}
          skillName={skill.name}
          triggerIndex={0}
          onTriggerChange={handleTriggerUpdate}
        />
      </div>

      <select
        value={skill.target}
        onChange={handleTargetChange}
        className={styles.select}
        aria-label={`Target for ${skill.name}`}
      >
        <option value="enemy">Enemy</option>
        <option value="ally">Ally</option>
        <option value="self">Self</option>
      </select>

      <select
        value={skill.criterion}
        onChange={handleCriterionChange}
        disabled={skill.target === "self"}
        className={styles.select}
        aria-label={`Criterion for ${skill.name}`}
      >
        <option value="nearest">Nearest</option>
        <option value="furthest">Furthest</option>
        <option value="lowest_hp">Lowest HP</option>
        <option value="highest_hp">Highest HP</option>
      </select>

      {skill.selectorFilter ? (
        <span className={styles.filterGroup}>
          <select
            value={skill.selectorFilter.type}
            onChange={handleFilterTypeChange}
            className={styles.select}
            aria-label={`Filter type for ${skill.name}`}
          >
            <option value="hp_below">HP below</option>
            <option value="hp_above">HP above</option>
          </select>
          <input
            type="number"
            defaultValue={skill.selectorFilter.value}
            onChange={handleFilterValueChange}
            className={styles.input}
            aria-label={`Filter value for ${skill.name}`}
          />
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

      {skillDef && skillDef.behaviors.length > 1 && (
        <select
          value={skill.behavior}
          onChange={handleBehaviorChange}
          className={styles.select}
          aria-label={`Behavior for ${skill.name}`}
        >
          {skillDef.behaviors.map((b) => (
            <option key={b} value={b}>
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </option>
          ))}
        </select>
      )}

      <SkillRowActions
        skill={skill}
        character={character}
        skillDef={skillDef}
        canDuplicate={canDuplicate}
        isDuplicate={isDuplicate}
        isInnate={isInnate}
      />
    </div>
  );
}

function formatRejectionReason(reason: string): string {
  const map: Record<string, string> = {
    disabled: "Skill disabled",
    trigger_failed: "Trigger failed",
    no_target: "No valid target",
    out_of_range: "Target out of range",
    on_cooldown: "On cooldown",
    filter_failed: "Filter: target HP mismatch",
  };
  return map[reason] || reason;
}
