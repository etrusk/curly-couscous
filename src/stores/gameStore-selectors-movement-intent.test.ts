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

  it("should include movement actions with ticksRemaining=1 (core fix)", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const action: Action = {
      type: "move",
      skill: moveSkill,
      targetCell: { q: 2, r: 3 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      position: { q: 4, r: 1 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // tick = 0 after initBattle, ticksRemaining = 1 - 0 = 1

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.characterId).toBe("char1");
    expect(result[0]?.ticksRemaining).toBe(1);
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
      targetCell: { q: 3, r: 2 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const char = createCharacter({
      id: "char1",
      position: { q: 2, r: 2 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // tick = 0 after initBattle, ticksRemaining = 2 - 0 = 2

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.ticksRemaining).toBe(2);
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
      targetCell: { q: 4, r: -1 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      position: { q: 3, r: -1 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.action.targetCell).toEqual({ q: 4, r: -1 });
    expect(result[0]?.characterPosition).toEqual({ q: 3, r: -1 });
  });

  it("should include attack actions with ticksRemaining=1 (about to execute)", () => {
    const instantAttackSkill = createSkill({
      id: "instant-attack",
      tickCost: 1,
      damage: 10,
    });
    const action: Action = {
      type: "attack",
      skill: instantAttackSkill,
      targetCell: { q: 2, r: 2 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      position: { q: 1, r: 2 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // tick = 0 after initBattle, ticksRemaining = 1 - 0 = 1

    const result = selectIntentData(useGameStore.getState());

    // Should show attack with ticksRemaining=1 (about to execute)
    expect(result).toHaveLength(1);
    expect(result[0]?.action.type).toBe("attack");
    expect(result[0]?.ticksRemaining).toBe(1);
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
      targetCell: { q: 2, r: 3 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const enemyAction: Action = {
      type: "move",
      skill: moveSkill,
      targetCell: { q: 4, r: 1 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const friendlyChar = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 4, r: 1 },
      currentAction: friendlyAction,
    });
    const enemyChar = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: -1 },
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
      targetCell: { q: 2, r: 3 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // Manually advance tick beyond resolvesAtTick
    useGameStore.setState((state) => {
      state.gameState.tick = 2;
    });
    // ticksRemaining = 1 - 2 = -1

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(0);
  });
});
