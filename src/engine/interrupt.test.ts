/**
 * Unit tests for resolveInterrupts function.
 * Validates interrupt action resolution, miss conditions, and ordering.
 *
 * Phase 7: Kick/Interrupt
 * Integration tests are in interrupt-integration.test.ts
 */

import { describe, it, expect } from "vitest";
import { resolveInterrupts } from "./interrupt";
import {
  createCharacter,
  createSkill,
  createAttackAction,
} from "./game-test-helpers";

describe("resolveInterrupts", () => {
  // =========================================================================
  // Helper: Create an interrupt action
  // =========================================================================
  function createInterruptAction(
    targetCell: { q: number; r: number },
    resolveTick: number,
  ) {
    return {
      type: "interrupt" as const,
      skill: createSkill({
        id: "test-interrupt",
        instanceId: "test-interrupt",
        actionType: "interrupt" as "attack",
        tickCost: 0,
        range: 1,
      }),
      targetCell,
      targetCharacter: null,
      startedAtTick: resolveTick,
      resolvesAtTick: resolveTick,
    };
  }

  it("interrupt-cancels-channeling-action", () => {
    const interrupter = createCharacter({
      id: "kicker",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createInterruptAction({ q: 1, r: 0 }, 1),
    });
    const target = createCharacter({
      id: "channeler",
      faction: "enemy",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: {
        type: "attack" as const,
        skill: createSkill({
          id: "heavy-punch",
          instanceId: "heavy-punch",
          damage: 25,
          tickCost: 2,
        }),
        targetCell: { q: 0, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    });

    const result = resolveInterrupts([interrupter, target], 1);

    expect(
      result.updatedCharacters.find((c) => c.id === "channeler")?.currentAction,
    ).toBeNull();
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      type: "interrupt",
      tick: 1,
      sourceId: "kicker",
      targetId: "channeler",
      cancelledSkillId: "heavy-punch",
    });
  });

  it("interrupt-cooldown-not-reset-on-cancelled-action", () => {
    const channeledSkill = createSkill({
      id: "heavy-punch",
      instanceId: "heavy-punch-inst",
      damage: 25,
      tickCost: 2,
      cooldownRemaining: 3,
    });

    const interrupter = createCharacter({
      id: "kicker",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createInterruptAction({ q: 1, r: 0 }, 1),
    });
    const target = createCharacter({
      id: "channeler",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      skills: [channeledSkill],
      currentAction: {
        type: "attack" as const,
        skill: channeledSkill,
        targetCell: { q: 0, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 3,
      },
    });

    const result = resolveInterrupts([interrupter, target], 1);

    expect(
      result.updatedCharacters.find((c) => c.id === "channeler")?.currentAction,
    ).toBeNull();
    const updatedChanneler = result.updatedCharacters.find(
      (c) => c.id === "channeler",
    );
    expect(updatedChanneler?.skills[0]!.cooldownRemaining).toBe(3);
  });

  it("interrupt-miss-target-idle", () => {
    const interrupter = createCharacter({
      id: "kicker",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createInterruptAction({ q: 1, r: 0 }, 1),
    });
    const target = createCharacter({
      id: "idler",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: null,
    });

    const result = resolveInterrupts([interrupter, target], 1);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      type: "interrupt_miss",
      tick: 1,
      sourceId: "kicker",
      targetCell: { q: 1, r: 0 },
      reason: "target_idle",
    });
    expect(
      result.updatedCharacters.find((c) => c.id === "idler")?.currentAction,
    ).toBeNull();
  });

  it("interrupt-miss-empty-cell", () => {
    const interrupter = createCharacter({
      id: "kicker",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createInterruptAction({ q: 1, r: 0 }, 1),
    });
    const target = createCharacter({
      id: "moved-away",
      position: { q: 2, r: 0 },
      slotPosition: 1,
    });

    const result = resolveInterrupts([interrupter, target], 1);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      type: "interrupt_miss",
      tick: 1,
      sourceId: "kicker",
      targetCell: { q: 1, r: 0 },
      reason: "empty_cell",
    });
  });

  it("interrupt-instant-tickcost-zero", () => {
    const interrupter = createCharacter({
      id: "kicker",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createInterruptAction({ q: 1, r: 0 }, 5),
    });
    const target = createCharacter({
      id: "channeler",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: {
        type: "attack" as const,
        skill: createSkill({
          id: "attack",
          instanceId: "attack",
          damage: 10,
          tickCost: 1,
        }),
        targetCell: { q: 0, r: 0 },
        targetCharacter: null,
        startedAtTick: 5,
        resolvesAtTick: 7,
      },
    });

    const result = resolveInterrupts([interrupter, target], 5);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ type: "interrupt" });
    expect(
      result.updatedCharacters.find((c) => c.id === "channeler")?.currentAction,
    ).toBeNull();
  });

  it("interrupt-ignores-non-resolving-actions", () => {
    const interrupter = createCharacter({
      id: "kicker",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        ...createInterruptAction({ q: 1, r: 0 }, 3),
        startedAtTick: 3,
        resolvesAtTick: 3,
      },
    });
    const target = createCharacter({
      id: "channeler",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ q: 0, r: 0 }, 10, 5),
    });

    // Call at tick 2, before resolution tick 3
    const result = resolveInterrupts([interrupter, target], 2);

    expect(result.events).toHaveLength(0);
    expect(
      result.updatedCharacters.find((c) => c.id === "channeler")?.currentAction,
    ).not.toBeNull();
  });

  it("interrupt-ignores-non-interrupt-actions", () => {
    const attacker = createCharacter({
      id: "attacker",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createAttackAction({ q: 1, r: 0 }, 10, 1),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ q: 0, r: 0 }, 10, 3),
    });

    const result = resolveInterrupts([attacker, target], 1);

    expect(result.events).toHaveLength(0);
    expect(
      result.updatedCharacters.find((c) => c.id === "target")?.currentAction,
    ).not.toBeNull();
  });

  it("interrupt-multiple-same-tick-slotposition-ordering", () => {
    const kicker1 = createCharacter({
      id: "kicker1",
      position: { q: -1, r: 0 },
      slotPosition: 0,
      currentAction: createInterruptAction({ q: 1, r: 0 }, 1),
    });
    const kicker2 = createCharacter({
      id: "kicker2",
      position: { q: 2, r: 0 },
      slotPosition: 2,
      currentAction: createInterruptAction({ q: 1, r: 0 }, 1),
    });
    const channeler = createCharacter({
      id: "channeler",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: {
        type: "attack" as const,
        skill: createSkill({
          id: "attack",
          instanceId: "attack",
          damage: 10,
          tickCost: 1,
        }),
        targetCell: { q: 0, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 3,
      },
    });

    const result = resolveInterrupts([kicker1, kicker2, channeler], 1);

    expect(result.events).toHaveLength(2);
    expect(result.events[0]).toMatchObject({
      type: "interrupt",
      sourceId: "kicker1",
    });
    expect(result.events[1]).toMatchObject({
      type: "interrupt_miss",
      sourceId: "kicker2",
      reason: "target_idle",
    });
    expect(
      result.updatedCharacters.find((c) => c.id === "channeler")?.currentAction,
    ).toBeNull();
  });

  it("interrupt-does-not-modify-interrupter-action", () => {
    const interrupter = createCharacter({
      id: "kicker",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createInterruptAction({ q: 1, r: 0 }, 1),
    });
    const target = createCharacter({
      id: "channeler",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ q: 0, r: 0 }, 10, 3),
    });

    const result = resolveInterrupts([interrupter, target], 1);

    expect(
      result.updatedCharacters.find((c) => c.id === "kicker")?.currentAction,
    ).toBeDefined();
    expect(
      result.updatedCharacters.find((c) => c.id === "kicker")?.currentAction,
    ).not.toBeNull();
  });

  it("interrupt-returns-shallow-copies", () => {
    const interrupter = createCharacter({
      id: "kicker",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createInterruptAction({ q: 1, r: 0 }, 1),
    });
    const target = createCharacter({
      id: "channeler",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ q: 0, r: 0 }, 10, 3),
    });

    const originalTarget = target;
    const originalAction = target.currentAction;

    const result = resolveInterrupts([interrupter, target], 1);

    const updatedTarget = result.updatedCharacters.find(
      (c) => c.id === "channeler",
    );
    expect(updatedTarget).not.toBe(originalTarget);
    expect(originalAction).not.toBeNull();
    expect(originalTarget.currentAction).not.toBeNull();
  });
});
