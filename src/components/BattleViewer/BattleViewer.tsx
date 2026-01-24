/**
 * BattleViewer - main container component for the battle grid visualization.
 * Coordinates grid rendering and overlays for intents and damage numbers.
 */

import { Grid } from "./Grid";
import { IntentOverlay } from "./IntentOverlay";
import { DamageOverlay } from "./DamageOverlay";
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
  gridWidth?: number;
  gridHeight?: number;
}

export function BattleViewer({
  gridWidth = 12,
  gridHeight = 12,
}: BattleViewerProps) {
  // Subscribe to token data for character rendering
  const characters = useGameStore(selectTokenData);

  // Subscribe to clickable cells and selection mode
  const clickableCells = useGameStore(selectClickableCells);
  const selectionMode = useGameStore(selectSelectionMode);
  const selectedCharacterId = useGameStore(selectSelectedCharacterId);
  const actions = useGameStore(selectActions);

  // Cell size from CSS custom property (default 50px per spec)
  const cellSize = 50;

  // Handle cell click based on selection mode
  const handleCellClick = (x: number, y: number) => {
    if (selectionMode === "placing-friendly") {
      actions.addCharacterAtPosition("friendly", { x, y });
      actions.setSelectionMode("idle");
    } else if (selectionMode === "placing-enemy") {
      actions.addCharacterAtPosition("enemy", { x, y });
      actions.setSelectionMode("idle");
    } else if (selectionMode === "moving" && selectedCharacterId) {
      actions.moveCharacter(selectedCharacterId, { x, y });
      actions.setSelectionMode("idle");
    }
  };

  return (
    <div
      className={styles.battleViewer}
      style={
        {
          "--grid-width": gridWidth,
          "--grid-height": gridHeight,
        } as React.CSSProperties
      }
    >
      <div className={styles.gridContainer}>
        <Grid
          width={gridWidth}
          height={gridHeight}
          characters={characters}
          onCellClick={handleCellClick}
          clickableCells={clickableCells}
        />
        <IntentOverlay
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          cellSize={cellSize}
        />
        <DamageOverlay
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          cellSize={cellSize}
        />
      </div>
    </div>
  );
}
