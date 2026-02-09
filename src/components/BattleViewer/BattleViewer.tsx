/**
 * BattleViewer - main container component for the battle grid visualization.
 * Coordinates grid rendering and overlays for intents and damage numbers.
 */

import { useRef } from "react";
import { positionKey } from "../../engine/hex";
import { Grid } from "./Grid";
import { IntentOverlay } from "./IntentOverlay";
import { TargetingLineOverlay } from "./TargetingLineOverlay";
import { DamageOverlay } from "./DamageOverlay";
import { WhiffOverlay } from "./WhiffOverlay";
import {
  useGameStore,
  selectTokenData,
  selectClickableCells,
  selectSelectionMode,
  selectSelectedCharacterId,
  selectActions,
} from "../../stores/gameStore";
import styles from "./BattleViewer.module.css";

export interface BattleViewerProps {
  hexSize?: number;
}

export function BattleViewer({ hexSize = 30 }: BattleViewerProps) {
  // Subscribe to token data for character rendering
  const characters = useGameStore(selectTokenData);

  // Subscribe to clickable cells and selection mode
  const clickableCells = useGameStore(selectClickableCells);
  const selectionMode = useGameStore(selectSelectionMode);
  const selectedCharacterId = useGameStore(selectSelectedCharacterId);
  const actions = useGameStore(selectActions);

  // Handle cell click based on selection mode
  const handleCellClick = (q: number, r: number) => {
    if (selectionMode === "placing-friendly") {
      actions.addCharacterAtPosition("friendly", { q, r });
      actions.setSelectionMode("idle");
    } else if (selectionMode === "placing-enemy") {
      actions.addCharacterAtPosition("enemy", { q, r });
      actions.setSelectionMode("idle");
    } else if (selectionMode === "moving" && selectedCharacterId) {
      actions.moveCharacter(selectedCharacterId, { q, r });
      actions.setSelectionMode("idle");
    } else if (selectionMode === "idle") {
      const key = positionKey({ q, r });
      const hasCharacter = characters.some(
        (c) => positionKey(c.position) === key,
      );
      if (!hasCharacter) {
        actions.selectCharacter(null);
      }
    }
  };

  // Refs for background click detection
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Handle background click to deselect in idle mode
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (selectionMode !== "idle") return;
    // Only deselect when clicking the container itself, not children
    if (e.target === e.currentTarget || e.target === gridContainerRef.current) {
      actions.selectCharacter(null);
    }
  };

  return (
    <div className={styles.battleViewer} onClick={handleBackgroundClick}>
      <div className={styles.gridContainer} ref={gridContainerRef}>
        <Grid
          hexSize={hexSize}
          characters={characters}
          onCellClick={handleCellClick}
          clickableCells={clickableCells}
        />
        <WhiffOverlay hexSize={hexSize} />
        <IntentOverlay hexSize={hexSize} />
        <TargetingLineOverlay hexSize={hexSize} />
        <DamageOverlay hexSize={hexSize} />
      </div>
    </div>
  );
}
