/**
 * Tests for basic movement functionality.
 * Section: 2 (Basic movement)
 * Total: 6 tests
 */

import { describe, it, expect } from "vitest";
import { initRNG, resolveMovement } from "./movement";
import {
  createCharacter,
  createMoveAction,
  createAttackAction,
} from "./game-test-helpers";

describe("Movement Basic System", () => {
  // ===========================================================================
  // Section 2: Basic Movement (6 tests)
  // ===========================================================================
  describe("basic movement", () => {
    it("should move character to unobstructed target cell", () => {
      const mover = createCharacter({
        id: "mover",
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 1),
      });

      const result = resolveMovement([mover], 1, initRNG(1000));

      const updated = result.updatedCharacters.find((c) => c.id === "mover");
      expect(updated?.position).toEqual({ x: 6, y: 5 });
    });

    it("should generate MovementEvent with correct fields", () => {
      const mover = createCharacter({
        id: "mover",
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 3),
      });

      const result = resolveMovement([mover], 3, initRNG(1000));

      expect(result.events).toHaveLength(1);
      expect(result.events[0]!).toMatchObject({
        type: "movement",
        tick: 3,
        characterId: "mover",
        from: { x: 5, y: 5 },
        to: { x: 6, y: 5 },
        collided: false,
      });
    });

    it("should set collided=false for successful move", () => {
      const mover = createCharacter({
        id: "mover",
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 1),
      });

      const result = resolveMovement([mover], 1, initRNG(1000));

      expect(result.events[0]!.collided).toBe(false);
    });

    it("should not move character with ticksRemaining > 1", () => {
      const mover = createCharacter({
        id: "mover",
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 2),
      });

      const result = resolveMovement([mover], 1, initRNG(1000));

      const updated = result.updatedCharacters.find((c) => c.id === "mover");
      expect(updated?.position).toEqual({ x: 5, y: 5 }); // Unchanged
      expect(result.events).toHaveLength(0); // No event
    });

    it("should not move character with null action", () => {
      const char = createCharacter({
        id: "char",
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: null,
      });

      const result = resolveMovement([char], 1, initRNG(1000));

      expect(
        result.updatedCharacters.find((c) => c.id === "char")?.position,
      ).toEqual({ x: 5, y: 5 });
      expect(result.events).toHaveLength(0);
    });

    it("should not move character with non-move action", () => {
      const char = createCharacter({
        id: "char",
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 6, y: 5 }, 10, 1),
      });

      const result = resolveMovement([char], 1, initRNG(1000));

      expect(
        result.updatedCharacters.find((c) => c.id === "char")?.position,
      ).toEqual({ x: 5, y: 5 });
      expect(result.events).toHaveLength(0);
    });
  });
});
