/**
 * BattleViewer - main container component for the battle grid visualization.
 * Coordinates grid rendering and will contain overlays for intents/damage in later phases.
 */

import { Grid } from "./Grid";
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
      <Grid width={gridWidth} height={gridHeight} characters={characters} />
    </div>
  );
}
