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
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
          overflow="visible"
        >
          {/* White outline polygon (rendered first - behind) */}
          <polygon points="0,0 10,5 0,10" fill="white" stroke="white" />
          {/* Colored main polygon (rendered second - on top) */}
          <polygon points="0,0 10,5 0,10" fill="#0072B2" />
        </marker>
        <marker
          id="arrowhead-enemy"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
          overflow="visible"
        >
          {/* White outline polygon (rendered first - behind) */}
          <polygon points="0,0 10,5 0,10" fill="white" stroke="white" />
          {/* Colored main polygon (rendered second - on top) */}
          <polygon points="0,0 10,5 0,10" fill="#E69F00" />
        </marker>

        {/* Movement endpoints - hollow */}
        <marker
          id="circle-friendly"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
          overflow="visible"
        >
          {/* White outline circle (thicker - rendered first - behind) */}
          <circle
            cx="5"
            cy="5"
            r="4"
            fill="none"
            stroke="white"
            strokeWidth="4"
          />
          {/* Colored main circle (rendered second - on top) */}
          <circle
            cx="5"
            cy="5"
            r="4"
            fill="none"
            stroke="#0072B2"
            strokeWidth="2"
          />
        </marker>
        <marker
          id="diamond-enemy"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
          overflow="visible"
        >
          {/* White outline polygon (thicker - rendered first - behind) */}
          <polygon
            points="5,0 10,5 5,10 0,5"
            fill="none"
            stroke="white"
            strokeWidth="4"
          />
          {/* Colored main polygon (rendered second - on top) */}
          <polygon
            points="5,0 10,5 5,10 0,5"
            fill="none"
            stroke="#E69F00"
            strokeWidth="2"
          />
        </marker>
      </defs>

      {/* Render intent lines */}
      {intents
        .filter((intent) => intent.action.type !== "idle")
        .map((intent) => (
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
