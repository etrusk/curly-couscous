/**
 * Cell component - represents a single hex cell in the battle grid.
 * Pure presentational component with accessibility support.
 */

import { Token } from "./Token";
import { hexVertices } from "../../engine/hex";
import type { TokenData } from "../../stores/gameStore";
import styles from "./Cell.module.css";

export interface CellProps {
  q: number;
  r: number;
  centerX: number; // pre-computed pixel center X
  centerY: number; // pre-computed pixel center Y
  hexSize: number;
  character?: TokenData;
  onClick?: (q: number, r: number) => void;
  isClickable?: boolean;
  onTokenHover?: (id: string, rect: DOMRect) => void;
  onTokenLeave?: () => void;
  hoveredTokenId?: string;
}

export function Cell({
  q,
  r,
  centerX,
  centerY,
  hexSize,
  character,
  onClick,
  isClickable,
  onTokenHover,
  onTokenLeave,
  hoveredTokenId,
}: CellProps) {
  const handleClick = () => {
    onClick?.(q, r);
  };

  const tooltipId =
    character && hoveredTokenId === character.id
      ? `tooltip-${character.id}`
      : undefined;

  // Generate hex vertices for polygon rendering
  const vertices = hexVertices({ x: centerX, y: centerY }, hexSize);
  const pointsString = vertices.map((v) => `${v.x},${v.y}`).join(" ");

  return (
    <g
      data-testid={`cell-${q}-${r}`}
      role="gridcell"
      aria-label={`Hex cell at q ${q}, r ${r}`}
      onClick={handleClick}
      className={isClickable ? styles.clickable : ""}
      style={{ pointerEvents: "all" }}
    >
      <polygon
        points={pointsString}
        className={styles.hexagon}
        fill="var(--cell-bg)"
        stroke="var(--cell-border)"
        strokeWidth="1"
      />
      {isClickable && (
        <polygon
          points={pointsString}
          className={styles.clickableOverlay}
          fill="transparent"
          stroke="var(--accent)"
          strokeWidth="2"
          style={{ pointerEvents: "none" }}
        />
      )}
      {character && (
        <Token
          id={character.id}
          faction={character.faction}
          hp={character.hp}
          maxHp={character.maxHp}
          slotPosition={character.slotPosition}
          cx={centerX}
          cy={centerY}
          onMouseEnter={onTokenHover}
          onMouseLeave={onTokenLeave}
          tooltipId={tooltipId}
        />
      )}
    </g>
  );
}
