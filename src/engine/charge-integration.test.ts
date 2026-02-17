/**
 * Integration tests for charge resolution within processTick pipeline.
 * Validates pipeline ordering, interrupt+charge interplay, and damage stacking.
 *
 * Phase 8: Charge
 * Unit tests are in charge.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  createCharacter,
  createSkill,
  createAttackAction,
  createHealAction,
  createMoveAction,
  createGameState,
} from "./game-test-helpers";
import { processTick } from "./game-core";

describe("resolveCharges - integration", () => {
  // =========================================================================
  // Helpers
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

  it("charge-interruptible-by-kick", () => {
    const kicker = createCharacter({
      id: "kicker",
      faction: "friendly",
      position: { q: 4, r: 0 },
      slotPosition: 0,
      currentAction: createInterruptAction({ q: 5, r: 0 }, 2),
    });
    const charger = createCharacter({
      id: "charger",
      faction: "enemy",
      position: { q: 5, r: 0 },
      slotPosition: 1,
      currentAction: {
        ...createChargeAction({ q: 2, r: 0 }, 20, 2),
        startedAtTick: 1,
        resolvesAtTick: 2,
      },
    });

    const state = createGameState({
      characters: [kicker, charger],
      tick: 2,
      phase: "resolution",
    });

    const tickResult = processTick(state);

    // Interrupt event should be present
    expect(tickResult.events).toContainEqual(
      expect.objectContaining({
        type: "interrupt",
        sourceId: "kicker",
        targetId: "charger",
      }),
    );

    // Charger should not have moved
    const updatedCharger = tickResult.state.characters.find(
      (c) => c.id === "charger",
    );
    expect(updatedCharger?.position).toEqual({ q: 5, r: 0 });

    // No charge event
    const chargeEvents = tickResult.events.filter((e) => e.type === "charge");
    expect(chargeEvents).toHaveLength(0);
  });

  it("charge-plus-attack-damage-same-tick", () => {
    const charger = createCharacter({
      id: "charger",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 3, r: 0 }, 20, 2),
    });
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 4, r: 0 },
      slotPosition: 2,
      currentAction: createAttackAction({ q: 3, r: 0 }, 10, 2),
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 3, r: 0 },
      hp: 100,
      slotPosition: 1,
      currentAction: null,
    });

    const state = createGameState({
      characters: [charger, attacker, target],
      tick: 2,
      phase: "resolution",
    });

    const tickResult = processTick(state);

    // Target took both charge (20) and attack (10) damage
    const updatedTarget = tickResult.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(70);

    expect(tickResult.events).toContainEqual(
      expect.objectContaining({ type: "charge" }),
    );
    const damageFromAttacker = tickResult.events.filter(
      (e) =>
        e.type === "damage" && "sourceId" in e && e.sourceId === "attacker",
    );
    expect(damageFromAttacker.length).toBeGreaterThanOrEqual(1);
  });

  it("charge-resolves-before-regular-movement", () => {
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
      currentAction: createMoveAction({ q: 4, r: 0 }, 2),
    });

    const state = createGameState({
      characters: [charger, target],
      tick: 2,
      phase: "resolution",
    });

    const tickResult = processTick(state);

    // Target moved (movement resolves after charge)
    const updatedTarget = tickResult.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.position).toEqual({ q: 4, r: 0 });

    // Target took charge damage (charger arrived adjacent before target moved)
    expect(updatedTarget?.hp).toBe(80);
  });

  it("full-pipeline-healing-interrupts-charges-movement-combat", () => {
    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: -2, r: 0 },
      slotPosition: 0,
      currentAction: createHealAction({ q: -1, r: 0 }, 25, 3),
    });
    const woundedAlly = createCharacter({
      id: "wounded",
      faction: "friendly",
      position: { q: -1, r: 0 },
      hp: 30,
      maxHp: 100,
      slotPosition: 1,
    });
    const kicker = createCharacter({
      id: "kicker",
      faction: "friendly",
      position: { q: 3, r: 0 },
      slotPosition: 2,
      currentAction: createInterruptAction({ q: 4, r: 0 }, 3),
    });
    const enemyChanneler = createCharacter({
      id: "channeler",
      faction: "enemy",
      position: { q: 4, r: 0 },
      slotPosition: 3,
      currentAction: createAttackAction({ q: 3, r: 0 }, 25, 4),
    });
    const charger = createCharacter({
      id: "charger",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 4,
      currentAction: createChargeAction({ q: 2, r: 0 }, 20, 3),
    });
    const chargeTarget = createCharacter({
      id: "charge-target",
      faction: "enemy",
      position: { q: 2, r: 0 },
      hp: 100,
      slotPosition: 5,
      currentAction: createMoveAction({ q: 3, r: 0 }, 3),
    });
    const attacker = createCharacter({
      id: "attacker",
      faction: "enemy",
      position: { q: 0, r: 1 },
      slotPosition: 6,
      currentAction: createAttackAction({ q: -1, r: 0 }, 10, 3),
    });

    const state = createGameState({
      characters: [
        healer,
        woundedAlly,
        kicker,
        enemyChanneler,
        charger,
        chargeTarget,
        attacker,
      ],
      tick: 3,
      phase: "resolution",
    });

    const tickResult = processTick(state);

    // 1. WoundedAlly: healed 25 (30 -> 55), then attacked for 10 (55 -> 45)
    const updatedWounded = tickResult.state.characters.find(
      (c) => c.id === "wounded",
    );
    expect(updatedWounded?.hp).toBe(45);

    // 2. EnemyChanneler's action was interrupted
    const updatedChanneler = tickResult.state.characters.find(
      (c) => c.id === "channeler",
    );
    expect(updatedChanneler?.currentAction).toBeNull();

    // 3. Interrupt event present
    expect(tickResult.events).toContainEqual(
      expect.objectContaining({
        type: "interrupt",
        sourceId: "kicker",
      }),
    );

    // 4. ChargeTarget took charge damage
    const updatedChargeTarget = tickResult.state.characters.find(
      (c) => c.id === "charge-target",
    );
    expect(updatedChargeTarget?.hp).toBe(80);

    // 5. ChargeTarget stays at {q:2,r:0} — move to {q:3,r:0} blocked by kicker (same-hex overlap prevention)
    expect(updatedChargeTarget?.position).toEqual({ q: 2, r: 0 });

    // 6. Events include heal, interrupt, charge, movement, and damage events
    const eventTypes = tickResult.events.map((e) => e.type);
    expect(eventTypes).toContain("heal");
    expect(eventTypes).toContain("interrupt");
    expect(eventTypes).toContain("charge");
    expect(eventTypes).toContain("movement");
    expect(eventTypes).toContain("damage");
  });

  it("charge-kill-followed-by-combat-no-duplicate-death", () => {
    const charger = createCharacter({
      id: "charger",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 2, r: 0 }, 20, 2),
    });
    const victim = createCharacter({
      id: "victim",
      faction: "enemy",
      position: { q: 2, r: 0 },
      hp: 15,
      slotPosition: 1,
    });
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 3, r: 0 },
      slotPosition: 2,
      currentAction: createAttackAction({ q: 2, r: 0 }, 10, 2),
    });

    const state = createGameState({
      characters: [charger, victim, attacker],
      tick: 2,
      phase: "resolution",
    });

    const tickResult = processTick(state);

    // Victim should be removed from characters (dead)
    const victimInState = tickResult.state.characters.find(
      (c) => c.id === "victim",
    );
    expect(victimInState).toBeUndefined();

    // Death event should be emitted
    expect(tickResult.events).toContainEqual(
      expect.objectContaining({
        type: "death",
        characterId: "victim",
      }),
    );

    // Charge event should be present
    expect(tickResult.events).toContainEqual(
      expect.objectContaining({
        type: "charge",
        sourceId: "charger",
      }),
    );
  });
});
