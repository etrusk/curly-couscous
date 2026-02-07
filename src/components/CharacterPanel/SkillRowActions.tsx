/**
 * SkillRowActions - Action buttons for a skill row in config mode.
 * Extracted from SkillRow to keep it under 400 lines.
 *
 * Button logic:
 * - Non-innate skills: show "Unassign" button
 * - Innate duplicate skills: show "Remove" button
 * - Skills with available slots: show "Duplicate" button
 */

import type { Character, Skill } from "../../engine/types";
import type { SkillDefinition } from "../../engine/skill-registry";
import { useGameStore, selectActions } from "../../stores/gameStore";
import styles from "./SkillRow.module.css";

interface SkillRowActionsProps {
  skill: Skill;
  character: Character;
  skillDef: SkillDefinition | undefined;
  canDuplicate: boolean;
  isDuplicate: boolean;
  isInnate: boolean;
}

export function SkillRowActions({
  skill,
  character,
  skillDef,
  canDuplicate,
  isDuplicate,
  isInnate,
}: SkillRowActionsProps) {
  const { duplicateSkill, removeSkillFromCharacter } =
    useGameStore(selectActions);

  const handleDuplicate = () => {
    duplicateSkill(character.id, skill.instanceId);
  };

  const handleRemove = () => {
    removeSkillFromCharacter(character.id, skill.instanceId);
  };

  return (
    <>
      {!isInnate && (
        <button
          onClick={handleRemove}
          className={styles.unassignBtn}
          aria-label={`Unassign: ${skillDef?.name ?? skill.name}`}
        >
          Unassign
        </button>
      )}
      {isDuplicate && (
        <button
          onClick={handleRemove}
          className={styles.removeBtn}
          aria-label={`Remove ${skillDef?.name ?? skill.name}`}
        >
          Remove
        </button>
      )}
      {canDuplicate && (
        <button
          onClick={handleDuplicate}
          className={styles.duplicateBtn}
          aria-label={`Duplicate ${skillDef?.name ?? skill.name}`}
        >
          Duplicate
        </button>
      )}
    </>
  );
}
