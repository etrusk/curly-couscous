/**
 * Token component - Represents a character on the battle grid.
 * Uses SVG for faction-specific shapes (circle/diamond) with HP visualization.
 */

import type { Faction } from "../../engine/types";
import styles from "./Token.module.css";

export interface TokenProps {
  id: string;
  faction: Faction;
  hp: number;
  maxHp: number;
}

// Token size constants
const TOKEN_SIZE = 40;
const TOKEN_RADIUS = TOKEN_SIZE / 2;
const HP_BAR_WIDTH = TOKEN_SIZE;
const HP_BAR_HEIGHT = 4;
const HP_BAR_Y = TOKEN_SIZE + 2; // Below the token

// Okabe-Ito colorblind-safe palette
const COLORS = {
  friendly: "#0072B2", // Blue
  enemy: "#E69F00", // Orange
} as const;

/**
 * Token component renders character as faction-specific shape with HP bar.
 */
export function Token({ id, faction, hp, maxHp }: TokenProps) {
  const color = COLORS[faction];
  const hpPercent =
    maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;
  const hpBarFillWidth = (hpPercent / 100) * HP_BAR_WIDTH;

  // Capitalize faction for aria-label
  const factionLabel = faction.charAt(0).toUpperCase() + faction.slice(1);
  const ariaLabel = `${factionLabel} character, ${hp} of ${maxHp} HP`;

  return (
    <svg
      className={styles.token}
      width={TOKEN_SIZE}
      height={TOKEN_SIZE + HP_BAR_HEIGHT + 4}
      viewBox={`0 0 ${TOKEN_SIZE} ${TOKEN_SIZE + HP_BAR_HEIGHT + 4}`}
      data-testid={`token-${id}`}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Pattern definition for enemy diagonal stripes (colorblind support) */}
      {faction === "enemy" && (
        <defs>
          <pattern
            id="stripe-enemy"
            patternUnits="userSpaceOnUse"
            width="4"
            height="4"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="4" stroke={color} strokeWidth="2" />
          </pattern>
        </defs>
      )}

      {/* Character shape - Circle for friendly, Diamond for enemy */}
      {faction === "friendly" ? (
        <circle
          cx={TOKEN_RADIUS}
          cy={TOKEN_RADIUS}
          r={TOKEN_RADIUS - 2}
          fill={color}
          stroke="#000"
          strokeWidth="1.5"
          className={styles.shape}
        />
      ) : (
        <polygon
          points={`${TOKEN_RADIUS},2 ${TOKEN_SIZE - 2},${TOKEN_RADIUS} ${TOKEN_RADIUS},${TOKEN_SIZE - 2} 2,${TOKEN_RADIUS}`}
          fill={color}
          stroke="#000"
          strokeWidth="1.5"
          className={styles.shape}
        />
      )}

      {/* HP Bar Background */}
      <rect
        x="0"
        y={HP_BAR_Y}
        width={HP_BAR_WIDTH}
        height={HP_BAR_HEIGHT}
        fill="#333"
        stroke="#000"
        strokeWidth="0.5"
        className={styles.hpBarBackground}
      />

      {/* HP Bar Fill */}
      <rect
        x="0"
        y={HP_BAR_Y}
        width={hpBarFillWidth}
        height={HP_BAR_HEIGHT}
        fill={hp > maxHp * 0.3 ? "#4CAF50" : "#F44336"}
        className={styles.hpBarFill}
        data-testid={`health-bar-${id}`}
      />
    </svg>
  );
}
