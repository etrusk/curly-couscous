/**
 * Tests for movement RNG determinism and state management.
 * Sections: 1 (RNG determinism) and 9 (RNG state management)
 * Total: 9 tests
 */

import { describe, it, expect } from "vitest";
import { initRNG, nextRandom, resolveMovement } from "./movement";
import { createCharacter, createMoveAction } from "./game-test-helpers";

describe("Movement RNG System", () => {
  // ===========================================================================
  // Section 1: RNG Determinism (3 tests)
  // ===========================================================================
  describe("RNG determinism", () => {
    it("should produce same sequence from same seed", () => {
      const seed = 12345;
      const state1 = initRNG(seed);
      const state2 = initRNG(seed);

      const result1 = nextRandom(state1);
      const result2 = nextRandom(state2);

      expect(result1.value).toBe(result2.value);
      expect(result1.nextState).toBe(result2.nextState);
    });

    it("should produce different sequences from different seeds", () => {
      const state1 = initRNG(12345);
      const state2 = initRNG(67890);

      const result1 = nextRandom(state1);
      const result2 = nextRandom(state2);

      expect(result1.value).not.toBe(result2.value);
    });

    it("should produce values in range [0, 1)", () => {
      let state = initRNG(42);

      for (let i = 0; i < 1000; i++) {
        const result = nextRandom(state);
        expect(result.value).toBeGreaterThanOrEqual(0);
        expect(result.value).toBeLessThan(1);
        state = result.nextState;
      }
    });
  });

  // ===========================================================================
  // Section 9: RNG State Management (6 tests)
  // ===========================================================================
  describe("RNG state management", () => {
    it("should return updated rngState in result", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { q: 1, r: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { q: 2, r: 1 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      const result = resolveMovement([moverA, moverB], 1, initRNG(1000));

      expect(result.rngState).toBeDefined();
      expect(typeof result.rngState).toBe("number");
    });

    it("should allow chaining rngState across multiple ticks", () => {
      const moverA1 = createCharacter({
        id: "moverA",
        position: { q: 1, r: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });
      const moverB1 = createCharacter({
        id: "moverB",
        position: { q: 2, r: 1 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      const tick1Result = resolveMovement([moverA1, moverB1], 1, initRNG(1000));

      // Create new characters with actions resolving at tick 2
      const moverA2 = createCharacter({
        id: "moverA",
        position: { q: 1, r: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 2, r: 2 }, 2),
      });
      const moverB2 = createCharacter({
        id: "moverB",
        position: { q: 2, r: 1 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 2),
      });

      const tick2Result = resolveMovement(
        [moverA2, moverB2],
        2,
        tick1Result.rngState,
      );

      expect(tick2Result.rngState).not.toBe(tick1Result.rngState);
    });

    it("should consume exactly one RNG call per two-way collision", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { q: 1, r: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { q: 2, r: 1 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      const initialState = initRNG(1000);
      const result = resolveMovement([moverA, moverB], 1, initialState);

      const expectedState = nextRandom(initialState).nextState;
      expect(result.rngState).toBe(expectedState);
    });

    it("should consume exactly one RNG call for N-way collision", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { q: 1, r: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { q: 2, r: 1 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });
      const moverC = createCharacter({
        id: "moverC",
        position: { q: 3, r: 2 },
        slotPosition: 3,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      const initialState = initRNG(1000);
      const result = resolveMovement([moverA, moverB, moverC], 1, initialState);

      const expectedState = nextRandom(initialState).nextState;
      expect(result.rngState).toBe(expectedState);
    });

    it("should not consume RNG when blocker prevents collision", () => {
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

      const initialState = initRNG(1000);
      const result = resolveMovement(
        [blocker, moverA, moverB],
        1,
        initialState,
      );

      expect(result.rngState).toBe(initialState); // Unchanged
    });

    it("should handle edge RNG values correctly (0.0 and 0.999...)", () => {
      // This test verifies that extreme RNG values select valid array indices
      const moverA = createCharacter({
        id: "moverA",
        position: { q: 1, r: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { q: 2, r: 1 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 2 }, 1),
      });

      // Try many seeds to potentially hit edge cases
      for (let seed = 0; seed < 1000; seed++) {
        const result = resolveMovement([moverA, moverB], 1, initRNG(seed));
        const winner = result.events.find((e) => e.collided === false);
        expect(winner).toBeDefined();
        expect(["moverA", "moverB"]).toContain(winner?.characterId);
      }
    });
  });
});
