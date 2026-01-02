/**
 * BattleViewer - main container component for the battle grid visualization.
 * Coordinates grid rendering and overlays for intents and damage numbers.
 */

import { Grid } from "./Grid";
import { IntentOverlay } from "./IntentOverlay";
import { DamageOverlay } from "./DamageOverlay";
import { useGameStore, selectTokenData } from "../../stores/gameStore";
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

  // Cell size from CSS custom property (default 50px per spec)
  const cellSize = 50;

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
        <Grid width={gridWidth} height={gridHeight} characters={characters} />
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
