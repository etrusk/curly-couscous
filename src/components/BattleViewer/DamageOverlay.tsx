/**
 * DamageOverlay - SVG overlay for rendering damage numbers.
 * Positioned absolutely over the battle grid.
 */

import { useDamageNumbers } from "./hooks/useDamageNumbers";
import { DamageNumber } from "./DamageNumber";
import styles from "./DamageOverlay.module.css";
import { hexToPixel } from "../../engine/hex";

export interface DamageOverlayProps {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
}

export function DamageOverlay({
  gridWidth,
  gridHeight,
  cellSize,
}: DamageOverlayProps) {
  const damageData = useDamageNumbers();

  const svgWidth = gridWidth * cellSize;
  const svgHeight = gridHeight * cellSize;

  return (
    <svg
      className={styles.damageOverlay}
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
    >
      {damageData.map((data) => {
        // Calculate cell center position
        const pixel = hexToPixel(data.targetPosition, cellSize);
        const centerX = pixel.x;
        const centerY = pixel.y;

        return (
          <g key={data.targetId}>
            {data.damages.map((damage, index) => (
              <DamageNumber
                key={`${data.targetId}-${damage.attackerId}`}
                amount={damage.amount}
                attackerFaction={damage.attackerFaction}
                x={centerX}
                y={centerY}
                offsetIndex={index}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
