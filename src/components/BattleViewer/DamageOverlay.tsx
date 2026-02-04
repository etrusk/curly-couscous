/**
 * DamageOverlay - SVG overlay for rendering damage numbers.
 * Positioned absolutely over the battle grid.
 */

import { useDamageNumbers } from "./hooks/useDamageNumbers";
import { DamageNumber } from "./DamageNumber";
import styles from "./DamageOverlay.module.css";
import { hexToPixel, computeHexViewBox } from "../../engine/hex";

export interface DamageOverlayProps {
  hexSize: number;
}

export function DamageOverlay({ hexSize }: DamageOverlayProps) {
  const damageData = useDamageNumbers();

  const { viewBox, width, height } = computeHexViewBox(hexSize);

  return (
    <svg
      className={styles.damageOverlay}
      width={width}
      height={height}
      viewBox={viewBox}
    >
      {damageData.map((data) => {
        // Calculate cell center position
        const pixel = hexToPixel(data.targetPosition, hexSize);
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
