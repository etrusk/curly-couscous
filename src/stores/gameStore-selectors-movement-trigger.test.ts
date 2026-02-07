/**
 * Tests for selectMovementTargetData selector - Trigger-aware Move skill selection.
 * Verifies that the selector mirrors the decision engine's evaluation order:
 * skip disabled, on-cooldown, hold-behavior, and trigger-failing Move skills.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";

describe("selectMovementTargetData", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  describe("trigger-aware Move selection", () => {
    it("should skip disabled move skill and use next enabled one", () => {
      const moveSkill1 = createSkill({
        id: "move-1",
        behavior: "towards",
        tickCost: 1,
        enabled: false,
        target: "enemy",
        criterion: "nearest",
      });
      const moveSkill2 = createSkill({
        id: "move-2",
        behavior: "towards",
        tickCost: 1,
        enabled: true,
        target: "ally",
        criterion: "nearest",
      });
      const friendly = createCharacter({
        id: "friendly1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill1, moveSkill2],
      });
      const ally = createCharacter({
        id: "ally1",
        faction: "friendly",
        position: { q: 3, r: 0 },
      });
      const enemy = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { q: 0, r: 3 },
      });
      useGameStore.getState().actions.initBattle([friendly, ally, enemy]);

      const result = useGameStore.getState().selectMovementTargetData?.();

      expect(result.length).toBeGreaterThanOrEqual(1);
      const friendlyEntry = result.find((r) => r.fromId === "friendly1");
      expect(friendlyEntry).toBeDefined();
      expect(friendlyEntry!.toId).toBe("ally1");
    });

    it("should skip move skill on cooldown and use next ready one", () => {
      const moveSkill1 = {
        ...createSkill({
          id: "move-1",
          behavior: "towards",
          tickCost: 1,
          target: "enemy",
          criterion: "nearest",
        }),
        cooldownRemaining: 2,
      };
      const moveSkill2 = createSkill({
        id: "move-2",
        behavior: "towards",
        tickCost: 1,
        target: "ally",
        criterion: "nearest",
      });
      const friendly = createCharacter({
        id: "friendly1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill1, moveSkill2],
      });
      const ally = createCharacter({
        id: "ally1",
        faction: "friendly",
        position: { q: 3, r: 0 },
      });
      const enemy = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { q: 0, r: 3 },
      });
      useGameStore.getState().actions.initBattle([friendly, ally, enemy]);

      const result = useGameStore.getState().selectMovementTargetData?.();

      const friendlyEntry = result.find((r) => r.fromId === "friendly1");
      expect(friendlyEntry).toBeDefined();
      expect(friendlyEntry!.toId).toBe("ally1");
    });

    it("should skip move skill whose triggers fail and use next passing one", () => {
      const moveSkill1 = createSkill({
        id: "move-1",
        behavior: "towards",
        tickCost: 1,
        trigger: { scope: "self", condition: "hp_below", conditionValue: 10 },
        target: "enemy",
        criterion: "nearest",
      });
      const moveSkill2 = createSkill({
        id: "move-2",
        behavior: "towards",
        tickCost: 1,
        trigger: { scope: "enemy", condition: "always" },
        target: "ally",
        criterion: "nearest",
      });
      const friendly = createCharacter({
        id: "friendly1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        hp: 100,
        maxHp: 100,
        skills: [moveSkill1, moveSkill2],
      });
      const ally = createCharacter({
        id: "ally1",
        faction: "friendly",
        position: { q: 3, r: 0 },
      });
      const enemy = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { q: 0, r: 3 },
      });
      useGameStore.getState().actions.initBattle([friendly, ally, enemy]);

      const result = useGameStore.getState().selectMovementTargetData?.();

      const friendlyEntry = result.find((r) => r.fromId === "friendly1");
      expect(friendlyEntry).toBeDefined();
      expect(friendlyEntry!.toId).toBe("ally1");
    });

    it("should skip move skill with hold behavior and use next valid one", () => {
      const moveSkill1 = createSkill({
        id: "move-1",
        behavior: "hold",
        tickCost: 1,
        target: "enemy",
        criterion: "nearest",
      });
      const moveSkill2 = createSkill({
        id: "move-2",
        behavior: "towards",
        tickCost: 1,
        target: "ally",
        criterion: "nearest",
      });
      const friendly = createCharacter({
        id: "friendly1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill1, moveSkill2],
      });
      const ally = createCharacter({
        id: "ally1",
        faction: "friendly",
        position: { q: 3, r: 0 },
      });
      const enemy = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { q: 0, r: 3 },
      });
      useGameStore.getState().actions.initBattle([friendly, ally, enemy]);

      const result = useGameStore.getState().selectMovementTargetData?.();

      const friendlyEntry = result.find((r) => r.fromId === "friendly1");
      expect(friendlyEntry).toBeDefined();
      expect(friendlyEntry!.toId).toBe("ally1");
    });

    it("should return no entry when all move skills fail checks", () => {
      const moveSkill1 = createSkill({
        id: "move-1",
        behavior: "towards",
        tickCost: 1,
        enabled: false,
      });
      const friendly = createCharacter({
        id: "friendly1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill1],
      });
      const enemy = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { q: 2, r: 0 },
      });
      useGameStore.getState().actions.initBattle([friendly, enemy]);

      const result = useGameStore.getState().selectMovementTargetData?.();

      expect(result).toEqual([]);
    });

    it("should use first passing move skill in priority order among three", () => {
      const moveSkill1 = createSkill({
        id: "move-1",
        behavior: "towards",
        tickCost: 1,
        enabled: false,
        target: "enemy",
        criterion: "nearest",
      });
      const moveSkill2 = createSkill({
        id: "move-2",
        behavior: "towards",
        tickCost: 1,
        target: "ally",
        criterion: "nearest",
      });
      const moveSkill3 = createSkill({
        id: "move-3",
        behavior: "towards",
        tickCost: 1,
        target: "enemy",
        criterion: "furthest",
      });
      const friendly = createCharacter({
        id: "friendly1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill1, moveSkill2, moveSkill3],
      });
      const ally = createCharacter({
        id: "ally1",
        faction: "friendly",
        position: { q: 2, r: 0 },
      });
      const enemy = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { q: 0, r: 4 },
      });
      useGameStore.getState().actions.initBattle([friendly, ally, enemy]);

      const result = useGameStore.getState().selectMovementTargetData?.();

      const friendlyEntry = result.find((r) => r.fromId === "friendly1");
      expect(friendlyEntry).toBeDefined();
      expect(friendlyEntry!.toId).toBe("ally1");
      expect(friendlyEntry!.toPosition).toEqual({ q: 2, r: 0 });
    });
  });
});
