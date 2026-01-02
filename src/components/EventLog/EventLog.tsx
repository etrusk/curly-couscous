/**
 * EventLog component displays scrollable list of game events with filtering.
 * Shows damage, movement, and death events in chronological order.
 */

import { useState } from "react";
import {
  useGameStore,
  selectHistory,
  selectCharacters,
} from "../../stores/gameStore";
import type {
  DamageEvent,
  MovementEvent,
  DeathEvent,
} from "../../engine/types";
import { EventLogEntry } from "./EventLogEntry";
import styles from "./EventLog.module.css";

interface FilterState {
  damage: boolean;
  movement: boolean;
  death: boolean;
}

export function EventLog() {
  const history = useGameStore(selectHistory);
  const characters = useGameStore(selectCharacters);

  // Filter state - all enabled by default
  const [filters, setFilters] = useState<FilterState>({
    damage: true,
    movement: true,
    death: true,
  });

  // Filter to user-visible events only (exclude tick, skill_decision, skill_execution)
  const displayableEvents = history.filter(
    (event): event is DamageEvent | MovementEvent | DeathEvent => {
      return (
        event.type === "damage" ||
        event.type === "movement" ||
        event.type === "death"
      );
    },
  );

  // Apply filters
  const filteredEvents = displayableEvents.filter((event) => {
    if (event.type === "damage") return filters.damage;
    if (event.type === "movement") return filters.movement;
    if (event.type === "death") return filters.death;
    return false;
  });

  // Toggle filter handler
  const handleFilterToggle = (filterType: keyof FilterState) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Event Log</h2>
        <div className={styles.filters}>
          <label className={styles.filterLabel}>
            <input
              type="checkbox"
              checked={filters.damage}
              onChange={() => handleFilterToggle("damage")}
              aria-label="Damage events filter"
            />
            Damage
          </label>
          <label className={styles.filterLabel}>
            <input
              type="checkbox"
              checked={filters.movement}
              onChange={() => handleFilterToggle("movement")}
              aria-label="Movement events filter"
            />
            Movement
          </label>
          <label className={styles.filterLabel}>
            <input
              type="checkbox"
              checked={filters.death}
              onChange={() => handleFilterToggle("death")}
              aria-label="Death events filter"
            />
            Death
          </label>
        </div>
      </div>
      <div className={styles.scrollContainer}>
        {filteredEvents.length === 0 ? (
          <div className={styles.emptyState}>No events to display</div>
        ) : (
          filteredEvents.map((event, index) => (
            <EventLogEntry
              key={`${event.type}-${event.tick}-${index}`}
              event={event}
              characters={characters}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
}
