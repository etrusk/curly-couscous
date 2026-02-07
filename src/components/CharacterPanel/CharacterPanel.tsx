/**
 * CharacterPanel component - Single-panel interface for character configuration
 * and battle monitoring. Renders PriorityTab directly (no tabs).
 */

import { useGameStore } from "../../stores/gameStore";
import { PriorityTab } from "./PriorityTab";
import { slotPositionToLetter } from "../../utils/letterMapping";
import styles from "./CharacterPanel.module.css";

export function CharacterPanel() {
  const selectedCharacterId = useGameStore(
    (state) => state.selectedCharacterId,
  );
  const character = useGameStore((state) =>
    state.gameState.characters.find((c) => c.id === selectedCharacterId),
  );

  // Show placeholder if no character selected
  if (!character) {
    return (
      <div className={styles.panel} data-testid="character-panel">
        <div className={styles.placeholder}>
          click a character on the grid to configure
        </div>
      </div>
    );
  }

  const letter = slotPositionToLetter(character.slotPosition);
  const factionLabel =
    character.faction.charAt(0).toUpperCase() + character.faction.slice(1);

  return (
    <div className={styles.panel} data-testid="character-panel">
      {/* Header with character identification */}
      <div className={styles.header}>
        <h2 className={styles.title} data-testid="character-panel-title">
          Character {factionLabel} {letter}
        </h2>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <PriorityTab />
      </div>
    </div>
  );
}
