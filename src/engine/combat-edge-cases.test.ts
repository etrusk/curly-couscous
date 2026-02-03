/**
 * Tests for edge cases: action filtering, empty arrays, HP boundaries, undefined damage, event ordering.
 * Sections 8-11 from original combat.test.ts
 */

import { describe, it, expect } from "vitest";
import { resolveCombat } from "./combat";
import {
  baseCreateCharacter as createCharacter,
  baseCreateMoveAction as createMoveAction,
  createAttackAction,
  createIdleAction,
} from "./combat-test-helpers";

describe("resolveCombat", () => {
  // =========================================================================
  // Section 8: Action Filtering
  // =========================================================================
  describe("action filtering", () => {
    it("should only resolve actions with ticksRemaining === 1", () => {
      const charA = createCharacter({
        id: "charA",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 10, 1), // Resolves
      });
      const charB = createCharacter({
        id: "charB",
        position: { q: 1, r: 0 },
        hp: 100,
        slotPosition: 2,
      });
      const charC = createCharacter({
        id: "charC",
        position: { x: 5, y: 5 },
        slotPosition: 3,
        currentAction: createAttackAction({ x: 6, y: 6 }, null, 25, 2), // Doesn't resolve
      });
      const charD = createCharacter({
        id: "charD",
        position: { x: 6, y: 6 },
        hp: 100,
        slotPosition: 4,
      });

      const result = resolveCombat([charA, charB, charC, charD], 1);

      expect(result.updatedCharacters.find((c) => c.id === "charB")?.hp).toBe(
        90,
      ); // Hit
      expect(result.updatedCharacters.find((c) => c.id === "charD")?.hp).toBe(
        100,
      ); // Not hit (action not ready)
    });

    it("should ignore move actions", () => {
      const charA = createCharacter({
        id: "charA",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 1, r: 0 }, 1),
      });

      const result = resolveCombat([charA], 1);

      const damageEvents = result.events.filter((e) => e.type === "damage");
      expect(damageEvents).toHaveLength(0);
    });

    it("should ignore idle actions", () => {
      const charA = createCharacter({
        id: "charA",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createIdleAction(),
      });

      const result = resolveCombat([charA], 1);

      const damageEvents = result.events.filter((e) => e.type === "damage");
      expect(damageEvents).toHaveLength(0);
    });

    it("should handle character with null currentAction", () => {
      const charA = createCharacter({
        id: "charA",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: null,
      });

      const result = resolveCombat([charA], 1);

      const damageEvents = result.events.filter((e) => e.type === "damage");
      expect(damageEvents).toHaveLength(0);
    });
  });

  // =========================================================================
  // Section 9: Edge Cases
  // =========================================================================
  describe("edge cases", () => {
    it("should return empty events when no attacks resolve", () => {
      const charA = createCharacter({
        id: "charA",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 1, r: 0 }, 1),
      });
      const charB = createCharacter({
        id: "charB",
        position: { q: 1, r: 0 },
        slotPosition: 2,
        currentAction: null,
      });

      const result = resolveCombat([charA, charB], 1);

      expect(result.events).toHaveLength(0);
    });

    it("should return unchanged characters when no attacks resolve", () => {
      const charA = createCharacter({
        id: "charA",
        position: { q: 0, r: 0 },
        hp: 50,
        slotPosition: 1,
        currentAction: createMoveAction({ q: 1, r: 0 }, 1),
      });
      const charB = createCharacter({
        id: "charB",
        position: { q: 1, r: 0 },
        hp: 75,
        slotPosition: 2,
        currentAction: null,
      });

      const result = resolveCombat([charA, charB], 1);

      expect(result.updatedCharacters.find((c) => c.id === "charA")?.hp).toBe(
        50,
      );
      expect(result.updatedCharacters.find((c) => c.id === "charB")?.hp).toBe(
        75,
      );
    });

    it("should handle empty characters array", () => {
      const result = resolveCombat([], 1);

      expect(result.updatedCharacters).toHaveLength(0);
      expect(result.events).toHaveLength(0);
    });

    it("should handle attack when targetCharacter not in array", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 10, 1),
      });
      const actualTarget = createCharacter({
        id: "actualTarget",
        position: { q: 1, r: 0 }, // At target cell
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, actualTarget], 1);

      // Should hit based on cell, not targetCharacter reference
      expect(
        result.updatedCharacters.find((c) => c.id === "actualTarget")?.hp,
      ).toBe(90);
    });

    it("should preserve non-HP character properties", () => {
      const attacker = createCharacter({
        id: "attacker",
        name: "Attacker",
        faction: "friendly",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: "target",
        name: "Target",
        faction: "enemy",
        position: { q: 1, r: 0 },
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      const updatedTarget = result.updatedCharacters.find(
        (c) => c.id === "target",
      );
      expect(updatedTarget?.id).toBe("target");
      expect(updatedTarget?.name).toBe("Target");
      expect(updatedTarget?.faction).toBe("enemy");
      expect(updatedTarget?.position).toEqual({ q: 1, r: 0 });
    });
  });

  // =========================================================================
  // Section 10: HP Boundary Cases
  // =========================================================================
  describe("HP boundary cases", () => {
    it("should handle target at 1 HP surviving", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, undefined, 1), // undefined damage
      });
      const target = createCharacter({
        id: "target",
        position: { q: 1, r: 0 },
        hp: 1,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
        1,
      );
      const deathEvents = result.events.filter((e) => e.type === "death");
      expect(deathEvents).toHaveLength(0);
    });

    it("should handle exactly lethal damage", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 25, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { q: 1, r: 0 },
        hp: 25,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
        0,
      );
      const deathEvents = result.events.filter((e) => e.type === "death");
      expect(deathEvents).toHaveLength(1);
    });

    it("should handle massive overkill without clamping", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 100, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { q: 1, r: 0 },
        hp: 10,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
        -90,
      );
      const deathEvents = result.events.filter((e) => e.type === "death");
      expect(deathEvents).toHaveLength(1); // Only one death event
    });

    it("should handle target at maxHP taking damage", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { q: 1, r: 0 },
        hp: 100,
        maxHp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
        90,
      );
      expect(
        result.updatedCharacters.find((c) => c.id === "target")?.maxHp,
      ).toBe(100);
    });
  });

  // =========================================================================
  // Section 11: Undefined Damage and Event Ordering
  // =========================================================================
  describe("undefined damage and event ordering", () => {
    it("should treat undefined skill.damage as 0", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, undefined, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { q: 1, r: 0 },
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
        100,
      );
      const damageEvent = result.events.find((e) => e.type === "damage");
      expect(damageEvent).toMatchObject({
        damage: 0,
      });
    });

    it("should order events by attacker slotPosition", () => {
      const attackerB = createCharacter({
        id: "attackerB",
        position: { q: 2, r: 0 },
        slotPosition: 3,
        currentAction: createAttackAction({ q: 0, r: 0 }, null, 10, 1),
      });
      const attackerA = createCharacter({
        id: "attackerA",
        position: { q: 1, r: 0 },
        slotPosition: 2,
        currentAction: createAttackAction({ q: 0, r: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { q: 0, r: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([target, attackerA, attackerB], 1);

      const damageEvents = result.events.filter((e) => e.type === "damage");
      expect(damageEvents[0]!.sourceId).toBe("attackerA"); // slotPosition 1
      expect(damageEvents[1]!.sourceId).toBe("attackerB"); // slotPosition 2
    });

    it("should order all DamageEvents before DeathEvents", () => {
      const attackerA = createCharacter({
        id: "attackerA",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 2, r: 0 }, null, 100, 1),
      });
      const attackerB = createCharacter({
        id: "attackerB",
        position: { x: 1, y: 1 },
        slotPosition: 2,
        currentAction: createAttackAction({ x: 3, y: 3 }, null, 100, 1),
      });
      const targetA = createCharacter({
        id: "targetA",
        position: { q: 2, r: 0 },
        hp: 50,
        slotPosition: 3,
      });
      const targetB = createCharacter({
        id: "targetB",
        position: { x: 3, y: 3 },
        hp: 50,
        slotPosition: 4,
      });

      const result = resolveCombat([attackerA, attackerB, targetA, targetB], 1);

      const damageEvents = result.events.filter((e) => e.type === "damage");
      const deathEvents = result.events.filter((e) => e.type === "death");
      const lastDamageIndex = result.events.lastIndexOf(
        damageEvents[damageEvents.length - 1]!,
      );
      const firstDeathIndex = result.events.indexOf(deathEvents[0]!);
      expect(lastDamageIndex).toBeLessThan(firstDeathIndex);
    });
  });
});
