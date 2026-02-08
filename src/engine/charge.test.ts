/**
 * Unit tests for resolveCharges function - movement and basic damage.
 * Validates charge movement, blocking, adjacency, timing, and damage separation.
 *
 * Phase 8: Charge
 * Event emission tests in charge-events.test.ts
 * Integration tests in charge-integration.test.ts
 */

import { describe, it, expect } from "vitest";
import { resolveCharges } from "./charge";
import { createCharacter, createSkill, initRNG } from "./game-test-helpers";

describe("resolveCharges", () => {
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

  it("charge-moves-and-attacks-adjacent-target", () => {
    const charger = createCharacter({
      id: "charger",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 3, r: 0 }, 20, 2),
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 3, r: 0 },
      hp: 100,
      slotPosition: 1,
    });

    const result = resolveCharges([charger, target], 2, rngState);

    const updatedCharger = result.updatedCharacters.find(
      (c) => c.id === "charger",
    );
    expect(updatedCharger?.position).toEqual({ q: 2, r: 0 });

    const updatedTarget = result.updatedCharacters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(80);

    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "charge",
        sourceId: "charger",
        fromPosition: { q: 0, r: 0 },
        toPosition: { q: 2, r: 0 },
        targetId: "target",
        damage: 20,
        resultingHp: 80,
      }),
    );
  });

  it("charge-partial-movement-blocked-second-step", () => {
    const charger = createCharacter({
      id: "charger",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 4, r: 0 }, 20, 2),
    });
    const blocker = createCharacter({
      id: "blocker",
      position: { q: 2, r: 0 },
      slotPosition: 1,
    });
    const target = createCharacter({
      id: "target",
      position: { q: 4, r: 0 },
      hp: 100,
      slotPosition: 2,
    });

    const result = resolveCharges([charger, blocker, target], 2, rngState);

    const updatedCharger = result.updatedCharacters.find(
      (c) => c.id === "charger",
    );
    expect(updatedCharger?.position).toEqual({ q: 1, r: 0 });

    const updatedTarget = result.updatedCharacters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(100);

    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "charge",
        fromPosition: { q: 0, r: 0 },
        toPosition: { q: 1, r: 0 },
      }),
    );
  });

  it("charge-fully-blocked-no-movement", () => {
    const charger = createCharacter({
      id: "charger",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 3, r: 0 }, 20, 2),
    });
    const b1 = createCharacter({
      id: "b1",
      position: { q: 1, r: 0 },
      slotPosition: 1,
    });
    const b2 = createCharacter({
      id: "b2",
      position: { q: 0, r: 1 },
      slotPosition: 2,
    });
    const b3 = createCharacter({
      id: "b3",
      position: { q: 1, r: -1 },
      slotPosition: 3,
    });
    const b4 = createCharacter({
      id: "b4",
      position: { q: -1, r: 1 },
      slotPosition: 4,
    });
    const b5 = createCharacter({
      id: "b5",
      position: { q: -1, r: 0 },
      slotPosition: 5,
    });
    const b6 = createCharacter({
      id: "b6",
      position: { q: 0, r: -1 },
      slotPosition: 6,
    });
    const target = createCharacter({
      id: "target",
      position: { q: 3, r: 0 },
      hp: 100,
      slotPosition: 7,
    });

    const result = resolveCharges(
      [charger, b1, b2, b3, b4, b5, b6, target],
      2,
      rngState,
    );

    const updatedCharger = result.updatedCharacters.find(
      (c) => c.id === "charger",
    );
    expect(updatedCharger?.position).toEqual({ q: 0, r: 0 });

    const updatedTarget = result.updatedCharacters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(100);

    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "charge",
        fromPosition: { q: 0, r: 0 },
        toPosition: { q: 0, r: 0 },
      }),
    );
  });

  it("charge-already-adjacent-attacks-without-moving", () => {
    const charger = createCharacter({
      id: "charger",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 1, r: 0 }, 20, 2),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 1, r: 0 },
      hp: 100,
      slotPosition: 1,
    });

    const result = resolveCharges([charger, target], 2, rngState);

    const updatedTarget = result.updatedCharacters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(80);

    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "charge",
        targetId: "target",
        damage: 20,
      }),
    );
  });

  it("charge-dodgeable-tickcost-one", () => {
    const charger = createCharacter({
      id: "charger",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        ...createChargeAction({ q: 3, r: 0 }, 20, 2),
        startedAtTick: 1,
        resolvesAtTick: 2,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 3, r: 0 },
      hp: 100,
      slotPosition: 1,
    });

    const resultTick1 = resolveCharges([charger, target], 1, rngState);
    expect(resultTick1.events.filter((e) => e.type === "charge")).toHaveLength(
      0,
    );

    const resultTick2 = resolveCharges([charger, target], 2, rngState);
    expect(resultTick2.events.filter((e) => e.type === "charge")).toHaveLength(
      1,
    );
  });

  it("charge-damage-separate-from-combat", () => {
    const charger = createCharacter({
      id: "charger",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 3, r: 0 }, 20, 2),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 3, r: 0 },
      hp: 100,
      slotPosition: 1,
    });

    const result = resolveCharges([charger, target], 2, rngState);

    const updatedTarget = result.updatedCharacters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(80);

    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "damage",
        sourceId: "charger",
        targetId: "target",
        damage: 20,
        resultingHp: 80,
      }),
    );

    expect(result.events).toContainEqual(
      expect.objectContaining({ type: "charge" }),
    );
  });

  it("charge-emits-charge-event-with-correct-fields", () => {
    const charger = createCharacter({
      id: "charger",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 3, r: 0 }, 20, 2),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 3, r: 0 },
      hp: 100,
      slotPosition: 1,
    });

    const result = resolveCharges([charger, target], 2, rngState);

    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "charge",
        tick: 2,
        sourceId: "charger",
        fromPosition: { q: 0, r: 0 },
        toPosition: expect.any(Object) as unknown,
        targetId: "target",
        damage: 20,
        resultingHp: 80,
      }),
    );
  });
});
