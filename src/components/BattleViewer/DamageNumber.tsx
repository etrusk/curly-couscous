/**
 * DamageNumber - SVG text element for displaying damage at a specific position.
 * Renders with faction-colored border and vertical offset for stacking.
 */

import type { Faction } from "../../engine/types";
import styles from "./DamageNumber.module.css";

export interface DamageNumberProps {
  amount: number;
  attackerFaction: Faction;
  x: number;
  y: number;
  offsetIndex: number; // For stacking multiple damages
}

export function DamageNumber({
  amount,
  attackerFaction,
  x,
  y,
  offsetIndex,
}: DamageNumberProps) {
  const color =
    attackerFaction === "friendly"
      ? "var(--faction-friendly)"
      : "var(--faction-enemy)";
  const bgColor = "var(--surface-elevated)";
  const offsetY = offsetIndex * 20; // 20px vertical offset per damage

  return (
    <g>
      {/* Background rectangle */}
      <rect
        x={x - 20}
        y={y + offsetY - 10}
        width="40"
        height="20"
        fill={bgColor}
        stroke={color}
        strokeWidth="2"
        rx="3"
        className={styles.damageRect}
      />
      {/* Damage text */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className={styles.damageText}
        dy={offsetIndex === 0 ? undefined : String(offsetY)}
      >
        -{amount}
      </text>
    </g>
  );
}
