/**
 * IntentLine - renders a single intent line from source to target cell.
 * Visual encoding: solid/dashed lines, faction colors, endpoint markers.
 */

import type { Position, Faction } from "../../engine/types";
import styles from "./IntentLine.module.css";

export interface IntentLineProps {
  from: Position;
  to: Position;
  type: "attack" | "move";
  faction: Faction;
  ticksRemaining: number;
  cellSize: number;
}

export function IntentLine({
  from,
  to,
  type,
  faction,
  ticksRemaining,
  cellSize,
}: IntentLineProps) {
  // Calculate cell center positions
  const x1 = from.x * cellSize + cellSize / 2;
  const y1 = from.y * cellSize + cellSize / 2;
  const x2 = to.x * cellSize + cellSize / 2;
  const y2 = to.y * cellSize + cellSize / 2;

  // Determine line color based on faction (using CSS variables)
  const color =
    faction === "friendly" ? "var(--faction-friendly)" : "var(--faction-enemy)";
  const outlineColor = "var(--contrast-line)";

  // Determine stroke width based on ticks remaining
  // Confirmed (1 tick): 3px, Locked-in (2+ ticks): 4px
  const strokeWidth = ticksRemaining === 1 ? 3 : 4;

  // Outline stroke width is main + 2px
  const outlineStrokeWidth = strokeWidth + 2;

  // Determine if line is dashed (for movement)
  const strokeDasharray = type === "move" ? "8 4" : undefined;

  // Determine marker based on type and faction
  const markerEnd = getMarkerEnd(type, faction);

  // Apply pulsing animation for locked-in actions (2+ ticks)
  const className = ticksRemaining >= 2 ? styles.lockedIn : "";

  return (
    <g className={className}>
      {/* Outline line (white, thicker, no marker) - rendered first (behind) */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={outlineColor}
        strokeWidth={outlineStrokeWidth}
        strokeDasharray={strokeDasharray}
      />
      {/* Main line (colored, with marker) - rendered second (on top) */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        markerEnd={markerEnd}
      />
    </g>
  );
}

/**
 * Determine SVG marker reference based on action type and faction.
 */
function getMarkerEnd(type: "attack" | "move", faction: Faction): string {
  if (type === "attack") {
    return faction === "friendly"
      ? "url(#arrowhead-friendly)"
      : "url(#arrowhead-enemy)";
  } else {
    // Movement
    return faction === "friendly"
      ? "url(#circle-friendly)"
      : "url(#diamond-enemy)";
  }
}
