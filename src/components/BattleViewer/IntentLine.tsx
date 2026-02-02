/**
 * IntentLine - renders a single intent line from source to target cell.
 * Visual encoding: solid/dashed lines, faction colors, endpoint markers.
 */

import type { Position, Faction } from "../../engine/types";

export interface IntentLineProps {
  from: Position;
  to: Position;
  type: "attack" | "move";
  faction: Faction;
  ticksRemaining: number;
  cellSize: number;
  offset?: { x: number; y: number };
}

export function IntentLine({
  from,
  to,
  type,
  faction,
  ticksRemaining,
  cellSize,
  offset = { x: 0, y: 0 },
}: IntentLineProps) {
  // Calculate cell center positions with offset
  const x1 = from.x * cellSize + cellSize / 2 + offset.x;
  const y1 = from.y * cellSize + cellSize / 2 + offset.y;
  const x2 = to.x * cellSize + cellSize / 2 + offset.x;
  const y2 = to.y * cellSize + cellSize / 2 + offset.y;

  // Determine line color based on faction (using CSS variables)
  const color =
    faction === "friendly" ? "var(--faction-friendly)" : "var(--faction-enemy)";
  const outlineColor = "var(--contrast-line)";

  // Conditional stroke width: 4px for solid (immediate), 2px for dashed (future)
  const strokeWidth = ticksRemaining === 0 ? 4 : 2;

  // Outline stroke width is main + 1px
  const outlineStrokeWidth = strokeWidth + 1;

  // Timing-based dashing: dashed for ticksRemaining > 0, solid for ticksRemaining = 0
  const strokeDasharray = ticksRemaining > 0 ? "4 2" : undefined;

  // Determine marker based on type and faction
  const markerEnd = getMarkerEnd(type, faction);

  return (
    <g>
      {/* Outline line (white, thicker, no marker) - rendered first (behind) */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={outlineColor}
        strokeWidth={outlineStrokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
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
        strokeLinecap="round"
      />
      {/* Numeric label for wind-up actions (ticksRemaining > 0) */}
      {ticksRemaining > 0 && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          stroke={outlineColor}
          strokeWidth="3"
          paintOrder="stroke"
          fontSize="12"
          fontWeight="bold"
        >
          {ticksRemaining}
        </text>
      )}
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
