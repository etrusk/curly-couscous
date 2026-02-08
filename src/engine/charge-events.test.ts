/**
 * Unit tests for resolveCharges function - event emission, edge cases, and ordering.
 * Validates DamageEvent, DeathEvent, miss handling, multi-charger ordering,
 * shallow copies, and non-charge action filtering.
 *
 * Phase 8: Charge
 * Movement and basic damage tests in charge.test.ts
 * Integration tests in charge-integration.test.ts
 */

import { describe, it, expect } from "vitest";
import { resolveCharges } from "./charge";
import {
  createCharacter,
  createSkill,
  createAttackAction,
  initRNG,
} from "./game-test-helpers";

describe("resolveCharges - events and edge cases", () => {
  // =========================================================================
  // Helper: Create a charge action
  // =========================================================================
  function createChargeAction(
    targetCell: { q: number; r: number },
    damage: number,
    resolveTick: number,
  ) {
    return {
      type: "charge" as const,
      skill: createSkill({
        id: "test-charge",
        instanceId: "test-charge",
        actionType: "charge" as "attack",
        damage,
        distance: 3,
        tickCost: 1,
        range: 3,
      }),
      targetCell,
      targetCharacter: null,
      startedAtTick: resolveTick - 1,
      resolvesAtTick: resolveTick,
    };
  }

  const rngState = initRNG(1000);

  it("charge-emits-damage-event-for-display-hooks", () => {
    const charger = createCharacter({
      id: "charger",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 2, r: 0 }, 20, 2),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 2, r: 0 },
      hp: 100,
      slotPosition: 1,
    });

    const result = resolveCharges([charger, target], 2, rngState);

    const damageEvents = result.events.filter((e) => e.type === "damage");
    expect(damageEvents.length).toBeGreaterThanOrEqual(1);
    expect(damageEvents).toContainEqual(
      expect.objectContaining({
        type: "damage",
        sourceId: "charger",
        targetId: "target",
        damage: 20,
        resultingHp: 80,
      }),
    );

    const chargeEvents = result.events.filter((e) => e.type === "charge");
    expect(chargeEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("charge-emits-death-event-when-killing-target", () => {
    const charger = createCharacter({
      id: "charger",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 2, r: 0 }, 20, 2),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 2, r: 0 },
      hp: 15,
      slotPosition: 1,
    });

    const result = resolveCharges([charger, target], 2, rngState);

    const updatedTarget = result.updatedCharacters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(-5);

    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "death",
        tick: 2,
        characterId: "target",
      }),
    );

    const damageIndex = result.events.findIndex(
      (e) => e.type === "damage" && "targetId" in e && e.targetId === "target",
    );
    const deathIndex = result.events.findIndex(
      (e) =>
        e.type === "death" && "characterId" in e && e.characterId === "target",
    );
    expect(deathIndex).toBeGreaterThan(damageIndex);
  });

  it("charge-miss-target-moved-away", () => {
    const charger = createCharacter({
      id: "charger",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 3, r: 0 }, 20, 2),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 5, r: 0 },
      hp: 100,
      slotPosition: 1,
    });

    const result = resolveCharges([charger, target], 2, rngState);

    const updatedTarget = result.updatedCharacters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(100);

    const chargeEvents = result.events.filter((e) => e.type === "charge");
    expect(chargeEvents.length).toBeGreaterThanOrEqual(1);
    const chargeEvent = chargeEvents[0]!;
    expect(chargeEvent).toMatchObject({ type: "charge" });
    expect(
      "targetId" in chargeEvent ? chargeEvent.targetId : undefined,
    ).toBeUndefined();

    const updatedCharger = result.updatedCharacters.find(
      (c) => c.id === "charger",
    );
    expect(updatedCharger?.position).not.toEqual({ q: 0, r: 0 });
  });

  it("charge-multiple-chargers-slotposition-ordering", () => {
    const charger1 = createCharacter({
      id: "charger1",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 3, r: 0 }, 20, 2),
    });
    const charger2 = createCharacter({
      id: "charger2",
      position: { q: 0, r: -3 },
      slotPosition: 2,
      currentAction: createChargeAction({ q: 3, r: 0 }, 20, 2),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 3, r: 0 },
      hp: 100,
      slotPosition: 1,
    });

    const result = resolveCharges([charger1, charger2, target], 2, rngState);

    const chargeEvents = result.events.filter((e) => e.type === "charge");
    expect(chargeEvents.length).toBeGreaterThanOrEqual(2);

    const charger1EventIndex = result.events.findIndex(
      (e) =>
        e.type === "charge" && "sourceId" in e && e.sourceId === "charger1",
    );
    const charger2EventIndex = result.events.findIndex(
      (e) =>
        e.type === "charge" && "sourceId" in e && e.sourceId === "charger2",
    );
    expect(charger1EventIndex).toBeLessThan(charger2EventIndex);
  });

  it("charge-returns-shallow-copies", () => {
    const charger = createCharacter({
      id: "charger",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 2, r: 0 }, 20, 2),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 2, r: 0 },
      hp: 100,
      slotPosition: 1,
    });

    const originalTarget = target;
    const originalCharger = charger;

    const result = resolveCharges([charger, target], 2, rngState);

    const updatedTarget = result.updatedCharacters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget).not.toBe(originalTarget);
    expect(originalTarget.hp).toBe(100);
    expect(originalCharger.position).toEqual({ q: 0, r: 0 });
  });

  it("charge-ignores-non-charge-actions", () => {
    const attacker = createCharacter({
      id: "attacker",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createAttackAction({ q: 1, r: 0 }, 10, 2),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 1, r: 0 },
      hp: 100,
      slotPosition: 1,
    });

    const result = resolveCharges([attacker, target], 2, rngState);

    expect(result.events.filter((e) => e.type === "charge")).toHaveLength(0);
    const updatedTarget = result.updatedCharacters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(100);
    const updatedAttacker = result.updatedCharacters.find(
      (c) => c.id === "attacker",
    );
    expect(updatedAttacker?.position).toEqual({ q: 0, r: 0 });
  });
});
