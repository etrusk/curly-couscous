/**
 * Tests for selectAllCharacterEvaluations selector.
 * Extracted from gameStore-selectors.test.ts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectAllCharacterEvaluations } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";
import { DEFAULT_SKILLS } from "./gameStore-constants";
import type { Action, CharacterEvaluationResult } from "../engine/types";

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
    // DEFAULT_SKILLS now only contains innate skills (Move)
    expect(result[0]?.skillEvaluations).toHaveLength(1);
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
