/**
 * Integration tests for interrupt resolution within processTick pipeline.
 * Validates pipeline ordering and decision-phase filter interaction.
 *
 * Phase 7: Kick/Interrupt
 * Unit tests are in interrupt.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  createCharacter,
  createSkill,
  createMoveAction,
  createGameState,
} from "./game-test-helpers";
import { processTick } from "./game-core";
import { computeDecisions } from "./game-decisions";

describe("resolveInterrupts - integration", () => {
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

  it("interrupt-resolution-order-before-movement-and-combat", () => {
    const kicker = createCharacter({
      id: "kicker",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createInterruptAction({ q: 1, r: 0 }, 1),
    });
    const mover = createCharacter({
      id: "mover",
      faction: "enemy",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: createMoveAction({ q: 2, r: 0 }, 1),
    });

    const state = createGameState({
      characters: [kicker, mover],
      tick: 1,
      phase: "resolution",
    });

    const tickResult = processTick(state);

    // Mover's position should remain unchanged -- move was cancelled by interrupt
    const updatedMover = tickResult.state.characters.find(
      (c) => c.id === "mover",
    );
    expect(updatedMover?.position).toEqual({ q: 1, r: 0 });

    // Events should include an interrupt event
    expect(tickResult.events).toContainEqual(
      expect.objectContaining({
        type: "interrupt",
        sourceId: "kicker",
        targetId: "mover",
      }),
    );

    // Events should NOT include a movement event for mover
    const movementEvents = tickResult.events.filter(
      (e) =>
        e.type === "movement" &&
        "characterId" in e &&
        e.characterId === "mover",
    );
    expect(movementEvents).toHaveLength(0);
  });

  it("interrupt-with-channeling-filter-prevents-wasting", () => {
    const kickSkill = createSkill({
      id: "kick",
      instanceId: "kick-inst",
      actionType: "interrupt" as "attack",
      tickCost: 0,
      range: 1,
      damage: 0,
      trigger: { scope: "enemy", condition: "channeling" },
      filter: { condition: "channeling" },
    });
    const kicker = createCharacter({
      id: "kicker",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      skills: [kickSkill],
      currentAction: null,
    });
    const idleEnemy = createCharacter({
      id: "idle-enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: null,
      skills: [
        createSkill({
          id: "light-punch",
          instanceId: "lp-inst",
          damage: 10,
          tickCost: 1,
          range: 1,
        }),
      ],
    });

    const state = createGameState({
      characters: [kicker, idleEnemy],
      tick: 1,
      phase: "decision",
    });

    const decisions = computeDecisions(state);

    // Kicker should idle because the channeling filter eliminates the idle target
    const kickerDecision = decisions.find((d) => d.characterId === "kicker");
    expect(kickerDecision?.action.type).toBe("idle");
  });
});
