/**
 * Hook to transform whiff events into display-ready indicator data.
 * Deduplicates by cell -- last event wins for actionType.
 */

import { useMemo } from "react";
import {
  useGameStore,
  selectRecentWhiffEvents,
} from "../../../stores/gameStore";
import type { Position } from "../../../engine/types";
import { positionKey } from "../../../engine/hex";

/**
 * Display data for a whiff indicator on a hex cell.
 */
export interface WhiffIndicatorData {
  cellKey: string;
  position: Position;
  actionType: "attack" | "heal";
}

/**
 * Hook to transform whiff events into display-ready data.
 * Deduplicates multiple whiffs on the same cell (last event wins).
 */
export function useWhiffIndicators(): WhiffIndicatorData[] {
  const whiffEvents = useGameStore(selectRecentWhiffEvents);

  return useMemo(() => {
    const cellMap = new Map<string, WhiffIndicatorData>();
    for (const event of whiffEvents) {
      const key = positionKey(event.targetCell);
      cellMap.set(key, {
        cellKey: key,
        position: event.targetCell,
        actionType: event.actionType,
      });
    }
    return Array.from(cellMap.values());
  }, [whiffEvents]);
}
