/**
 * Tests for useDamageNumbers hook.
 * Tests grouping and enrichment of damage events for display.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGameStore } from "../../../stores/gameStore";
import { useDamageNumbers } from "./useDamageNumbers";
import type { Character, DamageEvent } from "../../../engine/types";

describe("useDamageNumbers", () => {
  // Helper to create a minimal character for testing
  const createCharacter = (
    id: string,
    faction: "friendly" | "enemy",
    position: { q: number; r: number },
  ): Character => ({
    id,
    name: `Character ${id}`,
    faction,
    slotPosition: 1,
    hp: 100,
    maxHp: 100,
    position,
    skills: [],
    currentAction: null,
  });

  beforeEach(() => {
    // Reset store state before each test
    useGameStore.getState().actions.reset();
  });

  it("returns empty array when no damage events", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    const { result } = renderHook(() => useDamageNumbers());

    expect(result.current).toEqual([]);
  });

  it("returns DamageNumberData with correct targetPosition", () => {
    const char1 = createCharacter("char1", "friendly", { q: 2, r: 3 });
    const char2 = createCharacter("char2", "enemy", { q: 1, r: 4 });
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Simulate post-processTick state: store tick is 1, events at tick 0
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Add damage event at tick 0
    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char2",
      damage: 10,
      resultingHp: 90,
    };
    useGameStore.getState().actions.addEvent(damageEvent);

    const { result } = renderHook(() => useDamageNumbers());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.targetPosition).toEqual({ q: 1, r: 4 });
  });

  it("includes attackerFaction from TokenData", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    const char2 = createCharacter("char2", "enemy", { q: 1, r: 1 });
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Simulate post-processTick state: store tick is 1, events at tick 0
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Add damage event at tick 0
    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char2",
      damage: 15,
      resultingHp: 85,
    };
    useGameStore.getState().actions.addEvent(damageEvent);

    const { result } = renderHook(() => useDamageNumbers());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.damages).toHaveLength(1);
    expect(result.current[0]!.damages[0]!.attackerFaction).toBe("friendly");
  });

  it("groups multiple damages by same target", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    const char2 = createCharacter("char2", "friendly", { q: 1, r: 0 });
    const char3 = createCharacter("char3", "enemy", { q: 2, r: 3 });
    useGameStore.getState().actions.initBattle([char1, char2, char3]);

    // Simulate post-processTick state: store tick is 1, events at tick 0
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Both char1 and char2 attack char3
    const damage1: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char3",
      damage: 10,
      resultingHp: 90,
    };
    const damage2: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char2",
      targetId: "char3",
      damage: 25,
      resultingHp: 65,
    };
    useGameStore.getState().actions.addEvent(damage1);
    useGameStore.getState().actions.addEvent(damage2);

    const { result } = renderHook(() => useDamageNumbers());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.targetId).toBe("char3");
    expect(result.current[0]!.damages).toHaveLength(2);
  });

  it("calculates totalDamage correctly for grouped damages", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    const char2 = createCharacter("char2", "friendly", { q: 1, r: 0 });
    const char3 = createCharacter("char3", "enemy", { q: 2, r: 3 });
    useGameStore.getState().actions.initBattle([char1, char2, char3]);

    // Simulate post-processTick state: store tick is 1, events at tick 0
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Add two damage events
    const damage1: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char3",
      damage: 10,
      resultingHp: 90,
    };
    const damage2: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char2",
      targetId: "char3",
      damage: 25,
      resultingHp: 65,
    };
    useGameStore.getState().actions.addEvent(damage1);
    useGameStore.getState().actions.addEvent(damage2);

    const { result } = renderHook(() => useDamageNumbers());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.totalDamage).toBe(35);
  });

  it("preserves individual damage entries in damages array", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    const char2 = createCharacter("char2", "enemy", { q: 1, r: 0 });
    const char3 = createCharacter("char3", "enemy", { q: 2, r: 3 });
    useGameStore.getState().actions.initBattle([char1, char2, char3]);

    // Simulate post-processTick state: store tick is 1, events at tick 0
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Multiple attacks on char3
    const damage1: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char3",
      damage: 10,
      resultingHp: 90,
    };
    const damage2: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char2",
      targetId: "char3",
      damage: 25,
      resultingHp: 65,
    };
    useGameStore.getState().actions.addEvent(damage1);
    useGameStore.getState().actions.addEvent(damage2);

    const { result } = renderHook(() => useDamageNumbers());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.damages).toHaveLength(2);
    expect(result.current[0]!.damages[0]!.amount).toBe(10);
    expect(result.current[0]!.damages[0]!.attackerId).toBe("char1");
    expect(result.current[0]!.damages[1]!.amount).toBe(25);
    expect(result.current[0]!.damages[1]!.attackerId).toBe("char2");
  });

  it("handles multiple targets independently", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    const char2 = createCharacter("char2", "enemy", { q: 2, r: 3 });
    const char3 = createCharacter("char3", "enemy", { q: 3, r: 2 });
    useGameStore.getState().actions.initBattle([char1, char2, char3]);

    // Simulate post-processTick state: store tick is 1, events at tick 0
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // char1 attacks both enemies
    const damage1: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char2",
      damage: 10,
      resultingHp: 90,
    };
    const damage2: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char3",
      damage: 15,
      resultingHp: 85,
    };
    useGameStore.getState().actions.addEvent(damage1);
    useGameStore.getState().actions.addEvent(damage2);

    const { result } = renderHook(() => useDamageNumbers());

    expect(result.current).toHaveLength(2);
    const target2Data = result.current.find(
      (d: { targetId: string }) => d.targetId === "char2",
    );
    const target3Data = result.current.find(
      (d: { targetId: string }) => d.targetId === "char3",
    );

    expect(target2Data).toBeDefined();
    expect(target2Data!.totalDamage).toBe(10);
    expect(target3Data).toBeDefined();
    expect(target3Data!.totalDamage).toBe(15);
  });
});
