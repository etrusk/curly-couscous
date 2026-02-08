/**
 * IntentOverlay - SVG overlay for rendering intent lines.
 * Positioned absolutely over the battle grid.
 */

import {
  useGameStore,
  selectIntentData,
  selectCharacters,
} from "../../stores/gameStore";
import type { IntentData } from "../../stores/gameStore-selectors";
import { positionsEqual } from "../../engine/types";
import { hexToPixel, computeHexViewBox } from "../../engine/hex";
import { IntentLine } from "./IntentLine";
import styles from "./IntentOverlay.module.css";

export interface IntentOverlayProps {
  hexSize: number;
}

/**
 * Detect bidirectional attack pairs and compute perpendicular offsets.
 * Returns a Map of characterId -> offset {x, y}.
 *
 * For bidirectional pairs (A attacks B, B attacks A):
 * - Alphabetically lower ID gets negative offset (-4px perpendicular)
 * - Alphabetically higher ID gets positive offset (+4px perpendicular)
 */
function detectBidirectionalAttacks(
  intents: IntentData[],
  hexSize: number,
): Map<string, { x: number; y: number }> {
  const offsets = new Map<string, { x: number; y: number }>();
  const processed = new Set<string>();

  for (const intent of intents) {
    if (intent.action.type !== "attack" && intent.action.type !== "charge")
      continue;
    if (processed.has(intent.characterId)) continue;

    // Find if there's an attack or charge going the opposite direction
    const reverseIntent = intents.find(
      (other) =>
        other.characterId !== intent.characterId &&
        (other.action.type === "attack" || other.action.type === "charge") &&
        positionsEqual(other.characterPosition, intent.action.targetCell) &&
        positionsEqual(other.action.targetCell, intent.characterPosition),
    );

    if (reverseIntent) {
      // Mark both as processed to avoid double-processing
      processed.add(intent.characterId);
      processed.add(reverseIntent.characterId);

      // Calculate perpendicular direction using pixel-space vectors
      const fromPixel = hexToPixel(intent.characterPosition, hexSize);
      const toPixel = hexToPixel(intent.action.targetCell, hexSize);
      const dx = toPixel.x - fromPixel.x;
      const dy = toPixel.y - fromPixel.y;

      // Perpendicular vector: (-dy, dx)
      // Normalize and scale by 4px
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length === 0) continue; // Skip if same cell (shouldn't happen)

      const perpX = (-dy / length) * 4;
      const perpY = (dx / length) * 4;

      // Assign offset based on character ID ordering
      // Alphabetically lower ID gets negative offset, higher gets positive
      const isFirstLower = intent.characterId < reverseIntent.characterId;

      offsets.set(intent.characterId, {
        x: isFirstLower ? -perpX : perpX,
        y: isFirstLower ? -perpY : perpY,
      });

      offsets.set(reverseIntent.characterId, {
        x: isFirstLower ? perpX : -perpX,
        y: isFirstLower ? perpY : -perpY,
      });
    }
  }

  return offsets;
}

export function IntentOverlay({ hexSize }: IntentOverlayProps) {
  // Subscribe to characters to force re-render when characters change
  // This fixes a Zustand subscription issue where selectIntentData doesn't
  // properly detect character additions via the addCharacter action.
  const characters = useGameStore(selectCharacters);

  // Subscribe to intent data for line rendering
  const intents = useGameStore(selectIntentData);

  // Ensure characters subscription is not optimized away
  void characters.length;

  // Detect bidirectional attacks and compute offsets
  const offsets = detectBidirectionalAttacks(intents, hexSize);

  const { viewBox, width, height } = computeHexViewBox(hexSize);

  return (
    <svg
      className={styles.intentOverlay}
      width={width}
      height={height}
      viewBox={viewBox}
    >
      {/* SVG marker definitions */}
      <defs>
        {/* Attack arrowhead - action-colored */}
        <marker
          id="arrowhead-attack"
          markerWidth="12"
          markerHeight="8"
          refX="9"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
          overflow="visible"
        >
          {/* White outline polygon (rendered first - behind) */}
          <polygon
            points="0,0 10,4 0,8"
            fill="var(--contrast-line)"
            stroke="var(--contrast-line)"
          />
          {/* Colored main polygon (rendered second - on top) */}
          <polygon points="0,0 10,4 0,8" fill="var(--action-attack)" />
        </marker>

        {/* Heal cross marker - action-colored */}
        <marker
          id="cross-heal"
          markerWidth="12"
          markerHeight="12"
          refX="6"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
          overflow="visible"
        >
          {/* White outline cross (thicker - rendered first - behind) */}
          <path
            d="M6,2 V10 M2,6 H10"
            fill="none"
            stroke="var(--contrast-line)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Colored main cross (rendered second - on top) */}
          <path
            d="M6,2 V10 M2,6 H10"
            fill="none"
            stroke="var(--action-heal)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </marker>

        {/* Movement endpoints - hollow, faction-shaped */}
        <marker
          id="circle-friendly"
          markerWidth="12"
          markerHeight="12"
          refX="6"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
          overflow="visible"
        >
          {/* White outline circle (thicker - rendered first - behind) */}
          <circle
            cx="6"
            cy="6"
            r="4"
            fill="none"
            stroke="var(--contrast-line)"
            strokeWidth="3"
          />
          {/* Colored main circle (rendered second - on top) */}
          <circle
            cx="6"
            cy="6"
            r="4"
            fill="none"
            stroke="var(--action-move)"
            strokeWidth="1.5"
          />
        </marker>
        <marker
          id="diamond-enemy"
          markerWidth="12"
          markerHeight="12"
          refX="6"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
          overflow="visible"
        >
          {/* White outline polygon (thicker - rendered first - behind) */}
          <polygon
            points="6,0 12,6 6,12 0,6"
            fill="none"
            stroke="var(--contrast-line)"
            strokeWidth="3"
          />
          {/* Colored main polygon (rendered second - on top) */}
          <polygon
            points="6,0 12,6 6,12 0,6"
            fill="none"
            stroke="var(--action-move)"
            strokeWidth="1.5"
          />
        </marker>
      </defs>

      {/* Render intent lines */}
      {intents.map((intent) => (
        <IntentLine
          key={intent.characterId}
          from={intent.characterPosition}
          to={intent.action.targetCell}
          type={
            intent.action.type as
              | "attack"
              | "move"
              | "heal"
              | "interrupt"
              | "charge"
          }
          faction={intent.faction}
          ticksRemaining={intent.ticksRemaining}
          hexSize={hexSize}
          offset={offsets.get(intent.characterId)}
        />
      ))}
    </svg>
  );
}
