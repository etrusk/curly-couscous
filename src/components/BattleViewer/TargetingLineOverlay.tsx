/**
 * TargetingLineOverlay - SVG overlay for rendering movement targeting lines.
 * Positioned absolutely over the battle grid.
 */

import { useGameStore, selectMovementTargetData } from "../../stores/gameStore";
import { useAccessibilityStore } from "../../stores/accessibilityStore";
import type { MovementTargetData } from "../../stores/gameStore-selectors";
import { positionsEqual } from "../../engine/types";
import { TargetingLine } from "./TargetingLine";
import styles from "./TargetingLineOverlay.module.css";

export interface TargetingLineOverlayProps {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
}

/**
 * Detect bidirectional targeting pairs and compute perpendicular offsets.
 * Returns a Map of characterId -> offset {x, y}.
 *
 * For bidirectional pairs (A targets B, B targets A):
 * - Alphabetically lower ID gets negative offset (-4px perpendicular)
 * - Alphabetically higher ID gets positive offset (+4px perpendicular)
 */
function detectBidirectionalTargeting(
  targetData: MovementTargetData[],
): Map<string, { x: number; y: number }> {
  const offsets = new Map<string, { x: number; y: number }>();
  const processed = new Set<string>();

  for (const data of targetData) {
    if (processed.has(data.fromId)) continue;

    // Find if there's targeting going the opposite direction
    const reverseTarget = targetData.find(
      (other) =>
        other.fromId !== data.fromId &&
        other.fromId === data.toId &&
        other.toId === data.fromId &&
        positionsEqual(other.fromPosition, data.toPosition) &&
        positionsEqual(other.toPosition, data.fromPosition),
    );

    if (reverseTarget) {
      // Mark both as processed to avoid double-processing
      processed.add(data.fromId);
      processed.add(reverseTarget.fromId);

      // Calculate perpendicular direction using the first character's line direction
      // Direction vector: (dx, dy) = (toX - fromX, toY - fromY)
      const dx = data.toPosition.x - data.fromPosition.x;
      const dy = data.toPosition.y - data.fromPosition.y;

      // Perpendicular vector: (-dy, dx)
      // Normalize and scale by 4px
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length === 0) continue; // Skip if same position (shouldn't happen)

      const perpX = (-dy / length) * 4;
      const perpY = (dx / length) * 4;

      // Assign offset based on character ID ordering
      // Alphabetically lower ID gets negative offset, higher gets positive
      const isFirstLower = data.fromId < reverseTarget.fromId;

      offsets.set(data.fromId, {
        x: isFirstLower ? -perpX : perpX,
        y: isFirstLower ? -perpY : perpY,
      });

      offsets.set(reverseTarget.fromId, {
        x: isFirstLower ? perpX : -perpX,
        y: isFirstLower ? perpY : -perpY,
      });
    }
  }

  return offsets;
}

export function TargetingLineOverlay({
  gridWidth,
  gridHeight,
  cellSize,
}: TargetingLineOverlayProps) {
  // Subscribe to toggle state
  const showTargetLines = useAccessibilityStore((s) => s.showTargetLines);

  // Subscribe to movement target data
  const targetData = useGameStore(selectMovementTargetData);

  // Early return if toggle is off (after all hooks)
  if (!showTargetLines) {
    return null;
  }

  // Detect bidirectional targeting and compute offsets
  const offsets = detectBidirectionalTargeting(targetData);

  const svgWidth = gridWidth * cellSize;
  const svgHeight = gridHeight * cellSize;

  return (
    <svg
      className={styles.targetingOverlay}
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
    >
      {/* Render targeting lines */}
      {targetData.map((data) => (
        <TargetingLine
          key={data.fromId}
          from={data.fromPosition}
          to={data.toPosition}
          cellSize={cellSize}
          offset={offsets.get(data.fromId)}
        />
      ))}
    </svg>
  );
}
