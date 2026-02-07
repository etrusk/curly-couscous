/**
 * TargetingLineOverlay - SVG overlay for rendering movement targeting lines.
 * Positioned absolutely over the battle grid.
 */

import { useGameStore, selectMovementTargetData } from "../../stores/gameStore";
import type { MovementTargetData } from "../../stores/gameStore-selectors";
import { positionsEqual } from "../../engine/types";
import { hexToPixel, computeHexViewBox } from "../../engine/hex";
import { TargetingLine } from "./TargetingLine";
import styles from "./TargetingLineOverlay.module.css";

export interface TargetingLineOverlayProps {
  hexSize: number;
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
  hexSize: number,
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

      // Calculate perpendicular direction using pixel-space vectors
      const fromPixel = hexToPixel(data.fromPosition, hexSize);
      const toPixel = hexToPixel(data.toPosition, hexSize);
      const dx = toPixel.x - fromPixel.x;
      const dy = toPixel.y - fromPixel.y;

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

export function TargetingLineOverlay({ hexSize }: TargetingLineOverlayProps) {
  // Subscribe to movement target data
  const targetData = useGameStore(selectMovementTargetData);

  // Detect bidirectional targeting and compute offsets
  const offsets = detectBidirectionalTargeting(targetData, hexSize);

  const { viewBox, width, height } = computeHexViewBox(hexSize);

  return (
    <svg
      className={styles.targetingOverlay}
      width={width}
      height={height}
      viewBox={viewBox}
    >
      {/* Render targeting lines */}
      {targetData.map((data) => (
        <TargetingLine
          key={data.fromId}
          from={data.fromPosition}
          to={data.toPosition}
          hexSize={hexSize}
          offset={offsets.get(data.fromId)}
        />
      ))}
    </svg>
  );
}
