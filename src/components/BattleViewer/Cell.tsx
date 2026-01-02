/**
 * Cell component - represents a single cell in the battle grid.
 * Pure presentational component with accessibility support.
 */

import { Token } from "./Token";
import type { TokenData } from "../../stores/gameStore";
import styles from "./Cell.module.css";

export interface CellProps {
  x: number;
  y: number;
  character?: TokenData;
}

export function Cell({ x, y, character }: CellProps) {
  return (
    <div
      className={styles.cell}
      role="gridcell"
      data-testid={`cell-${x}-${y}`}
      data-x={x}
      data-y={y}
      aria-label={`Cell at row ${y}, column ${x}`}
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
