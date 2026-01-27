/**
 * Tests for combat and movement integration functionality of processTick.
 */

import { describe, it, expect } from "vitest";
import { processTick } from "./game-core";
import {
  createGameState,
  createCharacter,
  createAttackAction,
  createMoveAction,
  initRNG,
} from "./game-test-helpers";

describe("processTick - combat and movement integration", () => {
  it("should resolve attack actions at correct tick", () => {
    const attacker = createCharacter({
      id: "attacker",
      position: { x: 0, y: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ x: 1, y: 0 }, 10, 1),
    });
    const target = createCharacter({
      id: "target",
      position: { x: 1, y: 0 },
      hp: 100,
      slotPosition: 2,
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    const result = processTick(state);

    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(90);
  });

  it("should not resolve actions with future resolvesAtTick", () => {
    const attacker = createCharacter({
      id: "attacker",
      position: { x: 0, y: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ x: 1, y: 0 }, 10, 5), // Resolves at tick 5
    });
    const target = createCharacter({
      id: "target",
      position: { x: 1, y: 0 },
      hp: 100,
      slotPosition: 2,
    });

    const state = createGameState({
      tick: 1, // Current tick is 1
      characters: [attacker, target],
    });

    const result = processTick(state);

    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(100); // No damage applied
  });

  it("should resolve movement actions at correct tick", () => {
    const mover = createCharacter({
      id: "mover",
      position: { x: 5, y: 5 },
      slotPosition: 1,
      currentAction: createMoveAction({ x: 6, y: 5 }, 2),
    });

    const state = createGameState({
      tick: 2,
      characters: [mover],
    });

    const result = processTick(state);

    const updatedMover = result.state.characters.find((c) => c.id === "mover");
    expect(updatedMover?.position).toEqual({ x: 6, y: 5 });
  });

  it("should apply combat before movement", () => {
    // Attacker and target at same position, target tries to move away
    const attacker = createCharacter({
      id: "attacker",
      position: { x: 0, y: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ x: 1, y: 0 }, 100, 1),
    });
    const target = createCharacter({
      id: "target",
      position: { x: 1, y: 0 },
      hp: 50,
      slotPosition: 2,
      currentAction: createMoveAction({ x: 2, y: 0 }, 1),
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    const result = processTick(state);

    // Target should be hit and killed before movement resolves
    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget).toBeUndefined(); // Dead, removed from characters
  });

  it("should thread RNG state through movement", () => {
    const moverA = createCharacter({
      id: "moverA",
      position: { x: 4, y: 5 },
      slotPosition: 1,
      currentAction: createMoveAction({ x: 5, y: 5 }, 1),
    });
    const moverB = createCharacter({
      id: "moverB",
      position: { x: 5, y: 4 },
      slotPosition: 2,
      currentAction: createMoveAction({ x: 5, y: 5 }, 1),
    });

    const initialRng = initRNG(1000);
    const state = createGameState({
      tick: 1,
      characters: [moverA, moverB],
      rngState: initialRng,
    });

    const result = processTick(state);

    // RNG should have advanced due to collision resolution
    expect(result.state.rngState).not.toBe(initialRng);
  });
});
