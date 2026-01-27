/**
 * Tests for selectIntentData selector - tick-based visibility.
 * Extracted from gameStore-selectors.test.ts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectIntentData } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";
import type { Action } from "../engine/types";

describe("selectIntentData - Tick-based Visibility", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should include Light Punch with ticksRemaining = 1", () => {
    const lightPunchSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const action: Action = {
      type: "attack",
      skill: lightPunchSkill,
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // tick = 0, ticksRemaining = 1

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.ticksRemaining).toBe(1);
    expect(result[0]?.action.type).toBe("attack");
  });

  it("should include Light Punch with ticksRemaining = 0", () => {
    const lightPunchSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const action: Action = {
      type: "attack",
      skill: lightPunchSkill,
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Advance to resolution tick
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.ticksRemaining).toBe(0);
    expect(result[0]?.action.type).toBe("attack");
  });

  it("should filter out Light Punch with ticksRemaining = -1", () => {
    const lightPunchSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const action: Action = {
      type: "attack",
      skill: lightPunchSkill,
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Advance past resolution tick
    useGameStore.setState((state) => {
      state.gameState.tick = 2;
    });

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(0);
  });

  it("should include Heavy Punch with ticksRemaining = 2", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const action: Action = {
      type: "attack",
      skill: heavyPunchSkill,
      targetCell: { x: 2, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const char = createCharacter({
      id: "char-a",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // tick = 0, ticksRemaining = 2

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.ticksRemaining).toBe(2);
  });

  it("should include Heavy Punch with ticksRemaining = 1", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const action: Action = {
      type: "attack",
      skill: heavyPunchSkill,
      targetCell: { x: 2, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const char = createCharacter({
      id: "char-a",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Advance one tick
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.ticksRemaining).toBe(1);
  });

  it("should include Heavy Punch with ticksRemaining = 0", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const action: Action = {
      type: "attack",
      skill: heavyPunchSkill,
      targetCell: { x: 2, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const char = createCharacter({
      id: "char-a",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Advance to resolution tick
    useGameStore.setState((state) => {
      state.gameState.tick = 2;
    });

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.ticksRemaining).toBe(0);
  });

  it("should filter out Heavy Punch with ticksRemaining = -1", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const action: Action = {
      type: "attack",
      skill: heavyPunchSkill,
      targetCell: { x: 2, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const char = createCharacter({
      id: "char-a",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Advance past resolution tick
    useGameStore.setState((state) => {
      state.gameState.tick = 3;
    });

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(0);
  });

  it("should include movement with ticksRemaining = 1", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const action: Action = {
      type: "move",
      skill: moveSkill,
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // tick = 0, ticksRemaining = 1

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.ticksRemaining).toBe(1);
    expect(result[0]?.action.type).toBe("move");
  });

  it("should include movement with ticksRemaining = 0 (uniform filtering)", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const action: Action = {
      type: "move",
      skill: moveSkill,
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Advance to resolution tick
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.ticksRemaining).toBe(0);
    expect(result[0]?.action.type).toBe("move");
  });

  it("should filter out movement with ticksRemaining = -1", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const action: Action = {
      type: "move",
      skill: moveSkill,
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Advance past resolution tick
    useGameStore.setState((state) => {
      state.gameState.tick = 2;
    });

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(0);
  });
});
