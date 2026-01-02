/**
 * Grid component - renders the 12×12 battle grid using CSS Grid layout.
 * Generates Cell components for each position.
 */

import { Cell } from "./Cell";
import styles from "./Grid.module.css";

export interface GridProps {
  width: number;
  height: number;
}

export function Grid({ width, height }: GridProps) {
  // Generate cells in row-major order (y then x)
  const cells: JSX.Element[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells.push(<Cell key={`${x}-${y}`} x={x} y={y} />);
    }
  }

  return (
    <div
      className={styles.grid}
      role="grid"
      aria-label={`Battle grid, ${width} by ${height}`}
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
      }}
    >
      {cells}
    </div>
  );
}
