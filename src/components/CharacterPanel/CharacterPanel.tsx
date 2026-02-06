/**
 * CharacterPanel component - Tabbed interface for character configuration and battle monitoring.
 * Contains Loadout tab (skills + inventory) and Priority tab (skill priorities + evaluation).
 */

import { useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useAccessibilityStore } from "../../stores/accessibilityStore";
import { LoadoutTab } from "./LoadoutTab";
import { PriorityTab } from "./PriorityTab";
import { slotPositionToLetter } from "../../utils/letterMapping";
import styles from "./CharacterPanel.module.css";

export function CharacterPanel() {
  const selectedCharacterId = useGameStore(
    (state) => state.selectedCharacterId,
  );
  const battleStatus = useGameStore((state) => state.gameState.battleStatus);
  const character = useGameStore((state) =>
    state.gameState.characters.find((c) => c.id === selectedCharacterId),
  );

  // Local tab state (ADR-004: component-level UI state)
  const [activeTab, setActiveTab] = useState<"loadout" | "priority">("loadout");

  // Read autoFocus preference from accessibility store
  const autoFocus = useAccessibilityStore((s) => s.autoFocus);

  // Auto-switch to Priority tab when battle starts (ADR per spec)
  useEffect(() => {
    if (autoFocus && battleStatus === "active") {
      setActiveTab("priority");
    }
  }, [battleStatus, autoFocus]);

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

      {/* Tab navigation */}
      <div className={styles.tabs} role="tablist">
        <button
          id="loadout-tab"
          role="tab"
          aria-selected={activeTab === "loadout"}
          aria-controls="loadout-panel"
          className={`${styles.tab} ${activeTab === "loadout" ? styles.active : ""}`}
          onClick={() => setActiveTab("loadout")}
          data-testid="tab-loadout"
        >
          Loadout
        </button>
        <button
          id="priority-tab"
          role="tab"
          aria-selected={activeTab === "priority"}
          aria-controls="priority-panel"
          className={`${styles.tab} ${activeTab === "priority" ? styles.active : ""}`}
          onClick={() => setActiveTab("priority")}
          data-testid="tab-priority"
        >
          Priority
        </button>
      </div>

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === "loadout" && (
          <div id="loadout-panel" role="tabpanel" aria-labelledby="loadout-tab">
            <LoadoutTab />
          </div>
        )}
        {activeTab === "priority" && (
          <div
            id="priority-panel"
            role="tabpanel"
            aria-labelledby="priority-tab"
          >
            <PriorityTab
              mode={battleStatus === "active" ? "battle" : "config"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
