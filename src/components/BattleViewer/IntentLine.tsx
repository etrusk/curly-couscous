/**
 * IntentLine - renders a single intent line from source to target cell.
 * Visual encoding: solid/dashed lines, faction colors, endpoint markers.
 */

import type { Position, Faction } from "../../engine/types";
import { hexToPixel } from "../../engine/hex";

export interface IntentLineProps {
  from: Position;
  to: Position;
  type: "attack" | "move" | "heal";
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
  const fromPixel = hexToPixel(from, cellSize);
  const toPixel = hexToPixel(to, cellSize);
  const x1 = fromPixel.x + offset.x;
  const y1 = fromPixel.y + offset.y;
  const x2 = toPixel.x + offset.x;
  const y2 = toPixel.y + offset.y;

  // Determine line color based on action type (using CSS variables)
  const color = getActionColor(type);
  const outlineColor = "var(--contrast-line)";

  // Conditional stroke width: 4px for solid (immediate), 2px for dashed (future)
  const strokeWidth = ticksRemaining === 0 ? 4 : 2;

  // Outline stroke width is main + 1px
  const outlineStrokeWidth = strokeWidth + 1;

  // Timing-based dashing: dashed for ticksRemaining > 0, solid for ticksRemaining = 0
  const strokeDasharray = ticksRemaining > 0 ? "4 4" : undefined;

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
 * Determine CSS variable for intent line color based on action type.
 */
function getActionColor(type: "attack" | "move" | "heal"): string {
  switch (type) {
    case "attack":
      return "var(--action-attack)";
    case "heal":
      return "var(--action-heal)";
    case "move":
      return "var(--action-move)";
  }
}

/**
 * Determine SVG marker reference based on action type and faction.
 */
function getMarkerEnd(
  type: "attack" | "move" | "heal",
  faction: Faction,
): string {
  switch (type) {
    case "attack":
      return "url(#arrowhead-attack)";
    case "heal":
      return "url(#cross-heal)";
    case "move":
      return faction === "friendly"
        ? "url(#circle-friendly)"
        : "url(#diamond-enemy)";
  }
}
