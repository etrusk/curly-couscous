/**
 * Grid component - renders the 12×12 battle grid using CSS Grid layout.
 * Generates Cell components for each position.
 */

import { Cell } from "./Cell";
import type { TokenData } from "../../stores/gameStore";
import styles from "./Grid.module.css";

export interface GridProps {
  width: number;
  height: number;
  characters?: TokenData[];
  onCellClick?: (x: number, y: number) => void;
  clickableCells?: Set<string>;
  onTokenHover?: (id: string, rect: DOMRect) => void;
  onTokenLeave?: () => void;
  hoveredTokenId?: string;
}

export function Grid({
  width,
  height,
  characters = [],
  onCellClick,
  clickableCells,
  onTokenHover,
  onTokenLeave,
  hoveredTokenId,
}: GridProps) {
  // Create a map of position -> character for O(1) lookup
  const characterMap = new Map<string, TokenData>();
  for (const char of characters) {
    const key = `${char.position.q}-${char.position.r}`;
    characterMap.set(key, char);
  }

  // Generate cells in row-major order (y then x)
  const cells: JSX.Element[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x}-${y}`;
      const character = characterMap.get(key);
      const isClickable = clickableCells?.has(key) ?? false;
      cells.push(
        <Cell
          key={key}
          x={x}
          y={y}
          character={character}
          onClick={onCellClick}
          isClickable={isClickable}
          onTokenHover={onTokenHover}
          onTokenLeave={onTokenLeave}
          hoveredTokenId={hoveredTokenId}
        />,
      );
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
