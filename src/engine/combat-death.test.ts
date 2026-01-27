/**
 * Tests for death detection and death events.
 * Section 5 from original combat.test.ts
 */

import { describe, it, expect } from "vitest";
import { resolveCombat } from "./combat";
import {
  baseCreateCharacter as createCharacter,
  createAttackAction,
} from "./combat-test-helpers";

describe("resolveCombat", () => {
  // =========================================================================
  // Section 5: Death Detection
  // =========================================================================
  describe("death detection", () => {
    it("should generate DeathEvent when HP reaches exactly 0", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      const deathEvent = result.events.find((e) => e.type === "death");
      expect(deathEvent).toBeDefined();
      expect(deathEvent).toMatchObject({
        type: "death",
        characterId: "target",
      });
    });

    it("should generate DeathEvent when HP goes negative", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
        -15,
      );
      const deathEvent = result.events.find((e) => e.type === "death");
      expect(deathEvent).toBeDefined();
    });

    it("should include correct characterId in DeathEvent", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 100, 1),
      });
      const target = createCharacter({
        id: "char-1",
        position: { x: 1, y: 0 },
        hp: 50,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      const deathEvent = result.events.find((e) => e.type === "death");
      expect(deathEvent).toMatchObject({
        characterId: "char-1",
      });
    });

    it("should include correct tick in DeathEvent", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 100, 3),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 1, y: 0 },
        hp: 50,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 3);

      const deathEvent = result.events.find((e) => e.type === "death");
      expect(deathEvent?.tick).toBe(3);
    });

    it("should not generate DeathEvent when HP remains positive", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
        75,
      );
      const deathEvents = result.events.filter((e) => e.type === "death");
      expect(deathEvents).toHaveLength(0);
    });

    it("should generate DeathEvent after DamageEvent in events array", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 100, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 1, y: 0 },
        hp: 50,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      const damageEventIndex = result.events.findIndex(
        (e) => e.type === "damage",
      );
      const deathEventIndex = result.events.findIndex(
        (e) => e.type === "death",
      );
      expect(damageEventIndex).toBeGreaterThanOrEqual(0);
      expect(deathEventIndex).toBeGreaterThan(damageEventIndex);
    });

    it("should keep dead characters in returned array", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 100, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 1, y: 0 },
        hp: 50,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters).toHaveLength(2);
      const deadChar = result.updatedCharacters.find((c) => c.id === "target");
      expect(deadChar).toBeDefined();
      expect(deadChar!.hp).toBeLessThanOrEqual(0);
    });
  });
});
