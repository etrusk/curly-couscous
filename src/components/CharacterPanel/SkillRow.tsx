/**
 * SkillRow - Displays a single skill in priority list (config or battle mode)
 */

import type { Character, Skill, Trigger } from "../../engine/types";
import { useGameStore, selectActions } from "../../stores/gameStore";
import { TriggerDropdown } from "./TriggerDropdown";
import styles from "./SkillRow.module.css";

interface SkillRowProps {
  skill: Skill;
  character: Character;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  mode: "config" | "battle";
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
  mode,
  evaluation,
}: SkillRowProps) {
  const { updateSkill, moveSkillUp, moveSkillDown, duplicateSkill } =
    useGameStore(selectActions);

  const triggers = skill.triggers ?? [];
  const trigger0: Trigger = triggers[0] || { type: "always" };
  const trigger1: Trigger | undefined = triggers[1];
  const isMove = skill.id === "move-towards";

  const handleTriggerUpdate = (idx: number, newTrigger: Trigger) => {
    const newTriggers = [...triggers];
    // Ensure array has at least the right size
    if (newTriggers.length === 0) {
      newTriggers.push(trigger0);
    }
    newTriggers[idx] = newTrigger;
    updateSkill(character.id, skill.instanceId, { triggers: newTriggers });
  };

  const handleAddTrigger = () => {
    const defaultTrigger: Trigger = { type: "hp_below", value: 50 };
    let first = trigger0;
    // Auto-replace "always" when adding second trigger
    if (first.type === "always") {
      first = { type: "hp_below", value: 50 };
    }
    updateSkill(character.id, skill.instanceId, {
      triggers: [first, defaultTrigger],
    });
  };

  const handleRemoveTrigger = () => {
    updateSkill(character.id, skill.instanceId, {
      triggers: [trigger0],
    });
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
      behavior: e.target.value as "towards" | "away",
    });
  };

  const handleDuplicate = () => {
    duplicateSkill(character.id, skill.instanceId);
  };

  const moveInstanceCount = character.skills.filter(
    (s) => s.id === "move-towards",
  ).length;
  const canDuplicate = isMove && moveInstanceCount < 3;

  if (mode === "battle" && evaluation) {
    // Battle mode: show evaluation status
    const statusIcon =
      evaluation.status === "selected"
        ? "✓"
        : evaluation.status === "rejected"
          ? "✗"
          : "—";
    const statusLabel =
      evaluation.status === "selected"
        ? "Selected"
        : evaluation.status === "rejected"
          ? "Rejected"
          : "Skipped";
    const statusClass =
      evaluation.status === "selected"
        ? styles.statusSelected
        : evaluation.status === "rejected"
          ? styles.statusRejected
          : styles.statusSkipped;

    return (
      <div
        className={`${styles.skillRow} ${styles.battleMode} ${statusClass}`}
        data-mode="battle"
      >
        <span className={styles.statusIcon} aria-label={statusLabel}>
          {statusIcon}
        </span>
        <h3 className={styles.skillName}>{skill.name}</h3>
        {evaluation.status === "selected" && evaluation.resolvedTarget && (
          <span className={styles.target}>
            →{" "}
            {evaluation.resolvedTarget.faction === "friendly"
              ? "Friendly"
              : "Enemy"}{" "}
            {String.fromCharCode(
              65 + evaluation.resolvedTarget.slotPosition - 1,
            )}
          </span>
        )}
        {evaluation.status === "rejected" && evaluation.rejectionReason && (
          <span className={styles.rejectionReason}>
            {formatRejectionReason(evaluation.rejectionReason)}
          </span>
        )}
      </div>
    );
  }

  // Config mode: show full controls
  return (
    <div className={styles.skillRow}>
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

      <div className={styles.triggerGroup}>
        <TriggerDropdown
          trigger={trigger0}
          skillName={skill.name}
          triggerIndex={0}
          onTriggerChange={(t) => handleTriggerUpdate(0, t)}
        />

        {trigger1 && (
          <>
            <span className={styles.andLabel} aria-hidden="true">
              AND
            </span>
            <TriggerDropdown
              trigger={trigger1}
              skillName={skill.name}
              triggerIndex={1}
              onTriggerChange={(t) => handleTriggerUpdate(1, t)}
              onRemove={handleRemoveTrigger}
            />
          </>
        )}

        {triggers.length < 2 && (
          <button
            onClick={handleAddTrigger}
            className={styles.addTriggerBtn}
            aria-label={`Add AND trigger for ${skill.name}`}
          >
            + AND
          </button>
        )}
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

      {isMove && (
        <select
          value={skill.behavior}
          onChange={handleBehaviorChange}
          className={styles.select}
          aria-label={`Behavior for ${skill.name}`}
        >
          <option value="towards">Towards</option>
          <option value="away">Away</option>
        </select>
      )}

      {canDuplicate && (
        <button
          onClick={handleDuplicate}
          className={styles.duplicateBtn}
          aria-label={`Duplicate ${skill.name}`}
        >
          Duplicate
        </button>
      )}
    </div>
  );
}

function formatRejectionReason(reason: string): string {
  const map: Record<string, string> = {
    disabled: "Skill disabled",
    trigger_failed: "Trigger failed",
    no_target: "No valid target",
    out_of_range: "Target out of range",
  };
  return map[reason] || reason;
}
