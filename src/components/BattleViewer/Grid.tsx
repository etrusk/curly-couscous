/**
 * Grid component - renders the hexagonal battle grid using SVG.
 * Generates Cell components for each hex position.
 */

import { useMemo } from "react";
import { Cell } from "./Cell";
import { Token } from "./Token";
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

  return (
    <svg
      className={styles.grid}
      role="grid"
      aria-label="Hex battle grid, 91 cells"
      viewBox={viewBox.viewBox}
      width={viewBox.width}
      height={viewBox.height}
    >
      {/* Pass 1: Hex polygons only (no tokens) */}
      {allHexes.map((hex) => {
        const key = positionKey(hex);
        const center = hexToPixel(hex, hexSize);
        const isClickable = clickableCells?.has(key) ?? false;

        return (
          <Cell
            key={key}
            q={hex.q}
            r={hex.r}
            centerX={center.x}
            centerY={center.y}
            hexSize={hexSize}
            onClick={onCellClick}
            isClickable={isClickable}
          />
        );
      })}
      {/* Pass 2: All tokens rendered after all hex polygons for correct z-order */}
      <g>
        {characters.map((char) => {
          const center = hexToPixel(char.position, hexSize);
          const tooltipId =
            hoveredTokenId === char.id ? `tooltip-${char.id}` : undefined;
          return (
            <Token
              key={char.id}
              id={char.id}
              faction={char.faction}
              hp={char.hp}
              maxHp={char.maxHp}
              slotPosition={char.slotPosition}
              cx={center.x}
              cy={center.y}
              onMouseEnter={onTokenHover}
              onMouseLeave={onTokenLeave}
              tooltipId={tooltipId}
            />
          );
        })}
      </g>
    </svg>
  );
}
