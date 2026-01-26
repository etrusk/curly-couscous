/**
 * Tests for gameStore selectors, focusing on intent data selection.
 * Extracted from gameStore.test.ts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  useGameStore,
  selectIntentData,
  selectAllCharacterEvaluations,
} from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";
import { DEFAULT_SKILLS } from "./gameStore-constants";
import type {
  Action,
  Position,
  CharacterEvaluationResult,
} from "../engine/types";

describe("selectIntentData", () => {
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
      targetCell: { x: 2, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const char = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
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
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
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
      targetCell: { x: 0, y: 0 },
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
      targetCell: { x: 1, y: 0 },
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
      targetCell: { x: 5, y: 5 },
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
    const targetCell: Position = { x: 3, y: 3 };
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
      position: { x: 0, y: 0 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);

    const result = selectIntentData(useGameStore.getState());

    expect(result[0]?.action.targetCell).toEqual(targetCell);
    // characterPosition should be the character's current position (not targetCell)
    expect(result[0]?.characterPosition).toEqual({ x: 0, y: 0 });
  });
});

describe("selectAllCharacterEvaluations", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should return empty array when no characters on board", () => {
    // Ensure clean state by resetting and initializing empty battle
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.initBattle([]);
    const result = selectAllCharacterEvaluations(useGameStore.getState());
    expect(result).toEqual([]);
  });

  it("should return evaluation for each character on board", () => {
    const char1 = createCharacter({ id: "char1", faction: "friendly" });
    const char2 = createCharacter({ id: "char2", faction: "enemy" });
    useGameStore.getState().actions.initBattle([char1, char2]);

    const result = selectAllCharacterEvaluations(useGameStore.getState());

    expect(result).toHaveLength(2);
    expect(result[0]?.characterId).toBe("char1");
    expect(result[1]?.characterId).toBe("char2");
    // Should contain skillEvaluations array
    expect(result[0]?.skillEvaluations).toBeDefined();
    expect(result[1]?.skillEvaluations).toBeDefined();
  });

  it("should include mid-action characters with isMidAction true", () => {
    const action: Action = {
      type: "attack",
      skill: createSkill({ id: "light-punch", tickCost: 1 }),
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);

    const result = selectAllCharacterEvaluations(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.isMidAction).toBe(true);
    expect(result[0]?.currentAction).toEqual(action);
  });

  it("should evaluate skill priority for idle characters", () => {
    const char = createCharacter({
      id: "char1",
      currentAction: null,
      skills: DEFAULT_SKILLS,
    });
    useGameStore.getState().actions.initBattle([char]);

    const result = selectAllCharacterEvaluations(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]?.isMidAction).toBe(false);
    expect(result[0]?.skillEvaluations).toHaveLength(3); // Default 3 skills
    // Should have selectedSkillIndex maybe null if no valid skill
    expect(result[0]?.selectedSkillIndex).toBeDefined();
  });

  it("should handle mixed factions correctly", () => {
    const friendly = createCharacter({ id: "friendly", faction: "friendly" });
    const enemy = createCharacter({ id: "enemy", faction: "enemy" });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectAllCharacterEvaluations(useGameStore.getState());

    expect(result).toHaveLength(2);
    const friendlyEval = result.find(
      (r: CharacterEvaluationResult) => r.characterId === "friendly",
    );
    const enemyEval = result.find(
      (r: CharacterEvaluationResult) => r.characterId === "enemy",
    );
    expect(friendlyEval).toBeDefined();
    expect(enemyEval).toBeDefined();
  });
});
