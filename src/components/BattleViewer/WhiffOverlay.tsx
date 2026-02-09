/**
 * WhiffOverlay - SVG overlay for rendering whiff indicators.
 * Shows faded hex polygons on cells where attacks/heals missed.
 * Positioned absolutely over the battle grid.
 */

import { useWhiffIndicators } from "./hooks/useWhiffIndicators";
import { hexToPixel, hexVertices, computeHexViewBox } from "../../engine/hex";
import styles from "./WhiffOverlay.module.css";

export interface WhiffOverlayProps {
  hexSize: number;
}

export function WhiffOverlay({ hexSize }: WhiffOverlayProps) {
  const whiffData = useWhiffIndicators();
  const { viewBox, width, height } = computeHexViewBox(hexSize);

  return (
    <svg
      className={styles.whiffOverlay}
      width={width}
      height={height}
      viewBox={viewBox}
    >
      {whiffData.map((data) => {
        const pixel = hexToPixel(data.position, hexSize);
        const vertices = hexVertices(pixel, hexSize);
        const points = vertices.map((v) => `${v.x},${v.y}`).join(" ");
        const fillColor =
          data.actionType === "attack"
            ? "var(--action-attack)"
            : "var(--action-heal)";

        return (
          <polygon
            key={data.cellKey}
            points={points}
            fill={`color-mix(in srgb, ${fillColor} 20%, transparent)`}
          />
        );
      })}
    </svg>
  );
}
