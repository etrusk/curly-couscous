/**
 * Cell component - represents a single cell in the battle grid.
 * Pure presentational component with accessibility support.
 */

import styles from "./Cell.module.css";

export interface CellProps {
  x: number;
  y: number;
}

export function Cell({ x, y }: CellProps) {
  return (
    <div
      className={styles.cell}
      role="gridcell"
      data-testid={`cell-${x}-${y}`}
      data-x={x}
      data-y={y}
      aria-label={`Cell at row ${y}, column ${x}`}
    />
  );
}
