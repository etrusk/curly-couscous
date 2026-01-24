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
}

export function Cell({ x, y, character, onClick, isClickable }: CellProps) {
  const handleClick = useCallback(() => {
    onClick?.(x, y);
  }, [onClick, x, y]);

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
        />
      )}
    </div>
  );
}
