/**
 * Unit tests for resolveHealing function.
 * Validates heal action resolution, HP capping, event generation, and cell-based targeting.
 */

import { describe, it, expect } from "vitest";
import { resolveHealing } from "./healing";
import { createCharacter, createSkill } from "./game-test-helpers";
import type { HealEvent } from "./types";

describe("resolveHealing", () => {
  it("heal-basic-hit", () => {
    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      faction: "friendly",
      position: { q: 1, r: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      75,
    );
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toEqual({
      type: "heal",
      tick: 0,
      sourceId: "healer",
      targetId: "target",
      healing: 25,
      resultingHp: 75,
    });
  });

  it("heal-capped-at-maxHp", () => {
    const healer = createCharacter({
      id: "healer",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 1, r: 0 },
      hp: 90,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      100,
    );
    expect((result.events[0] as HealEvent).resultingHp).toBe(100);
  });

  it("heal-generates-HealEvent", () => {
    const healer = createCharacter({
      id: "healer-a",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
        targetCell: { q: 2, r: 0 },
        targetCharacter: null,
        startedAtTick: 3,
        resolvesAtTick: 3,
      },
    });
    const target = createCharacter({
      id: "target-b",
      position: { q: 2, r: 0 },
      hp: 60,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 3);

    expect(result.events[0]).toEqual({
      type: "heal",
      tick: 3,
      sourceId: "healer-a",
      targetId: "target-b",
      healing: 25,
      resultingHp: 85,
    });
  });

  it("heal-wind-up-timing", () => {
    const healer = createCharacter({
      id: "healer",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 2 }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 5,
        resolvesAtTick: 7,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 1, r: 0 },
      hp: 75,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 7);

    expect(result.events).toHaveLength(1);
    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      100,
    );
  });

  it("heal-miss-target-moved", () => {
    const healer = createCharacter({
      id: "healer",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
        targetCell: { q: 3, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 4, r: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      50,
    );
    // After WhiffEvent implementation, events will have length 1 (the WhiffEvent)
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      type: "whiff",
      actionType: "heal",
      targetCell: { q: 3, r: 0 },
    });
  });

  it("heal-multiple-healers-same-target", () => {
    const healer1 = createCharacter({
      id: "healer1",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal1", healing: 25, tickCost: 0 }),
        targetCell: { q: 2, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const healer2 = createCharacter({
      id: "healer2",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal2", healing: 25, tickCost: 0 }),
        targetCell: { q: 2, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 2, r: 0 },
      hp: 40,
      maxHp: 100,
      slotPosition: 2,
    });

    const result = resolveHealing([healer1, healer2, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      90,
    );
    expect(result.events).toHaveLength(2);
  });

  it("heal-multiple-healers-hp-cap", () => {
    const healer1 = createCharacter({
      id: "healer1",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal1", healing: 25, tickCost: 0 }),
        targetCell: { q: 2, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const healer2 = createCharacter({
      id: "healer2",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal2", healing: 25, tickCost: 0 }),
        targetCell: { q: 2, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 2, r: 0 },
      hp: 80,
      maxHp: 100,
      slotPosition: 2,
    });

    const result = resolveHealing([healer1, healer2, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      100,
    );
    expect((result.events[0] as HealEvent).resultingHp).toBe(100);
    expect((result.events[1] as HealEvent).resultingHp).toBe(100);
  });

  it("heal-ignores-non-resolving-actions", () => {
    const healer = createCharacter({
      id: "healer",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 1 }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 2,
        resolvesAtTick: 3,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 1, r: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 2);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      50,
    );
    expect(result.events).toHaveLength(0);
  });

  it("heal-ignores-attack-actions", () => {
    const attacker = createCharacter({
      id: "attacker",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "attack",
        skill: createSkill({ id: "attack", damage: 25, tickCost: 0 }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 1, r: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([attacker, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      50,
    );
    expect(result.events).toHaveLength(0);
  });

  // =========================================================================
  // WhiffEvent Emission from Healing
  // =========================================================================
  describe("whiff event emission", () => {
    it("should emit WhiffEvent when heal target cell is empty", () => {
      const healer = createCharacter({
        id: "healer",
        position: { q: 0, r: 0 },
        slotPosition: 0,
        currentAction: {
          type: "heal",
          skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
          targetCell: { q: 3, r: 0 },
          targetCharacter: null,
          startedAtTick: 0,
          resolvesAtTick: 0,
        },
      });
      const target = createCharacter({
        id: "target",
        position: { q: 4, r: 0 },
        hp: 50,
        maxHp: 100,
        slotPosition: 1,
      });

      const result = resolveHealing([healer, target], 0);

      const whiffEvents = result.events.filter((e) => e.type === "whiff");
      expect(whiffEvents).toHaveLength(1);
      expect(whiffEvents[0]).toMatchObject({
        actionType: "heal",
        targetCell: { q: 3, r: 0 },
      });
    });

    it("should have correct fields on healing WhiffEvent", () => {
      const healer = createCharacter({
        id: "healer-a",
        position: { q: 0, r: 0 },
        slotPosition: 0,
        currentAction: {
          type: "heal",
          skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
          targetCell: { q: 3, r: 0 },
          targetCharacter: null,
          startedAtTick: 3,
          resolvesAtTick: 3,
        },
      });
      const target = createCharacter({
        id: "target",
        position: { q: 4, r: 0 },
        hp: 50,
        maxHp: 100,
        slotPosition: 1,
      });

      const result = resolveHealing([healer, target], 3);

      const whiffEvents = result.events.filter((e) => e.type === "whiff");
      expect(whiffEvents).toHaveLength(1);
      expect(whiffEvents[0]).toEqual({
        type: "whiff",
        tick: 3,
        sourceId: "healer-a",
        actionType: "heal",
        targetCell: { q: 3, r: 0 },
      });
    });

    it("should not emit WhiffEvent when heal hits target", () => {
      const healer = createCharacter({
        id: "healer",
        position: { q: 0, r: 0 },
        slotPosition: 0,
        currentAction: {
          type: "heal",
          skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
          targetCell: { q: 1, r: 0 },
          targetCharacter: null,
          startedAtTick: 0,
          resolvesAtTick: 0,
        },
      });
      const target = createCharacter({
        id: "target",
        position: { q: 1, r: 0 },
        hp: 50,
        maxHp: 100,
        slotPosition: 1,
      });

      const result = resolveHealing([healer, target], 0);

      const whiffEvents = result.events.filter((e) => e.type === "whiff");
      expect(whiffEvents).toHaveLength(0);

      const healEvents = result.events.filter((e) => e.type === "heal");
      expect(healEvents).toHaveLength(1);
    });
  });
});
