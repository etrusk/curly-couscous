/**
 * Tests for death event deduplication in combat resolution.
 * Ensures resolveCombat only emits DeathEvents for characters
 * it actually killed (hp went from positive to non-positive),
 * not for characters already dead when combat began.
 */

import { describe, it, expect } from "vitest";
import { resolveCombat } from "./combat";
import {
  baseCreateCharacter as createCharacter,
  createAttackAction,
} from "./combat-test-helpers";

describe("resolveCombat", () => {
  describe("death deduplication - pre-dead characters", () => {
    it("no-death-event-for-pre-dead-character-without-attack", () => {
      const preDead = createCharacter({
        id: "pre-dead",
        position: { q: 5, r: 0 },
        hp: -5,
        slotPosition: 1,
      });
      const bystander = createCharacter({
        id: "bystander",
        position: { q: 0, r: 0 },
        slotPosition: 2,
      });

      const result = resolveCombat([preDead, bystander], 1);

      const deathEvents = result.events.filter((e) => e.type === "death");
      expect(deathEvents).toHaveLength(0);

      const updatedPreDead = result.updatedCharacters.find(
        (c) => c.id === "pre-dead",
      );
      expect(updatedPreDead).toBeDefined();
      expect(updatedPreDead!.hp).toBeLessThanOrEqual(0);
    });

    it("no-death-event-when-pre-dead-character-is-also-attacked", () => {
      const preDead = createCharacter({
        id: "pre-dead",
        position: { q: 1, r: 0 },
        hp: -5,
        slotPosition: 2,
      });
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 10, 1),
      });

      const result = resolveCombat([attacker, preDead], 1);

      const damageEvents = result.events.filter((e) => e.type === "damage");
      expect(damageEvents.length).toBeGreaterThanOrEqual(1);

      const deathEvents = result.events.filter((e) => e.type === "death");
      expect(deathEvents).toHaveLength(0);

      const updatedPreDead = result.updatedCharacters.find(
        (c) => c.id === "pre-dead",
      );
      expect(updatedPreDead!.hp).toBe(-15);
    });

    it("normal-combat-death-still-emits-death-event", () => {
      const target = createCharacter({
        id: "target",
        position: { q: 1, r: 0 },
        hp: 10,
        slotPosition: 2,
      });
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 1, r: 0 }, null, 25, 1),
      });

      const result = resolveCombat([attacker, target], 1);

      const updatedTarget = result.updatedCharacters.find(
        (c) => c.id === "target",
      );
      expect(updatedTarget!.hp).toBe(-15);

      const deathEvents = result.events.filter((e) => e.type === "death");
      expect(deathEvents).toHaveLength(1);
      expect(deathEvents[0]).toMatchObject({ characterId: "target" });

      const damageIndex = result.events.findIndex((e) => e.type === "damage");
      const deathIndex = result.events.findIndex((e) => e.type === "death");
      expect(damageIndex).toBeGreaterThanOrEqual(0);
      expect(deathIndex).toBeGreaterThan(damageIndex);
    });

    it("mixed-scenario-only-combat-kill-gets-death-event", () => {
      const preDeadA = createCharacter({
        id: "pre-dead-a",
        position: { q: 1, r: 0 },
        hp: -5,
        slotPosition: 1,
      });
      const preDeadB = createCharacter({
        id: "pre-dead-b",
        position: { q: 2, r: 0 },
        hp: -10,
        slotPosition: 2,
      });
      const aliveTarget = createCharacter({
        id: "alive-target",
        position: { q: 3, r: 0 },
        hp: 15,
        slotPosition: 3,
      });
      const attacker = createCharacter({
        id: "attacker",
        position: { q: 0, r: 0 },
        slotPosition: 4,
        currentAction: createAttackAction({ q: 3, r: 0 }, null, 25, 1),
      });

      const result = resolveCombat(
        [preDeadA, preDeadB, aliveTarget, attacker],
        1,
      );

      const deathEvents = result.events.filter((e) => e.type === "death");
      expect(deathEvents).toHaveLength(1);
      expect(deathEvents[0]).toMatchObject({ characterId: "alive-target" });

      const updatedA = result.updatedCharacters.find(
        (c) => c.id === "pre-dead-a",
      );
      const updatedB = result.updatedCharacters.find(
        (c) => c.id === "pre-dead-b",
      );
      expect(updatedA!.hp).toBeLessThanOrEqual(0);
      expect(updatedB!.hp).toBeLessThanOrEqual(0);

      const updatedAlive = result.updatedCharacters.find(
        (c) => c.id === "alive-target",
      );
      expect(updatedAlive!.hp).toBe(-10);
    });
  });
});
