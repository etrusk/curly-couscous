/**
 * Regression tests for same-hex overlap between charge and movement resolution.
 * Bug: resolvedCharacterIds excluded chargers from blocker checks, allowing
 * movers to land on the same hex as a post-charge character.
 */

import { describe, it, expect } from "vitest";
import {
  createCharacter,
  createSkill,
  createGameState,
} from "./game-test-helpers";
import { processTick } from "./game-core";
import { Character } from "./types";

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

function createMoveAction(
  targetCell: { q: number; r: number },
  resolveTick: number,
) {
  return {
    type: "move" as const,
    skill: createSkill({
      id: "test-move",
      instanceId: "test-move",
      behavior: "towards",
      tickCost: 1,
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

/** Assert no two living characters share a hex. */
function assertNoOverlap(characters: Character[]) {
  const positions = new Map<string, string>();
  for (const c of characters) {
    if (c.hp <= 0) continue;
    const key = `${c.position.q},${c.position.r}`;
    const existing = positions.get(key);
    if (existing) {
      throw new Error(
        `Overlap: ${existing} and ${c.id} both at (${c.position.q}, ${c.position.r})`,
      );
    }
    positions.set(key, c.id);
  }
}

describe("charge-movement overlap prevention", () => {
  it("mover-blocked-by-charger-at-post-charge-position", () => {
    // Charger at (-2,0) charges toward enemy at (2,0) with clear path.
    // Charger moves 3 steps: (-2,0) → (-1,0) → (0,0) → (1,0), adjacent to target.
    // Mover at (0,-1) has pre-computed destination of (1,0) (empty at decision time).
    // Mover should be blocked because charger is now at (1,0).
    const charger = createCharacter({
      id: "charger",
      faction: "friendly",
      position: { q: -2, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 2, r: 0 }, 20, 2),
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: -1 },
      slotPosition: 1,
      currentAction: createMoveAction({ q: 1, r: 0 }, 2),
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
      hp: 100,
      slotPosition: 2,
    });

    const state = createGameState({
      characters: [charger, mover, enemy],
      tick: 2,
      phase: "resolution",
    });

    const result = processTick(state);

    assertNoOverlap(result.state.characters);

    // Charger should be at (1,0) after charge (adjacent to enemy at (2,0))
    const updatedCharger = result.state.characters.find(
      (c) => c.id === "charger",
    );
    expect(updatedCharger?.position).toEqual({ q: 1, r: 0 });

    // Mover should NOT be at (1,0) — should stay at (0,-1) due to blocker
    const updatedMover = result.state.characters.find((c) => c.id === "mover");
    expect(updatedMover?.position).toEqual({ q: 0, r: -1 });
  });

  it("dash-blocked-by-charger-at-post-charge-position", () => {
    // Simulates the reported bug: Dash + Charge landing on the same hex.
    // Charger at (-1,0) charges toward enemy at (2,0), ends at (1,0).
    // Dasher has pre-computed destination of (1,0) (2-step dash).
    // Dasher should be blocked.
    const charger = createCharacter({
      id: "charger",
      faction: "friendly",
      position: { q: -1, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 2, r: 0 }, 20, 2),
    });
    const dasher = createCharacter({
      id: "dasher",
      faction: "friendly",
      position: { q: -1, r: 1 },
      slotPosition: 1,
      currentAction: {
        type: "move" as const,
        skill: createSkill({
          id: "dash",
          instanceId: "dash-1",
          actionType: "move" as "attack",
          behavior: "towards",
          tickCost: 0,
          distance: 2,
          range: 1,
        }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 2,
        resolvesAtTick: 2,
      },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
      hp: 100,
      slotPosition: 2,
    });

    const state = createGameState({
      characters: [charger, dasher, enemy],
      tick: 2,
      phase: "resolution",
    });

    const result = processTick(state);

    assertNoOverlap(result.state.characters);

    // Charger should be at (1,0)
    const updatedCharger = result.state.characters.find(
      (c) => c.id === "charger",
    );
    expect(updatedCharger?.position).toEqual({ q: 1, r: 0 });

    // Dasher should NOT be at (1,0)
    const updatedDasher = result.state.characters.find(
      (c) => c.id === "dasher",
    );
    expect(updatedDasher?.position).not.toEqual({ q: 1, r: 0 });
  });

  it("mover-blocked-by-interrupt-character-at-their-position", () => {
    // Interrupt character at (2,0) kicks toward enemy at (3,0).
    // Mover targets (2,0). Interrupt char didn't move, so (2,0) is occupied.
    // Mover should be blocked.
    const kicker = createCharacter({
      id: "kicker",
      faction: "friendly",
      position: { q: 2, r: 0 },
      slotPosition: 0,
      currentAction: createInterruptAction({ q: 3, r: 0 }, 2),
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      currentAction: createMoveAction({ q: 2, r: 0 }, 2),
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 0 },
      hp: 100,
      slotPosition: 2,
      currentAction: {
        type: "attack" as const,
        skill: createSkill({ id: "heavy", damage: 25, tickCost: 2 }),
        targetCell: { q: 2, r: 0 },
        targetCharacter: null,
        startedAtTick: 1,
        resolvesAtTick: 3,
      },
    });

    const state = createGameState({
      characters: [kicker, mover, enemy],
      tick: 2,
      phase: "resolution",
    });

    const result = processTick(state);

    assertNoOverlap(result.state.characters);

    // Kicker stays at (2,0)
    const updatedKicker = result.state.characters.find(
      (c) => c.id === "kicker",
    );
    expect(updatedKicker?.position).toEqual({ q: 2, r: 0 });

    // Mover blocked at (1,0)
    const updatedMover = result.state.characters.find((c) => c.id === "mover");
    expect(updatedMover?.position).toEqual({ q: 1, r: 0 });
  });

  it("mover-can-enter-hex-vacated-by-charger", () => {
    // Charger at (1,0) charges toward enemy at (4,0), moves to ~(3,0).
    // Mover targets (1,0) — charger's old position.
    // Mover should succeed because the charger left.
    const charger = createCharacter({
      id: "charger",
      faction: "friendly",
      position: { q: 1, r: 0 },
      slotPosition: 0,
      currentAction: createChargeAction({ q: 4, r: 0 }, 20, 2),
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 1,
      currentAction: createMoveAction({ q: 1, r: 0 }, 2),
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 0 },
      hp: 100,
      slotPosition: 2,
    });

    const state = createGameState({
      characters: [charger, mover, enemy],
      tick: 2,
      phase: "resolution",
    });

    const result = processTick(state);

    assertNoOverlap(result.state.characters);

    // Mover should now be at (1,0) — charger vacated it
    const updatedMover = result.state.characters.find((c) => c.id === "mover");
    expect(updatedMover?.position).toEqual({ q: 1, r: 0 });

    // Charger should have moved away from (1,0)
    const updatedCharger = result.state.characters.find(
      (c) => c.id === "charger",
    );
    expect(updatedCharger?.position).not.toEqual({ q: 1, r: 0 });
  });

  it("blocked-charger-still-blocks-movers", () => {
    // Charger at (0,0) charges toward enemy at (2,0), but blocker at (1,0)
    // prevents movement. Charger stays at (0,0).
    // Another mover targeting (0,0) should be blocked.
    const blocker = createCharacter({
      id: "blocker",
      faction: "friendly",
      position: { q: 1, r: 0 },
      slotPosition: 0,
    });
    const charger = createCharacter({
      id: "charger",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 1,
      currentAction: createChargeAction({ q: 2, r: 0 }, 20, 2),
    });
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: -1, r: 0 },
      slotPosition: 2,
      currentAction: createMoveAction({ q: 0, r: 0 }, 2),
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
      hp: 100,
      slotPosition: 3,
    });

    const state = createGameState({
      characters: [blocker, charger, mover, enemy],
      tick: 2,
      phase: "resolution",
    });

    const result = processTick(state);

    assertNoOverlap(result.state.characters);

    // Charger blocked at (0,0) — couldn't get past blocker
    const updatedCharger = result.state.characters.find(
      (c) => c.id === "charger",
    );
    expect(updatedCharger?.position).toEqual({ q: 0, r: 0 });

    // Mover blocked at (-1,0) — charger is still at (0,0)
    const updatedMover = result.state.characters.find((c) => c.id === "mover");
    expect(updatedMover?.position).toEqual({ q: -1, r: 0 });
  });
});
