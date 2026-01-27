/**
 * Tests for character removal functionality of processTick.
 */

import { describe, it, expect } from "vitest";
import { processTick } from "./game-core";
import {
  createGameState,
  createCharacter,
  createAttackAction,
} from "./game-test-helpers";

describe("processTick - character removal", () => {
  it("should remove dead characters (HP <= 0)", () => {
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
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    const result = processTick(state);

    expect(result.state.characters).toHaveLength(1);
    expect(result.state.characters[0]!.id).toBe("attacker");
  });

  it("should keep characters with HP > 0", () => {
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

    expect(result.state.characters).toHaveLength(2);
    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(90);
  });

  it("should handle multiple simultaneous deaths", () => {
    const charA = createCharacter({
      id: "charA",
      position: { x: 0, y: 0 },
      hp: 10,
      slotPosition: 1,
      currentAction: createAttackAction({ x: 1, y: 0 }, 25, 1),
    });
    const charB = createCharacter({
      id: "charB",
      position: { x: 1, y: 0 },
      hp: 10,
      slotPosition: 2,
      currentAction: createAttackAction({ x: 0, y: 0 }, 25, 1),
    });

    const state = createGameState({
      tick: 1,
      characters: [charA, charB],
    });

    const result = processTick(state);

    expect(result.state.characters).toHaveLength(0);
  });
});
