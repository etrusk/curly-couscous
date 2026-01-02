/**
 * EventLogEntry component displays a single formatted event.
 * Handles faction-based color coding and character name lookups.
 */

import type {
  Character,
  DamageEvent,
  MovementEvent,
  DeathEvent,
} from "../../engine/types";
import styles from "./EventLog.module.css";

interface EventLogEntryProps {
  event: DamageEvent | MovementEvent | DeathEvent;
  characters: Character[];
  index: number;
}

/**
 * Helper to get character name by ID, fallback to ID if not found
 */
function getCharacterName(
  characterId: string,
  characters: Character[],
): string {
  const character = characters.find((c) => c.id === characterId);
  return character?.name || characterId;
}

/**
 * Helper to get character faction by ID
 */
function getCharacterFaction(
  characterId: string,
  characters: Character[],
): "friendly" | "enemy" | null {
  const character = characters.find((c) => c.id === characterId);
  return character?.faction || null;
}

/**
 * Format event as readable sentence
 */
function formatEvent(
  event: DamageEvent | MovementEvent | DeathEvent,
  characters: Character[],
): string {
  switch (event.type) {
    case "damage": {
      const sourceName = getCharacterName(event.sourceId, characters);
      const targetName = getCharacterName(event.targetId, characters);
      return `${sourceName} attacks ${targetName} for ${event.damage} damage`;
    }
    case "movement": {
      const charName = getCharacterName(event.characterId, characters);
      const { from, to } = event;
      return `${charName} moves from (${from.x},${from.y}) to (${to.x},${to.y})`;
    }
    case "death": {
      const charName = getCharacterName(event.characterId, characters);
      return `${charName} was eliminated`;
    }
  }
}

/**
 * Get actor ID for faction color coding
 */
function getActorId(event: DamageEvent | MovementEvent | DeathEvent): string {
  switch (event.type) {
    case "damage":
      return event.sourceId;
    case "movement":
    case "death":
      return event.characterId;
  }
}

export function EventLogEntry({
  event,
  characters,
  index,
}: EventLogEntryProps) {
  const formattedText = formatEvent(event, characters);
  const actorId = getActorId(event);
  const faction = getCharacterFaction(actorId, characters);

  // Determine faction CSS class
  const factionClass =
    faction === "friendly"
      ? styles.factionFriendly
      : faction === "enemy"
        ? styles.factionEnemy
        : "";

  return (
    <div
      className={`${styles.eventEntry} ${factionClass}`}
      data-testid={`event-${index}`}
    >
      {formattedText}
    </div>
  );
}
