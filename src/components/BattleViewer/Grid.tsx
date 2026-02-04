/**
 * Grid component - renders the hexagonal battle grid using SVG.
 * Generates Cell components for each hex position.
 */

import { useMemo } from "react";
import { Cell } from "./Cell";
import {
  generateAllHexes,
  hexToPixel,
  positionKey,
  computeHexViewBox,
} from "../../engine/hex";
import type { TokenData } from "../../stores/gameStore";
import styles from "./Grid.module.css";

export interface GridProps {
  hexSize?: number;
  characters?: TokenData[];
  onCellClick?: (q: number, r: number) => void;
  clickableCells?: Set<string>;
  onTokenHover?: (id: string, rect: DOMRect) => void;
  onTokenLeave?: () => void;
  hoveredTokenId?: string;
}

export function Grid({
  hexSize = 30,
  characters = [],
  onCellClick,
  clickableCells,
  onTokenHover,
  onTokenLeave,
  hoveredTokenId,
}: GridProps) {
  // Compute viewBox for SVG (memoized)
  const viewBox = useMemo(() => computeHexViewBox(hexSize), [hexSize]);

  // Generate all hex coordinates (memoized)
  const allHexes = useMemo(() => generateAllHexes(), []);

  // Create a map of position -> character for O(1) lookup
  const characterMap = useMemo(() => {
    const map = new Map<string, TokenData>();
    for (const char of characters) {
      const key = positionKey(char.position);
      map.set(key, char);
    }
    return map;
  }, [characters]);

  return (
    <svg
      className={styles.grid}
      role="grid"
      aria-label="Hex battle grid, 91 cells"
      viewBox={viewBox.viewBox}
      width={viewBox.width}
      height={viewBox.height}
    >
      {allHexes.map((hex) => {
        const key = positionKey(hex);
        const center = hexToPixel(hex, hexSize);
        const character = characterMap.get(key);
        const isClickable = clickableCells?.has(key) ?? false;

        return (
          <Cell
            key={key}
            q={hex.q}
            r={hex.r}
            centerX={center.x}
            centerY={center.y}
            hexSize={hexSize}
            character={character}
            onClick={onCellClick}
            isClickable={isClickable}
            onTokenHover={onTokenHover}
            onTokenLeave={onTokenLeave}
            hoveredTokenId={hoveredTokenId}
          />
        );
      })}
    </svg>
  );
}
