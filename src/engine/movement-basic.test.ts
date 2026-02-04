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
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 3, r: 2 }, 1),
      });

      const result = resolveMovement([mover], 1, initRNG(1000));

      const updated = result.updatedCharacters.find((c) => c.id === "mover");
      expect(updated?.position).toEqual({ q: 3, r: 2 });
    });

    it("should generate MovementEvent with correct fields", () => {
      const mover = createCharacter({
        id: "mover",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 3, r: 2 }, 3),
      });

      const result = resolveMovement([mover], 3, initRNG(1000));

      expect(result.events).toHaveLength(1);
      expect(result.events[0]!).toMatchObject({
        type: "movement",
        tick: 3,
        characterId: "mover",
        from: { q: 2, r: 2 },
        to: { q: 3, r: 2 },
        collided: false,
      });
    });

    it("should set collided=false for successful move", () => {
      const mover = createCharacter({
        id: "mover",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 3, r: 2 }, 1),
      });

      const result = resolveMovement([mover], 1, initRNG(1000));

      expect(result.events[0]!.collided).toBe(false);
    });

    it("should not move character with ticksRemaining > 1", () => {
      const mover = createCharacter({
        id: "mover",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 3, r: 2 }, 2),
      });

      const result = resolveMovement([mover], 1, initRNG(1000));

      const updated = result.updatedCharacters.find((c) => c.id === "mover");
      expect(updated?.position).toEqual({ q: 2, r: 2 }); // Unchanged
      expect(result.events).toHaveLength(0); // No event
    });

    it("should not move character with null action", () => {
      const char = createCharacter({
        id: "char",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: null,
      });

      const result = resolveMovement([char], 1, initRNG(1000));

      expect(
        result.updatedCharacters.find((c) => c.id === "char")?.position,
      ).toEqual({ q: 2, r: 2 });
      expect(result.events).toHaveLength(0);
    });

    it("should not move character with non-move action", () => {
      const char = createCharacter({
        id: "char",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 3, r: 2 }, 10, 1),
      });

      const result = resolveMovement([char], 1, initRNG(1000));

      expect(
        result.updatedCharacters.find((c) => c.id === "char")?.position,
      ).toEqual({ q: 2, r: 2 });
      expect(result.events).toHaveLength(0);
    });
  });
});
