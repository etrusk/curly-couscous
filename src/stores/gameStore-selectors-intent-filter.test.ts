/**
 * Tests for selectIntentData selector - filtering logic.
 * Extracted from gameStore-selectors.test.ts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectIntentData } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";
import type { Action, Position } from "../engine/types";

describe("selectIntentData - Filtering Logic", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should return empty array when no characters have currentAction", () => {
    const char1 = createCharacter({ id: "char1" });
    const char2 = createCharacter({ id: "char2" });
    useGameStore.getState().actions.initBattle([char1, char2]);

    const result = selectIntentData(useGameStore.getState());

    expect(result).toEqual([]);
  });

  it("should include Heavy Punch (tickCost 2) with positive ticksRemaining", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const action: Action = {
      type: "attack",
      skill: heavyPunchSkill,
      targetCell: { q: 2, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const char = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.characterId).toBe("char1");
    expect(result[0]?.faction).toBe("friendly");
    expect(result[0]?.action).toEqual(action);
    expect(result[0]?.ticksRemaining).toBe(2);
  });

  it("should include Light Punch when ticksRemaining > 0 (complete information principle)", () => {
    const lightPunchSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const action: Action = {
      type: "attack",
      skill: lightPunchSkill,
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // tick is 0 after initBattle, ticksRemaining = 1 (> 0)
    // Per "complete information" design principle: show all pending actions
    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.characterId).toBe("char1");
    expect(result[0]?.ticksRemaining).toBe(1);
  });

  it("should filter out idle actions (type: 'idle')", () => {
    const idleAction: Action = {
      type: "idle",
      skill: createSkill({ id: "idle", tickCost: 0 }),
      targetCell: { q: 0, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const char = createCharacter({
      id: "char1",
      currentAction: idleAction,
    });
    useGameStore.getState().actions.initBattle([char]);

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(0);
  });

  it("should filter out actions with negative ticksRemaining (past resolution)", () => {
    const skill = createSkill({ id: "skill", tickCost: 2 });
    const action: Action = {
      type: "attack",
      skill,
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const char = createCharacter({
      id: "char1",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Advance tick beyond resolvesAtTick
    useGameStore.setState((state) => {
      state.gameState.tick = 3;
    });

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(0);
  });

  it("should include actions with ticksRemaining > 0 regardless of faction", () => {
    const skill = createSkill({ id: "skill", tickCost: 3 });
    const action: Action = {
      type: "attack",
      skill,
      targetCell: { q: 2, r: 3 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 3,
    };
    const friendlyChar = createCharacter({
      id: "friendly",
      faction: "friendly",
      currentAction: action,
    });
    const enemyChar = createCharacter({
      id: "enemy",
      faction: "enemy",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([friendlyChar, enemyChar]);

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(2);
    const friendly = result.find((r) => r.faction === "friendly");
    const enemy = result.find((r) => r.faction === "enemy");
    expect(friendly).toBeDefined();
    expect(enemy).toBeDefined();
    expect(friendly?.characterId).toBe("friendly");
    expect(enemy?.characterId).toBe("enemy");
  });

  it("should lock targetCell position at time of decision (character position may change)", () => {
    const skill = createSkill({ id: "skill", tickCost: 2 });
    const targetCell: Position = { q: 3, r: 0 };
    const action: Action = {
      type: "attack",
      skill,
      targetCell,
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const char = createCharacter({
      id: "char1",
      position: { q: 0, r: 0 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);

    const result = selectIntentData(useGameStore.getState());

    expect(result[0]?.action.targetCell).toEqual(targetCell);
    // characterPosition should be the character's current position (not targetCell)
    expect(result[0]?.characterPosition).toEqual({ q: 0, r: 0 });
  });

  it("should include attack actions with ticksRemaining = 0 (resolving this tick)", () => {
    const skill = createSkill({ id: "attack-skill", tickCost: 1 });
    const action: Action = {
      type: "attack",
      skill,
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Advance tick to resolution tick (ticksRemaining = 0)
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    const result = selectIntentData(useGameStore.getState());

    // Attack actions resolving on current tick should show intent lines (spec requires >= 0)
    expect(result).toHaveLength(1);
    expect(result[0]?.ticksRemaining).toBe(0);
  });

  it("should include movement actions with ticksRemaining = 0 (uniform filtering)", () => {
    const skill = createSkill({ id: "move-skill", tickCost: 1 });
    const action: Action = {
      type: "move",
      skill,
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Advance tick to resolution tick (ticksRemaining = 0)
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    const result = selectIntentData(useGameStore.getState());

    // Movement actions follow uniform filtering (spec requires >= 0 for all actions)
    expect(result).toHaveLength(1);
    expect(result[0]?.action.type).toBe("move");
    expect(result[0]?.ticksRemaining).toBe(0);
  });

  it("should include both attack and movement at ticksRemaining = 0 (uniform filtering)", () => {
    const attackSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const attackAction: Action = {
      type: "attack",
      skill: attackSkill,
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      behavior: "towards",
    });
    const moveAction: Action = {
      type: "move",
      skill: moveSkill,
      targetCell: { q: 2, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const charA = createCharacter({
      id: "char-a",
      currentAction: attackAction,
    });
    const charB = createCharacter({
      id: "char-b",
      currentAction: moveAction,
    });
    useGameStore.getState().actions.initBattle([charA, charB]);
    // Advance to resolution tick
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(2);
    const attackResult = result.find((r) => r.action.type === "attack");
    const moveResult = result.find((r) => r.action.type === "move");
    expect(attackResult).toBeDefined();
    expect(moveResult).toBeDefined();
    expect(attackResult?.ticksRemaining).toBe(0);
    expect(moveResult?.ticksRemaining).toBe(0);
  });
});
