/**
 * Tests for blocker always wins collision resolution.
 * Section: 3 (Blocker always wins)
 * Total: 8 tests
 */

import { describe, it, expect } from "vitest";
import { initRNG, resolveMovement } from "./movement";
import {
  createCharacter,
  createMoveAction,
  createAttackAction,
} from "./game-test-helpers";

describe("Movement Blocker System", () => {
  // ===========================================================================
  // Section 3: Blocker Always Wins (8 tests)
  // ===========================================================================
  describe("blocker always wins", () => {
    it("should block mover when stationary character occupies target cell", () => {
      const blocker = createCharacter({
        id: "blocker",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: null, // Stationary
      });
      const mover = createCharacter({
        id: "mover",
        position: { q: 1, r: 2 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      expect(
        result.updatedCharacters.find((c) => c.id === "mover")?.position,
      ).toEqual({ q: 1, r: 2 });
    });

    it("should set collided=true when blocked", () => {
      const blocker = createCharacter({
        id: "blocker",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: null,
      });
      const mover = createCharacter({
        id: "mover",
        position: { q: 1, r: 2 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      const event = result.events.find((e) => e.characterId === "mover");
      expect(event?.collided).toBe(true);
    });

    it("should keep mover in original position when blocked", () => {
      const blocker = createCharacter({
        id: "blocker",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: null,
      });
      const mover = createCharacter({
        id: "mover",
        position: { q: 1, r: 2 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      const event = result.events.find((e) => e.characterId === "mover");
      expect(event?.from).toEqual({ q: 1, r: 2 });
      expect(event?.to).toEqual({ q: 1, r: 2 }); // Stayed in place
    });

    it("should not move blocker", () => {
      const blocker = createCharacter({
        id: "blocker",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: null,
      });
      const mover = createCharacter({
        id: "mover",
        position: { q: 1, r: 2 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      expect(
        result.updatedCharacters.find((c) => c.id === "blocker")?.position,
      ).toEqual({ q: 2, r: 2 });
    });

    it("should block all movers when multiple target same blocker", () => {
      const blocker = createCharacter({
        id: "blocker",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: null,
      });
      const moverA = createCharacter({
        id: "moverA",
        position: { q: 1, r: 2 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { q: 2, r: 1 },
        slotPosition: 3,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      const result = resolveMovement(
        [blocker, moverA, moverB],
        1,
        initRNG(1000),
      );

      expect(
        result.updatedCharacters.find((c) => c.id === "moverA")?.position,
      ).toEqual({ q: 1, r: 2 });
      expect(
        result.updatedCharacters.find((c) => c.id === "moverB")?.position,
      ).toEqual({ q: 2, r: 1 });
      expect(result.events.filter((e) => e.collided === true)).toHaveLength(2);
    });

    it("should treat character with attack action as blocker", () => {
      const blocker = createCharacter({
        id: "blocker",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: createAttackAction({ q: 3, r: 2 }, 10, 1), // Attacking but stationary
      });
      const mover = createCharacter({
        id: "mover",
        position: { q: 1, r: 2 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      expect(
        result.updatedCharacters.find((c) => c.id === "mover")?.position,
      ).toEqual({ q: 1, r: 2 });
      expect(result.events[0]!.collided).toBe(true);
    });

    it("should treat hold action (move to current cell) as blocker", () => {
      const blocker = createCharacter({
        id: "blocker",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1), // Hold
      });
      const mover = createCharacter({
        id: "mover",
        position: { q: 1, r: 2 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      expect(
        result.updatedCharacters.find((c) => c.id === "mover")?.position,
      ).toEqual({ q: 1, r: 2 });
      expect(
        result.events.find((e) => e.characterId === "mover")?.collided,
      ).toBe(true);
    });

    it("should allow independent resolution of multiple groups", () => {
      // Group 1: blocker at (5,5), mover blocked
      const blockerA = createCharacter({
        id: "blockerA",
        position: { q: 2, r: 2 },
        slotPosition: 1,
        currentAction: null,
      });
      const moverA = createCharacter({
        id: "moverA",
        position: { q: 1, r: 2 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });
      // Group 2: unobstructed move to (8,8)
      const moverB = createCharacter({
        id: "moverB",
        position: { q: 3, r: 3 },
        slotPosition: 3,
        currentAction: createMoveAction({ q: 4, r: 3 }, 1),
      });

      const result = resolveMovement(
        [blockerA, moverA, moverB],
        1,
        initRNG(1000),
      );

      expect(
        result.updatedCharacters.find((c) => c.id === "moverA")?.position,
      ).toEqual({ q: 1, r: 2 }); // Blocked
      expect(
        result.updatedCharacters.find((c) => c.id === "moverB")?.position,
      ).toEqual({ q: 4, r: 3 }); // Success
      expect(
        result.events.find((e) => e.characterId === "moverA")?.collided,
      ).toBe(true);
      expect(
        result.events.find((e) => e.characterId === "moverB")?.collided,
      ).toBe(false);
    });
  });
});
