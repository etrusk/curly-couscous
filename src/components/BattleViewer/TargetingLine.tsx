/**
 * TargetingLine - renders a single movement targeting line from source to target character.
 * Visual encoding: dotted gray line, low opacity, no endpoint markers.
 */

import type { Position } from "../../engine/types";
import { hexToPixel } from "../../engine/hex";
import styles from "./TargetingLine.module.css";

export interface TargetingLineProps {
  from: Position;
  to: Position;
  hexSize: number;
  offset?: { x: number; y: number };
}

export function TargetingLine({
  from,
  to,
  hexSize,
  offset = { x: 0, y: 0 },
}: TargetingLineProps) {
  // Calculate cell center positions with offset
  const fromPixel = hexToPixel(from, hexSize);
  const toPixel = hexToPixel(to, hexSize);
  const x1 = fromPixel.x + offset.x;
  const y1 = fromPixel.y + offset.y;
  const x2 = toPixel.x + offset.x;
  const y2 = toPixel.y + offset.y;

  return (
    <g className={styles.targetingLine} opacity="0.4">
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--contrast-line)"
        strokeWidth="2.5"
        strokeDasharray="1 3"
        strokeLinecap="round"
      />
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
