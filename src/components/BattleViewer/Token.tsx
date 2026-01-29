/**
 * Token component - Represents a character on the battle grid.
 * Uses SVG for faction-specific shapes (circle/diamond) with HP visualization.
 */

import { useMemo } from "react";
import type { Faction } from "../../engine/types";
import {
  useGameStore,
  selectSelectedCharacterId,
  selectActions,
} from "../../stores/gameStore";
import { slotPositionToLetter } from "../../utils/letterMapping";
import styles from "./Token.module.css";

export interface TokenProps {
  /** Unique identifier for the character */
  id: string;
  /** Faction determines shape and color (friendly/enemy) */
  faction: Faction;
  /** Current hit points (can be zero or negative) */
  hp: number;
  /** Maximum hit points (must be positive) */
  maxHp: number;
  /** Slot position (1-based) used for letter mapping (A, B, C, ...) */
  slotPosition: number;
  /** Callback when mouse enters token */
  onMouseEnter?: (id: string, rect: DOMRect) => void;
  /** Callback when mouse leaves token */
  onMouseLeave?: () => void;
  /** Tooltip ID for aria-describedby when tooltip visible */
  tooltipId?: string;
}

// Token size constants
const TOKEN_SIZE = 40;
const TOKEN_RADIUS = TOKEN_SIZE / 2;
const HP_BAR_WIDTH = TOKEN_SIZE;
const HP_BAR_HEIGHT = 4;
const HP_BAR_Y = TOKEN_SIZE + 2; // Below the token

/**
 * Token component renders character as faction-specific shape with HP bar.
 */
export function Token({
  id,
  faction,
  hp,
  maxHp,
  slotPosition,
  onMouseEnter,
  onMouseLeave,
  tooltipId,
}: TokenProps) {
  // Selection state and actions
  const selectedCharacterId = useGameStore(selectSelectedCharacterId);
  const { selectCharacter } = useGameStore(selectActions);
  const isSelected = selectedCharacterId === id;

  // Click handler for selection
  const handleClick = () => {
    if (isSelected) {
      // Toggle off if already selected
      selectCharacter(null);
    } else {
      // Select this character
      selectCharacter(id);
    }
  };

  // Keyboard handler for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick();
      e.preventDefault();
    }
  };

  // Hover handlers for tooltip
  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onMouseEnter?.(id, rect);
  };

  const handleMouseLeaveLocal = () => {
    onMouseLeave?.();
  };

  // Use CSS variables for faction colors (theme-aware)
  const factionColorVar =
    faction === "friendly" ? "var(--faction-friendly)" : "var(--faction-enemy)";
  const strokeColor = "var(--contrast-line)";
  const hpBarBgColor = "var(--surface-secondary)";
  const hpBarFillColor =
    hp > maxHp * 0.3 ? "var(--health-high)" : "var(--health-low)";
  // Calculate HP bar width with clamping to handle edge cases (negative hp, hp > maxHp, zero maxHp)
  const hpBarFillWidth =
    maxHp > 0
      ? Math.max(0, Math.min(HP_BAR_WIDTH, (hp / maxHp) * HP_BAR_WIDTH))
      : 0;

  // Get letter for slot position (memoized to avoid recomputation on re-renders)
  const letter = useMemo(
    () => slotPositionToLetter(slotPosition),
    [slotPosition],
  );

  // Capitalize faction for aria-label
  const factionLabel = faction.charAt(0).toUpperCase() + faction.slice(1);
  const ariaLabel = `${factionLabel} character ${letter}, ${hp} of ${maxHp} HP`;

  // Apply selected class when this token is selected
  const className = isSelected
    ? `${styles.token} ${styles.selected}`
    : styles.token;

  return (
    <svg
      className={className}
      width={TOKEN_SIZE}
      height={TOKEN_SIZE + HP_BAR_HEIGHT + 4}
      viewBox={`0 0 ${TOKEN_SIZE} ${TOKEN_SIZE + HP_BAR_HEIGHT + 4}`}
      data-testid={`token-${id}`}
      role="img"
      aria-label={ariaLabel}
      aria-describedby={tooltipId}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeaveLocal}
      tabIndex={0}
    >
      {/* Pattern definition for enemy diagonal stripes (colorblind support) */}
      {/* Unique pattern ID per character to avoid DOM collisions */}
      {faction === "enemy" && (
        <defs>
          <pattern
            id={`stripe-enemy-${id}`}
            patternUnits="userSpaceOnUse"
            width="4"
            height="4"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="4"
              stroke={factionColorVar}
              strokeWidth="2"
            />
          </pattern>
        </defs>
      )}

      {/* Character shape - Circle for friendly, Diamond for enemy */}
      {faction === "friendly" ? (
        <circle
          cx={TOKEN_RADIUS}
          cy={TOKEN_RADIUS}
          r={TOKEN_RADIUS - 2}
          fill={factionColorVar}
          stroke={strokeColor}
          strokeWidth="1.5"
          className={styles.shape}
        />
      ) : (
        <polygon
          points={`${TOKEN_RADIUS},2 ${TOKEN_SIZE - 2},${TOKEN_RADIUS} ${TOKEN_RADIUS},${TOKEN_SIZE - 2} 2,${TOKEN_RADIUS}`}
          fill={`url(#stripe-enemy-${id})`}
          stroke={strokeColor}
          strokeWidth="1.5"
          className={styles.shape}
        />
      )}

      {/* Letter label */}
      <text
        x={TOKEN_RADIUS}
        y={TOKEN_RADIUS}
        textAnchor="middle"
        dominantBaseline="central"
        className={styles.letter}
        fill="var(--text-on-faction)"
        fontSize="16"
        fontWeight="bold"
      >
        {letter}
      </text>

      {/* HP Bar Background */}
      <rect
        x="0"
        y={HP_BAR_Y}
        width={HP_BAR_WIDTH}
        height={HP_BAR_HEIGHT}
        fill={hpBarBgColor}
        stroke={strokeColor}
        strokeWidth="0.5"
        className={styles.hpBarBackground}
      />

      {/* HP Bar Fill */}
      <rect
        x="0"
        y={HP_BAR_Y}
        width={hpBarFillWidth}
        height={HP_BAR_HEIGHT}
        fill={hpBarFillColor}
        className={styles.hpBarFill}
        data-testid={`health-bar-${id}`}
      />
    </svg>
  );
}
