/**
 * Hook to transform damage events into display-ready data.
 * Groups by target, enriches with positions and factions.
 */

import {
  useGameStore,
  selectRecentDamageEvents,
  selectTokenData,
} from "../../../stores/gameStore";
import type { Position, Faction } from "../../../engine/types";

/**
 * Damage data grouped by target for display.
 * Matches architecture spec naming.
 */
export interface DamageNumberData {
  targetId: string;
  targetPosition: Position;
  damages: Array<{
    attackerId: string;
    attackerFaction: Faction;
    amount: number;
  }>;
  totalDamage: number;
}

/**
 * Hook to transform damage events into display-ready data.
 * Groups by target, enriches with positions and factions.
 */
export function useDamageNumbers(): DamageNumberData[] {
  const damageEvents = useGameStore(selectRecentDamageEvents);
  const tokenData = useGameStore(selectTokenData);

  // Build lookup maps
  const tokenMap = new Map(tokenData.map((t) => [t.id, t]));

  // Group by target
  const grouped = new Map<string, DamageNumberData>();

  for (const event of damageEvents) {
    const target = tokenMap.get(event.targetId);
    const source = tokenMap.get(event.sourceId);
    if (!target || !source) continue;

    if (!grouped.has(event.targetId)) {
      grouped.set(event.targetId, {
        targetId: event.targetId,
        targetPosition: target.position,
        damages: [],
        totalDamage: 0,
      });
    }

    const data = grouped.get(event.targetId)!;
    data.damages.push({
      attackerId: event.sourceId,
      attackerFaction: source.faction,
      amount: event.damage,
    });
    data.totalDamage += event.damage;
  }

  return Array.from(grouped.values());
}
