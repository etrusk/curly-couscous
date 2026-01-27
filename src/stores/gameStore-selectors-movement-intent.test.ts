/**
 * Tests for gameStore selectors - movement intent visibility.
 * Extracted from gameStore-selectors.test.ts to maintain file size under 400 lines.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectIntentData } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";
import type { Action } from "../engine/types";

describe("selectIntentData - movement intents", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should include movement actions with ticksRemaining=0 (core fix)", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const action: Action = {
      type: "move",
      skill: moveSkill,
      targetCell: { x: 5, y: 5 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const char = createCharacter({
      id: "char1",
      position: { x: 4, y: 5 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // tick = 0 after initBattle, ticksRemaining = 0 - 0 = 0

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.characterId).toBe("char1");
    expect(result[0]?.ticksRemaining).toBe(0);
    expect(result[0]?.action.type).toBe("move");
  });

  it("should include movement actions with ticksRemaining > 0 (multi-tick movement)", () => {
    const slowMoveSkill = createSkill({
      id: "slow-move",
      tickCost: 2,
      mode: "towards",
    });
    const action: Action = {
      type: "move",
      skill: slowMoveSkill,
      targetCell: { x: 6, y: 6 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      position: { x: 4, y: 4 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // tick = 0 after initBattle, ticksRemaining = 1 - 0 = 1

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.ticksRemaining).toBe(1);
    expect(result[0]?.action.type).toBe("move");
  });

  it("should extract targetCell from movement intent for line destination", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const action: Action = {
      type: "move",
      skill: moveSkill,
      targetCell: { x: 7, y: 3 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const char = createCharacter({
      id: "char1",
      position: { x: 6, y: 3 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.action.targetCell).toEqual({ x: 7, y: 3 });
    expect(result[0]?.characterPosition).toEqual({ x: 6, y: 3 });
  });

  it("should filter out attack actions with ticksRemaining=0 (regression prevention)", () => {
    const instantAttackSkill = createSkill({
      id: "instant-attack",
      tickCost: 1,
      damage: 10,
    });
    const action: Action = {
      type: "attack",
      skill: instantAttackSkill,
      targetCell: { x: 2, y: 2 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const char = createCharacter({
      id: "char1",
      position: { x: 1, y: 2 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // tick = 0 after initBattle, ticksRemaining = 0 - 0 = 0

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(0);
  });

  it("should include movement intents for both factions", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const friendlyAction: Action = {
      type: "move",
      skill: moveSkill,
      targetCell: { x: 5, y: 5 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const enemyAction: Action = {
      type: "move",
      skill: moveSkill,
      targetCell: { x: 7, y: 5 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const friendlyChar = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 4, y: 5 },
      currentAction: friendlyAction,
    });
    const enemyChar = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 6, y: 5 },
      currentAction: enemyAction,
    });
    useGameStore.getState().actions.initBattle([friendlyChar, enemyChar]);

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(2);
    const friendly = result.find((r) => r.faction === "friendly");
    const enemy = result.find((r) => r.faction === "enemy");
    expect(friendly).toBeDefined();
    expect(enemy).toBeDefined();
    expect(friendly?.action.type).toBe("move");
    expect(enemy?.action.type).toBe("move");
  });

  it("should filter out movement with negative ticksRemaining (stale actions)", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const action: Action = {
      type: "move",
      skill: moveSkill,
      targetCell: { x: 5, y: 5 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const char = createCharacter({
      id: "char1",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Manually advance tick beyond resolvesAtTick
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });
    // ticksRemaining = 0 - 1 = -1

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(0);
  });
});
