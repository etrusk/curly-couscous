/**
 * TargetingLine - renders a single movement targeting line from source to target character.
 * Visual encoding: dotted gray line, low opacity, no endpoint markers.
 */

import type { Position } from "../../engine/types";
import styles from "./TargetingLine.module.css";

export interface TargetingLineProps {
  from: Position;
  to: Position;
  cellSize: number;
  offset?: { x: number; y: number };
}

export function TargetingLine({
  from,
  to,
  cellSize,
  offset = { x: 0, y: 0 },
}: TargetingLineProps) {
  // Calculate cell center positions with offset
  const x1 = from.x * cellSize + cellSize / 2 + offset.x;
  const y1 = from.y * cellSize + cellSize / 2 + offset.y;
  const x2 = to.x * cellSize + cellSize / 2 + offset.x;
  const y2 = to.y * cellSize + cellSize / 2 + offset.y;

  return (
    <g className={styles.targetingLine} opacity="0.4">
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--targeting-line-color)"
        strokeWidth="1.5"
        strokeDasharray="1 3"
        strokeLinecap="round"
      />
    </g>
  );
}
