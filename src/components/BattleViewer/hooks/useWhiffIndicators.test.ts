/**
 * Tests for useWhiffIndicators hook.
 * Tests transformation of whiff events into display-ready indicator data.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGameStore } from "../../../stores/gameStore";
import { useWhiffIndicators } from "./useWhiffIndicators";
import type { Character } from "../../../engine/types";

describe("useWhiffIndicators", () => {
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
    useGameStore.getState().actions.reset();
  });

  it("returns empty array when no whiff events", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    const { result } = renderHook(() => useWhiffIndicators());

    expect(result.current).toEqual([]);
  });

  it("transforms whiff events into display data with position and actionType", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    // Simulate post-processTick state: store tick is 1, events at tick 0
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Add whiff event at tick 0
    useGameStore.getState().actions.addEvent({
      type: "whiff" as const,
      tick: 0,
      sourceId: "char1",
      actionType: "attack" as const,
      targetCell: { q: 2, r: 3 },
    });

    const { result } = renderHook(() => useWhiffIndicators());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.position).toEqual({ q: 2, r: 3 });
    expect(result.current[0]!.actionType).toBe("attack");
    expect(result.current[0]!.cellKey).toBe("2,3");
  });

  it("deduplicates whiffs on same cell, last event actionType wins", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    const char2 = createCharacter("char2", "friendly", { q: 1, r: 0 });
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Simulate post-processTick state: store tick is 1, events at tick 0
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Two whiff events on same cell, different action types
    useGameStore.getState().actions.addEvent({
      type: "whiff" as const,
      tick: 0,
      sourceId: "char1",
      actionType: "attack" as const,
      targetCell: { q: 1, r: 0 },
    });
    useGameStore.getState().actions.addEvent({
      type: "whiff" as const,
      tick: 0,
      sourceId: "char2",
      actionType: "heal" as const,
      targetCell: { q: 1, r: 0 },
    });

    const { result } = renderHook(() => useWhiffIndicators());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.actionType).toBe("heal"); // last wins
    expect(result.current[0]!.cellKey).toBe("1,0");
  });

  it("handles multiple cells independently", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    // Simulate post-processTick state: store tick is 1, events at tick 0
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Whiff events on different cells
    useGameStore.getState().actions.addEvent({
      type: "whiff" as const,
      tick: 0,
      sourceId: "char1",
      actionType: "attack" as const,
      targetCell: { q: 1, r: 0 },
    });
    useGameStore.getState().actions.addEvent({
      type: "whiff" as const,
      tick: 0,
      sourceId: "char1",
      actionType: "heal" as const,
      targetCell: { q: 2, r: 1 },
    });

    const { result } = renderHook(() => useWhiffIndicators());

    expect(result.current).toHaveLength(2);

    const attackEntry = result.current.find(
      (d) => d.position.q === 1 && d.position.r === 0,
    );
    const healEntry = result.current.find(
      (d) => d.position.q === 2 && d.position.r === 1,
    );

    expect(attackEntry).toBeDefined();
    expect(attackEntry!.actionType).toBe("attack");
    expect(healEntry).toBeDefined();
    expect(healEntry!.actionType).toBe("heal");
  });
});
