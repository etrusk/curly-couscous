/**
 * Tests for multiple attack scenarios: multiple attackers, simultaneous kills, independent attacks.
 * Sections 4, 6, 7 from original combat.test.ts
 */

import { describe, it, expect } from "vitest";
import { resolveCombat } from "./combat";
import {
  baseCreateCharacter as createCharacter,
  createAttackAction,
} from "./combat-test-helpers";

describe("resolveCombat", () => {
  // =========================================================================
  // Section 4: Multiple Attacks Same Target
  // =========================================================================
  describe("multiple attacks same target", () => {
    it("should apply damage from multiple attackers to same target", () => {
      const attackerA = createCharacter({
        id: "attackerA",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 10, 1),
      });
      const attackerB = createCharacter({
        id: "attackerB",
        position: { x: 1, y: 1 },
        slotPosition: 2,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 25, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 2, y: 2 },
        hp: 100,
        slotPosition: 3,
      });

      const result = resolveCombat([attackerA, attackerB, target], 1);

      expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
        65,
      ); // 100 - 10 - 25
    });

    it("should generate separate DamageEvents for each attacker", () => {
      const attackerA = createCharacter({
        id: "attackerA",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 10, 1),
      });
      const attackerB = createCharacter({
        id: "attackerB",
        position: { x: 1, y: 1 },
        slotPosition: 2,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 25, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 2, y: 2 },
        hp: 100,
        slotPosition: 3,
      });

      const result = resolveCombat([attackerA, attackerB, target], 1);

      const damageEvents = result.events.filter((e) => e.type === "damage");
      expect(damageEvents).toHaveLength(2);
    });

    it("should show cumulative HP in sequential DamageEvents", () => {
      const attackerA = createCharacter({
        id: "attackerA",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 10, 1),
      });
      const attackerB = createCharacter({
        id: "attackerB",
        position: { x: 1, y: 1 },
        slotPosition: 2,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 25, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 2, y: 2 },
        hp: 100,
        slotPosition: 3,
      });

      const result = resolveCombat([attackerA, attackerB, target], 1);

      const damageEvents = result.events.filter((e) => e.type === "damage");
      expect(damageEvents[0]!).toMatchObject({ damage: 10, resultingHp: 90 });
      expect(damageEvents[1]!).toMatchObject({ damage: 25, resultingHp: 65 });
    });

    it("should handle three attackers on same target", () => {
      const attackerA = createCharacter({
        id: "attackerA",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 3, y: 3 }, null, 10, 1),
      });
      const attackerB = createCharacter({
        id: "attackerB",
        position: { x: 1, y: 1 },
        slotPosition: 2,
        currentAction: createAttackAction({ x: 3, y: 3 }, null, 10, 1),
      });
      const attackerC = createCharacter({
        id: "attackerC",
        position: { x: 2, y: 2 },
        slotPosition: 3,
        currentAction: createAttackAction({ x: 3, y: 3 }, null, 25, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 3, y: 3 },
        hp: 100,
        slotPosition: 4,
      });

      const result = resolveCombat(
        [attackerA, attackerB, attackerC, target],
        1,
      );

      expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
        55,
      ); // 100 - 10 - 10 - 25
    });
  });

  // =========================================================================
  // Section 6: Simultaneous Kills (Mutual Elimination)
  // =========================================================================
  describe("simultaneous kills (mutual elimination)", () => {
    it("should allow both characters to die on same tick", () => {
      const charA = createCharacter({
        id: "charA",
        position: { x: 0, y: 0 },
        hp: 10,
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const charB = createCharacter({
        id: "charB",
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 2,
        currentAction: createAttackAction({ x: 0, y: 0 }, null, 25, 1),
      });

      const result = resolveCombat([charA, charB], 1);

      expect(
        result.updatedCharacters.find((c) => c.id === "charA")?.hp,
      ).toBeLessThanOrEqual(0);
      expect(
        result.updatedCharacters.find((c) => c.id === "charB")?.hp,
      ).toBeLessThanOrEqual(0);
    });

    it("should generate DeathEvents for both characters", () => {
      const charA = createCharacter({
        id: "charA",
        position: { x: 0, y: 0 },
        hp: 10,
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const charB = createCharacter({
        id: "charB",
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 2,
        currentAction: createAttackAction({ x: 0, y: 0 }, null, 25, 1),
      });

      const result = resolveCombat([charA, charB], 1);

      const deathEvents = result.events.filter((e) => e.type === "death");
      expect(deathEvents).toHaveLength(2);
    });

    it("should apply damage from dying character", () => {
      const charA = createCharacter({
        id: "charA",
        position: { x: 0, y: 0 },
        hp: 10,
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const charB = createCharacter({
        id: "charB",
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 2,
        currentAction: createAttackAction({ x: 0, y: 0 }, null, 25, 1),
      });

      const result = resolveCombat([charA, charB], 1);

      // Both should have taken damage
      expect(result.updatedCharacters.find((c) => c.id === "charA")?.hp).toBe(
        -15,
      );
      expect(result.updatedCharacters.find((c) => c.id === "charB")?.hp).toBe(
        -15,
      );
    });

    it("should handle three-way mutual kill", () => {
      const charA = createCharacter({
        id: "charA",
        position: { x: 0, y: 0 },
        hp: 10,
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const charB = createCharacter({
        id: "charB",
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 2,
        currentAction: createAttackAction({ x: 2, y: 0 }, null, 25, 1),
      });
      const charC = createCharacter({
        id: "charC",
        position: { x: 2, y: 0 },
        hp: 10,
        slotPosition: 3,
        currentAction: createAttackAction({ x: 0, y: 0 }, null, 25, 1),
      });

      const result = resolveCombat([charA, charB, charC], 1);

      expect(
        result.updatedCharacters.find((c) => c.id === "charA")?.hp,
      ).toBeLessThanOrEqual(0);
      expect(
        result.updatedCharacters.find((c) => c.id === "charB")?.hp,
      ).toBeLessThanOrEqual(0);
      expect(
        result.updatedCharacters.find((c) => c.id === "charC")?.hp,
      ).toBeLessThanOrEqual(0);
      const deathEvents = result.events.filter((e) => e.type === "death");
      expect(deathEvents).toHaveLength(3);
    });
  });

  // =========================================================================
  // Section 7: Multiple Independent Attacks
  // =========================================================================
  describe("multiple independent attacks", () => {
    it("should resolve multiple independent attack pairs", () => {
      const charA = createCharacter({
        id: "charA",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const charB = createCharacter({
        id: "charB",
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 2,
      });
      const charC = createCharacter({
        id: "charC",
        position: { x: 5, y: 5 },
        slotPosition: 3,
        currentAction: createAttackAction({ x: 6, y: 5 }, null, 25, 1),
      });
      const charD = createCharacter({
        id: "charD",
        position: { x: 6, y: 5 },
        hp: 100,
        slotPosition: 4,
      });

      const result = resolveCombat([charA, charB, charC, charD], 1);

      expect(result.updatedCharacters.find((c) => c.id === "charB")?.hp).toBe(
        90,
      );
      expect(result.updatedCharacters.find((c) => c.id === "charD")?.hp).toBe(
        75,
      );
    });

    it("should handle mix of hits and misses", () => {
      const charA = createCharacter({
        id: "charA",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const charB = createCharacter({
        id: "charB",
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 2,
      });
      const charC = createCharacter({
        id: "charC",
        position: { x: 5, y: 5 },
        slotPosition: 3,
        currentAction: createAttackAction({ x: 6, y: 5 }, null, 25, 1),
      });
      const charD = createCharacter({
        id: "charD",
        position: { x: 7, y: 7 }, // Not at target cell
        hp: 100,
        slotPosition: 4,
      });

      const result = resolveCombat([charA, charB, charC, charD], 1);

      expect(result.updatedCharacters.find((c) => c.id === "charB")?.hp).toBe(
        90,
      ); // Hit
      expect(result.updatedCharacters.find((c) => c.id === "charD")?.hp).toBe(
        100,
      ); // Miss
    });

    it("should handle attacker with no action", () => {
      const charA = createCharacter({
        id: "charA",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const charB = createCharacter({
        id: "charB",
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 2,
        currentAction: null, // No action
      });

      const result = resolveCombat([charA, charB], 1);

      expect(result.updatedCharacters.find((c) => c.id === "charB")?.hp).toBe(
        90,
      );
      const damageEvents = result.events.filter((e) => e.type === "damage");
      expect(damageEvents).toHaveLength(1); // Only charA's attack
    });
  });
});
