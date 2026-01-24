/**
 * CharacterControls component for adding and removing characters.
 * Provides Add Friendly, Add Enemy, and Remove buttons.
 */

import {
  useGameStore,
  selectActions,
  selectIsGridFull,
  selectSelectedCharacterId,
  selectSelectionMode,
} from "../../stores/gameStore";
import styles from "./CharacterControls.module.css";

export function CharacterControls() {
  const actions = useGameStore(selectActions);
  const isGridFull = useGameStore(selectIsGridFull);
  const selectedCharacterId = useGameStore(selectSelectedCharacterId);
  const selectionMode = useGameStore(selectSelectionMode);

  const handleAddFriendly = () => {
    if (selectionMode === "placing-friendly") {
      actions.setSelectionMode("idle");
    } else {
      actions.setSelectionMode("placing-friendly");
    }
  };

  const handleAddEnemy = () => {
    if (selectionMode === "placing-enemy") {
      actions.setSelectionMode("idle");
    } else {
      actions.setSelectionMode("placing-enemy");
    }
  };

  const handleMove = () => {
    if (selectionMode === "moving") {
      actions.setSelectionMode("idle");
    } else {
      actions.setSelectionMode("moving");
    }
  };

  const handleRemove = () => {
    if (selectedCharacterId) {
      actions.removeCharacter(selectedCharacterId);
    }
  };

  return (
    <div
      className={styles.characterControls}
      role="group"
      aria-label="Character controls"
    >
      <button
        onClick={handleAddFriendly}
        disabled={isGridFull}
        className={
          selectionMode === "placing-friendly" ? styles.activeButton : ""
        }
        aria-label="Add Friendly"
        aria-pressed={selectionMode === "placing-friendly"}
      >
        Add Friendly
      </button>
      <button
        onClick={handleAddEnemy}
        disabled={isGridFull}
        className={selectionMode === "placing-enemy" ? styles.activeButton : ""}
        aria-label="Add Enemy"
        aria-pressed={selectionMode === "placing-enemy"}
      >
        Add Enemy
      </button>
      <button
        onClick={handleMove}
        disabled={!selectedCharacterId}
        className={selectionMode === "moving" ? styles.activeButton : ""}
        aria-label="Move Character"
        aria-pressed={selectionMode === "moving"}
      >
        Move
      </button>
      <button
        onClick={handleRemove}
        disabled={!selectedCharacterId}
        aria-label="Remove"
      >
        Remove
      </button>
    </div>
  );
}
