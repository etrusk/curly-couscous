/**
 * Cell component - represents a single cell in the battle grid.
 * Pure presentational component with accessibility support.
 */

import { useCallback } from "react";
import { Token } from "./Token";
import type { TokenData } from "../../stores/gameStore";
import styles from "./Cell.module.css";

export interface CellProps {
  x: number;
  y: number;
  character?: TokenData;
  onClick?: (x: number, y: number) => void;
  isClickable?: boolean;
  onTokenHover?: (id: string, rect: DOMRect) => void;
  onTokenLeave?: () => void;
  hoveredTokenId?: string;
}

export function Cell({
  x,
  y,
  character,
  onClick,
  isClickable,
  onTokenHover,
  onTokenLeave,
  hoveredTokenId,
}: CellProps) {
  const handleClick = useCallback(() => {
    onClick?.(x, y);
  }, [onClick, x, y]);

  const tooltipId =
    character && hoveredTokenId === character.id
      ? `tooltip-${character.id}`
      : undefined;

  return (
    <div
      className={`${styles.cell} ${isClickable ? styles.clickable : ""}`}
      role="gridcell"
      data-testid={`cell-${x}-${y}`}
      data-x={x}
      data-y={y}
      aria-label={`Cell at row ${y}, column ${x}`}
      onClick={handleClick}
    >
      {character && (
        <Token
          id={character.id}
          faction={character.faction}
          hp={character.hp}
          maxHp={character.maxHp}
          slotPosition={character.slotPosition}
          onMouseEnter={onTokenHover}
          onMouseLeave={onTokenLeave}
          tooltipId={tooltipId}
        />
      )}
    </div>
  );
}
