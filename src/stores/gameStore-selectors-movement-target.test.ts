/**
 * Tests for selectMovementTargetData selector - Movement targeting lines.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";

describe("selectMovementTargetData", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should return empty array when no characters exist", () => {
    useGameStore.getState().actions.initBattle([]);

    const result = useGameStore.getState().selectMovementTargetData?.();

    expect(result).toEqual([]);
  });

  it("should filter out dead characters (hp <= 0)", () => {
    const moveSkill = createSkill({
      id: "move-skill",
      behavior: "towards",
      tickCost: 1,
    });
    const deadChar1 = createCharacter({
      id: "dead1",
      hp: 0,
      skills: [moveSkill],
      position: { q: 0, r: 0 },
    });
    const deadChar2 = createCharacter({
      id: "dead2",
      hp: -5,
      skills: [moveSkill],
      position: { q: 1, r: 1 },
    });
    useGameStore.getState().actions.initBattle([deadChar1, deadChar2]);

    const result = useGameStore.getState().selectMovementTargetData?.();

    expect(result).toEqual([]);
  });

  it("should return targeting data using default nearest_enemy selector when no selectorOverride", () => {
    const moveSkill = createSkill({
      id: "move-skill",
      behavior: "towards",
      tickCost: 1,
    });
    const friendly = createCharacter({
      id: "friendly1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [moveSkill],
    });
    const enemy = createCharacter({
      id: "enemy1",
      faction: "enemy",
      position: { q: 2, r: 3 },
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = useGameStore.getState().selectMovementTargetData?.();

    expect(result).toHaveLength(1);
    expect(result?.[0]?.fromId).toBe("friendly1");
    expect(result?.[0]?.fromPosition).toEqual({ q: 0, r: 0 });
    expect(result?.[0]?.toPosition).toEqual({ q: 2, r: 3 });
    expect(result?.[0]?.toId).toBe("enemy1");
  });

  it("should respect selectorOverride nearest_ally", () => {
    const moveSkillWithOverride = createSkill({
      id: "move-skill",
      behavior: "towards",
      tickCost: 1,
      target: "ally",
      criterion: "nearest",
    });
    const friendly1 = createCharacter({
      id: "friendly1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [moveSkillWithOverride],
    });
    const friendly2 = createCharacter({
      id: "friendly2",
      faction: "friendly",
      position: { q: 2, r: 2 },
    });
    const enemy = createCharacter({
      id: "enemy1",
      faction: "enemy",
      position: { q: 1, r: 1 },
    });
    useGameStore.getState().actions.initBattle([friendly1, friendly2, enemy]);

    const result = useGameStore.getState().selectMovementTargetData?.();

    expect(result).toHaveLength(1);
    expect(result?.[0]?.toId).toBe("friendly2");
  });

  it("should respect selectorOverride lowest_hp_enemy", () => {
    const moveSkillWithOverride = createSkill({
      id: "move-skill",
      behavior: "towards",
      tickCost: 1,
      target: "enemy",
      criterion: "lowest_hp",
    });
    const friendly = createCharacter({
      id: "friendly1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [moveSkillWithOverride],
    });
    const enemy1 = createCharacter({
      id: "enemy1",
      faction: "enemy",
      position: { q: 2, r: 3 },
      hp: 100,
    });
    const enemy2 = createCharacter({
      id: "enemy2",
      faction: "enemy",
      position: { q: 1, r: 1 },
      hp: 50,
    });
    useGameStore.getState().actions.initBattle([friendly, enemy1, enemy2]);

    const result = useGameStore.getState().selectMovementTargetData?.();

    expect(result).toHaveLength(1);
    expect(result?.[0]?.toId).toBe("enemy2");
  });

  it("should exclude characters without move skill", () => {
    const attackSkill = createSkill({
      id: "attack-skill",
      tickCost: 1,
      damage: 10,
      // No mode property - not a move skill
    });
    const char = createCharacter({
      id: "char1",
      position: { q: 0, r: 0 },
      skills: [attackSkill],
    });
    useGameStore.getState().actions.initBattle([char]);

    const result = useGameStore.getState().selectMovementTargetData?.();

    expect(result).toEqual([]);
  });

  it("should handle self selector returning null (filtered out)", () => {
    const moveSkillWithSelf = createSkill({
      id: "move-skill",
      behavior: "towards",
      tickCost: 1,
      target: "self",
    });
    const char = createCharacter({
      id: "char1",
      position: { q: 0, r: 0 },
      skills: [moveSkillWithSelf],
    });
    useGameStore.getState().actions.initBattle([char]);

    const result = useGameStore.getState().selectMovementTargetData?.();

    expect(result).toEqual([]);
  });

  it("should return multiple targets for multiple characters with move skills", () => {
    const moveSkill = createSkill({
      id: "move-skill",
      behavior: "towards",
      tickCost: 1,
    });
    const friendly1 = createCharacter({
      id: "friendly1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [moveSkill],
    });
    const friendly2 = createCharacter({
      id: "friendly2",
      faction: "friendly",
      position: { q: 1, r: 1 },
      skills: [moveSkill],
    });
    const enemy1 = createCharacter({
      id: "enemy1",
      faction: "enemy",
      position: { q: 2, r: 3 },
      skills: [moveSkill],
    });
    const enemy2 = createCharacter({
      id: "enemy2",
      faction: "enemy",
      position: { q: 3, r: 2 },
      skills: [moveSkill],
    });
    useGameStore
      .getState()
      .actions.initBattle([friendly1, friendly2, enemy1, enemy2]);

    const result = useGameStore.getState().selectMovementTargetData?.();

    expect(result).toHaveLength(4);
    const fromIds = result?.map((r) => r.fromId) ?? [];
    expect(fromIds).toContain("friendly1");
    expect(fromIds).toContain("friendly2");
    expect(fromIds).toContain("enemy1");
    expect(fromIds).toContain("enemy2");

    // Verify each result has correct fromPosition
    result?.forEach((r) => {
      const char =
        useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === r.fromId) ?? null;
      expect(r.fromPosition).toEqual(char?.position);
    });
  });

  it("should return empty array when no valid targets exist for selector", () => {
    const moveSkill = createSkill({
      id: "move-skill",
      behavior: "towards",
      tickCost: 1,
      // Default selector is nearest_enemy
    });
    const friendly = createCharacter({
      id: "friendly1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [moveSkill],
    });
    // No enemies
    useGameStore.getState().actions.initBattle([friendly]);

    const result = useGameStore.getState().selectMovementTargetData?.();

    expect(result).toEqual([]);
  });

  it("should use current positions not action targets", () => {
    const moveSkill = createSkill({
      id: "move-skill",
      behavior: "towards",
      tickCost: 1,
    });
    const friendly = createCharacter({
      id: "friendly1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [moveSkill],
      currentAction: {
        type: "move",
        skill: moveSkill,
        targetCell: { q: 2, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    });
    const enemy = createCharacter({
      id: "enemy1",
      faction: "enemy",
      position: { q: 5, r: 0 },
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = useGameStore.getState().selectMovementTargetData?.();

    expect(result).toHaveLength(1);
    expect(result?.[0]?.fromPosition).toEqual({ q: 0, r: 0 }); // Current position, not (2, 0)
    expect(result?.[0]?.toPosition).toEqual({ q: 5, r: 0 });
  });
});
