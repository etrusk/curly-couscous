/**
 * CharacterControls component for adding and removing characters.
 * Provides Add Friendly, Add Enemy, and Remove buttons.
 */

import {
  useGameStore,
  selectActions,
  selectIsGridFull,
  selectSelectedCharacterId,
} from "../../stores/gameStore";
import styles from "./CharacterControls.module.css";

export function CharacterControls() {
  const actions = useGameStore(selectActions);
  const isGridFull = useGameStore(selectIsGridFull);
  const selectedCharacterId = useGameStore(selectSelectedCharacterId);

  const handleAddFriendly = () => {
    actions.addCharacter("friendly");
  };

  const handleAddEnemy = () => {
    actions.addCharacter("enemy");
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
        aria-label="Add Friendly"
      >
        Add Friendly
      </button>
      <button
        onClick={handleAddEnemy}
        disabled={isGridFull}
        aria-label="Add Enemy"
      >
        Add Enemy
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
