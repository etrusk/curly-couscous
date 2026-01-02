/**
 * Tests for gameStore selectors.
 * Tests damage event filtering for Phase 4: Damage Numbers.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectRecentDamageEvents } from "./gameStore";
import type { Character, DamageEvent, GameEvent } from "../engine/types";

describe("selectRecentDamageEvents", () => {
  // Helper to create a minimal character for testing
  const createCharacter = (id: string): Character => ({
    id,
    name: `Character ${id}`,
    faction: "friendly",
    slotPosition: 0,
    hp: 100,
    maxHp: 100,
    position: { x: 0, y: 0 },
    skills: [],
    currentAction: null,
  });

  beforeEach(() => {
    // Reset store state before each test
    useGameStore.getState().actions.reset();
  });

  it("returns empty array when no damage events", () => {
    const char1 = createCharacter("char1");
    useGameStore.getState().actions.initBattle([char1]);

    const result = selectRecentDamageEvents(useGameStore.getState());

    expect(result).toEqual([]);
  });

  it("filters damage events by current tick", () => {
    const char1 = createCharacter("char1");
    const char2 = createCharacter("char2");
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Advance to tick 1
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Add damage event at tick 1
    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 1,
      sourceId: "char1",
      targetId: "char2",
      damage: 10,
      resultingHp: 90,
    };
    useGameStore.getState().actions.addEvent(damageEvent);

    const result = selectRecentDamageEvents(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(damageEvent);
  });

  it("excludes damage from previous ticks", () => {
    const char1 = createCharacter("char1");
    const char2 = createCharacter("char2");
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Add damage event at tick 0
    const oldDamageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char2",
      damage: 10,
      resultingHp: 90,
    };
    useGameStore.getState().actions.addEvent(oldDamageEvent);

    // Advance to tick 1
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Add damage event at tick 1
    const currentDamageEvent: DamageEvent = {
      type: "damage",
      tick: 1,
      sourceId: "char2",
      targetId: "char1",
      damage: 25,
      resultingHp: 75,
    };
    useGameStore.getState().actions.addEvent(currentDamageEvent);

    const result = selectRecentDamageEvents(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(currentDamageEvent);
    expect(result[0]!.tick).toBe(1);
  });

  it("excludes non-damage events", () => {
    const char1 = createCharacter("char1");
    useGameStore.getState().actions.initBattle([char1]);

    // Add various event types at tick 0
    const movementEvent: GameEvent = {
      type: "movement",
      tick: 0,
      characterId: "char1",
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 },
      collided: false,
    };
    const deathEvent: GameEvent = {
      type: "death",
      tick: 0,
      characterId: "char1",
    };
    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char1",
      damage: 50,
      resultingHp: 50,
    };

    useGameStore.getState().actions.addEvent(movementEvent);
    useGameStore.getState().actions.addEvent(deathEvent);
    useGameStore.getState().actions.addEvent(damageEvent);

    const result = selectRecentDamageEvents(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("damage");
    expect(result[0]).toEqual(damageEvent);
  });
});
