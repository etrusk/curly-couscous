/**
 * IntentOverlay - SVG overlay for rendering intent lines.
 * Positioned absolutely over the battle grid.
 */

import { useGameStore, selectIntentData } from "../../stores/gameStore";
import { IntentLine } from "./IntentLine";
import styles from "./IntentOverlay.module.css";

export interface IntentOverlayProps {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
}

export function IntentOverlay({
  gridWidth,
  gridHeight,
  cellSize,
}: IntentOverlayProps) {
  // Subscribe to intent data for line rendering
  const intents = useGameStore(selectIntentData);

  const svgWidth = gridWidth * cellSize;
  const svgHeight = gridHeight * cellSize;

  return (
    <svg
      className={styles.intentOverlay}
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
    >
      {/* SVG marker definitions */}
      <defs>
        {/* Attack arrowheads - filled */}
        <marker
          id="arrowhead-friendly"
          markerWidth="12"
          markerHeight="8"
          refX="9"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
          overflow="visible"
        >
          {/* White outline polygon (rendered first - behind) */}
          <polygon
            points="0,0 10,4 0,8"
            fill="var(--contrast-line)"
            stroke="var(--contrast-line)"
          />
          {/* Colored main polygon (rendered second - on top) */}
          <polygon points="0,0 10,4 0,8" fill="var(--faction-friendly)" />
        </marker>
        <marker
          id="arrowhead-enemy"
          markerWidth="12"
          markerHeight="8"
          refX="9"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
          overflow="visible"
        >
          {/* White outline polygon (rendered first - behind) */}
          <polygon
            points="0,0 10,4 0,8"
            fill="var(--contrast-line)"
            stroke="var(--contrast-line)"
          />
          {/* Colored main polygon (rendered second - on top) */}
          <polygon points="0,0 10,4 0,8" fill="var(--faction-enemy)" />
        </marker>

        {/* Movement endpoints - hollow */}
        <marker
          id="circle-friendly"
          markerWidth="12"
          markerHeight="12"
          refX="6"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
          overflow="visible"
        >
          {/* White outline circle (thicker - rendered first - behind) */}
          <circle
            cx="6"
            cy="6"
            r="4"
            fill="none"
            stroke="var(--contrast-line)"
            strokeWidth="3"
          />
          {/* Colored main circle (rendered second - on top) */}
          <circle
            cx="6"
            cy="6"
            r="4"
            fill="none"
            stroke="var(--faction-friendly)"
            strokeWidth="1.5"
          />
        </marker>
        <marker
          id="diamond-enemy"
          markerWidth="12"
          markerHeight="12"
          refX="6"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
          overflow="visible"
        >
          {/* White outline polygon (thicker - rendered first - behind) */}
          <polygon
            points="6,0 12,6 6,12 0,6"
            fill="none"
            stroke="white"
            strokeWidth="3"
          />
          {/* Colored main polygon (rendered second - on top) */}
          <polygon
            points="6,0 12,6 6,12 0,6"
            fill="none"
            stroke="#E69F00"
            strokeWidth="1.5"
          />
        </marker>
      </defs>

      {/* Render intent lines */}
      {intents.map((intent) => (
        <IntentLine
          key={intent.characterId}
          from={intent.characterPosition}
          to={intent.action.targetCell}
          type={intent.action.type as "attack" | "move"}
          faction={intent.faction}
          ticksRemaining={intent.ticksRemaining}
          cellSize={cellSize}
        />
      ))}
    </svg>
  );
}
