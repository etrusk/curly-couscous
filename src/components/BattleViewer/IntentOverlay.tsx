/**
 * IntentOverlay - SVG overlay for rendering intent lines.
 * Positioned absolutely over the battle grid.
 */

import { useGameStore, selectIntentData } from "../../stores/gameStore";
import type { IntentData } from "../../stores/gameStore-selectors";
import type { Position } from "../../engine/types";
import { IntentLine } from "./IntentLine";
import styles from "./IntentOverlay.module.css";

export interface IntentOverlayProps {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
}

/**
 * Check if two positions are equal.
 */
function posEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Detect bidirectional attack pairs and compute perpendicular offsets.
 * Returns a Map of characterId -> offset {x, y}.
 *
 * For bidirectional pairs (A attacks B, B attacks A):
 * - Alphabetically lower ID gets negative offset (-4px perpendicular)
 * - Alphabetically higher ID gets positive offset (+4px perpendicular)
 */
function detectBidirectionalAttacks(
  intents: IntentData[],
): Map<string, { x: number; y: number }> {
  const offsets = new Map<string, { x: number; y: number }>();
  const processed = new Set<string>();

  for (const intent of intents) {
    if (intent.action.type !== "attack") continue;
    if (processed.has(intent.characterId)) continue;

    // Find if there's an attack going the opposite direction
    const reverseIntent = intents.find(
      (other) =>
        other.characterId !== intent.characterId &&
        other.action.type === "attack" &&
        posEqual(other.characterPosition, intent.action.targetCell) &&
        posEqual(other.action.targetCell, intent.characterPosition),
    );

    if (reverseIntent) {
      // Mark both as processed to avoid double-processing
      processed.add(intent.characterId);
      processed.add(reverseIntent.characterId);

      // Calculate perpendicular direction using the first character's line direction
      // Direction vector: (dx, dy) = (targetX - fromX, targetY - fromY)
      const dx = intent.action.targetCell.x - intent.characterPosition.x;
      const dy = intent.action.targetCell.y - intent.characterPosition.y;

      // Perpendicular vector: (-dy, dx)
      // Normalize and scale by 4px
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length === 0) continue; // Skip if same cell (shouldn't happen)

      const perpX = (-dy / length) * 4;
      const perpY = (dx / length) * 4;

      // Assign offset based on character ID ordering
      // Alphabetically lower ID gets negative offset, higher gets positive
      const isFirstLower = intent.characterId < reverseIntent.characterId;

      offsets.set(intent.characterId, {
        x: isFirstLower ? -perpX : perpX,
        y: isFirstLower ? -perpY : perpY,
      });

      offsets.set(reverseIntent.characterId, {
        x: isFirstLower ? perpX : -perpX,
        y: isFirstLower ? perpY : -perpY,
      });
    }
  }

  return offsets;
}

export function IntentOverlay({
  gridWidth,
  gridHeight,
  cellSize,
}: IntentOverlayProps) {
  // Subscribe to intent data for line rendering
  const intents = useGameStore(selectIntentData);

  // Detect bidirectional attacks and compute offsets
  const offsets = detectBidirectionalAttacks(intents);

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
          offset={offsets.get(intent.characterId)}
        />
      ))}
    </svg>
  );
}
