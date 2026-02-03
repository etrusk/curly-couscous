/**
 * Tests for basic combat resolution: hit, miss, bodyblocking.
 * Sections 1-3 from original combat.test.ts
 */

import { describe, it, expect } from "vitest";
import { resolveCombat } from "./combat";
import {
  baseCreateCharacter as createCharacter,
  createAttackAction,
} from "./combat-test-helpers";

describe("resolveCombat", () => {
  // =========================================================================
  // Section 1: Basic Attack Hit
  // =========================================================================
  describe("basic attack hit", () => {
    it("should hit target when target is in locked cell", () => {
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
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      const updatedTarget = result.updatedCharacters.find(
        (c) => c.id === "target",
      );
      expect(updatedTarget?.hp).toBe(90);
    });

    it("should apply correct damage from skill", () => {
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
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      const updatedTarget = result.updatedCharacters.find(
        (c) => c.id === "target",
      );
      expect(updatedTarget?.hp).toBe(90);
    });

    it("should generate DamageEvent on hit", () => {
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
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      const damageEvent = result.events.find((e) => e.type === "damage");
      expect(damageEvent).toBeDefined();
      expect(damageEvent).toMatchObject({
        type: "damage",
        sourceId: "attacker",
        targetId: "target",
        damage: 10,
        resultingHp: 90,
      });
    });

    it("should include correct tick in DamageEvent", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 10, 5),
      });
      const target = createCharacter({
        id: "target",
        position: { q: 1, r: 0 },
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 5);

      const damageEvent = result.events.find((e) => e.type === "damage");
      expect(damageEvent).toBeDefined();
      expect(damageEvent?.tick).toBe(5);
    });

    it("should handle Heavy Punch damage correctly", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 25, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { q: 1, r: 0 },
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      const updatedTarget = result.updatedCharacters.find(
        (c) => c.id === "target",
      );
      expect(updatedTarget?.hp).toBe(75);
    });
  });

  // =========================================================================
  // Section 2: Attack Miss
  // =========================================================================
  describe("attack miss", () => {
    it("should miss when no character in target cell", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { q: 2, r: 0 }, // Not in target cell
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      const updatedTarget = result.updatedCharacters.find(
        (c) => c.id === "target",
      );
      expect(updatedTarget?.hp).toBe(100); // No damage
    });

    it("should not generate DamageEvent on miss", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 10, 1),
      });

      const result = resolveCombat([attacker], 1);

      const damageEvents = result.events.filter((e) => e.type === "damage");
      expect(damageEvents).toHaveLength(0);
    });

    it("should not modify any HP on miss", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        hp: 50,
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 10, 1),
      });
      const bystander = createCharacter({
        id: "bystander",
        position: { q: 2, r: 2 },
        hp: 75,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, bystander], 1);

      expect(
        result.updatedCharacters.find((c) => c.id === "attacker")?.hp,
      ).toBe(50);
      expect(
        result.updatedCharacters.find((c) => c.id === "bystander")?.hp,
      ).toBe(75);
    });
  });

  // =========================================================================
  // Section 3: Bodyblocking (Cell-Only Targeting)
  // =========================================================================
  describe("bodyblocking (cell-only targeting)", () => {
    it("should hit different character who moved into target cell", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 10, 1),
      });
      const originalTarget = createCharacter({
        id: "originalTarget",
        position: { q: 2, r: 0 }, // Moved away from (1,0)
        hp: 100,
        slotPosition: 2,
      });
      const bodyBlocker = createCharacter({
        id: "bodyBlocker",
        position: { q: 1, r: 0 }, // Now in target cell
        hp: 100,
        slotPosition: 3,
      });

      const result = resolveCombat([attacker, originalTarget, bodyBlocker], 1);

      expect(
        result.updatedCharacters.find((c) => c.id === "originalTarget")?.hp,
      ).toBe(100);
      expect(
        result.updatedCharacters.find((c) => c.id === "bodyBlocker")?.hp,
      ).toBe(90);
    });

    it("should allow ally to bodyblock for teammate", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 1, r: 2 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 2, r: 2 }, null, 10, 1),
      });
      const woundedAlly = createCharacter({
        id: "woundedAlly",
        faction: "friendly",
        position: { q: 3, r: 2 }, // Moved away from (2,2)
        hp: 5,
        slotPosition: 2,
      });
      const heroicAlly = createCharacter({
        id: "heroicAlly",
        faction: "friendly",
        position: { q: 2, r: 2 }, // Bodyblocking at (2,2)
        hp: 100,
        slotPosition: 3,
      });

      const result = resolveCombat([enemy, woundedAlly, heroicAlly], 1);

      expect(
        result.updatedCharacters.find((c) => c.id === "woundedAlly")?.hp,
      ).toBe(5);
      expect(
        result.updatedCharacters.find((c) => c.id === "heroicAlly")?.hp,
      ).toBe(90);
    });

    it("should generate DamageEvent with actual target hit", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 10, 1),
      });
      const actualTarget = createCharacter({
        id: "actualTarget",
        position: { q: 1, r: 0 },
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, actualTarget], 1);

      const damageEvent = result.events.find((e) => e.type === "damage");
      expect(damageEvent).toBeDefined();
      expect(damageEvent).toMatchObject({
        targetId: "actualTarget",
      });
    });

    it("should hit self if attacker moves into own target cell", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 2, r: 2 }, // Now at target cell
        slotPosition: 1,
        hp: 100,
        currentAction: createAttackAction({ q: 2, r: 2 }, null, 10, 1),
      });

      const result = resolveCombat([attacker], 1);

      expect(
        result.updatedCharacters.find((c) => c.id === "attacker")?.hp,
      ).toBe(90);
    });
  });
});
