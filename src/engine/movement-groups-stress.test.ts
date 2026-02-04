/**
 * Tests for multiple collision groups and stress tests.
 * Sections: 8 (Multiple collision groups) and 10 (Stress tests)
 * Total: 4 tests
 */

import { describe, it, expect } from "vitest";
import { initRNG, resolveMovement, nextRandom } from "./movement";
import { createCharacter, createMoveAction } from "./game-test-helpers";

describe("Movement Groups and Stress Tests", () => {
  // ===========================================================================
  // Section 8: Multiple Collision Groups (3 tests)
  // ===========================================================================
  describe("multiple collision groups", () => {
    it("should resolve independent collision groups separately", () => {
      // Group 1: Two movers to {q:2, r:1}
      const mover1A = createCharacter({
        id: "mover1A",
        position: { q: 1, r: 1 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 2, r: 1 }, 1),
      });
      const mover1B = createCharacter({
        id: "mover1B",
        position: { q: 2, r: 0 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 1 }, 1),
      });
      // Group 2: Two movers to {q:-2, r:-1}
      const mover2A = createCharacter({
        id: "mover2A",
        position: { q: -1, r: -1 },
        slotPosition: 3,
        currentAction: createMoveAction({ q: -2, r: -1 }, 1),
      });
      const mover2B = createCharacter({
        id: "mover2B",
        position: { q: -2, r: 0 },
        slotPosition: 4,
        currentAction: createMoveAction({ q: -2, r: -1 }, 1),
      });

      const result = resolveMovement(
        [mover1A, mover1B, mover2A, mover2B],
        1,
        initRNG(1000),
      );

      // Each group should have exactly 1 winner
      const group1Events = result.events.filter(
        (e) => e.characterId === "mover1A" || e.characterId === "mover1B",
      );
      const group2Events = result.events.filter(
        (e) => e.characterId === "mover2A" || e.characterId === "mover2B",
      );
      expect(group1Events.filter((e) => e.collided === false)).toHaveLength(1);
      expect(group2Events.filter((e) => e.collided === false)).toHaveLength(1);
    });

    it("should consume RNG once per collision group", () => {
      // Two collision groups should advance RNG twice
      const mover1A = createCharacter({
        id: "mover1A",
        position: { q: 1, r: 1 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 2, r: 1 }, 1),
      });
      const mover1B = createCharacter({
        id: "mover1B",
        position: { q: 2, r: 0 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 1 }, 1),
      });
      const mover2A = createCharacter({
        id: "mover2A",
        position: { q: -1, r: -1 },
        slotPosition: 3,
        currentAction: createMoveAction({ q: -2, r: -1 }, 1),
      });
      const mover2B = createCharacter({
        id: "mover2B",
        position: { q: -2, r: 0 },
        slotPosition: 4,
        currentAction: createMoveAction({ q: -2, r: -1 }, 1),
      });

      const initialState = initRNG(1000);
      const result = resolveMovement(
        [mover1A, mover1B, mover2A, mover2B],
        1,
        initialState,
      );

      // Manually advance RNG twice to verify
      const afterOne = nextRandom(initialState);
      const afterTwo = nextRandom(afterOne.nextState);

      expect(result.rngState).toBe(afterTwo.nextState);
    });

    it("should process collision groups in deterministic order", () => {
      // Create collision groups at different target cells
      const moverA1 = createCharacter({
        id: "moverA1",
        position: { q: 1, r: 3 },
        slotPosition: 1,
        currentAction: createMoveAction({ q: 2, r: 3 }, 1), // Target Y=3, X=2
      });
      const moverA2 = createCharacter({
        id: "moverA2",
        position: { q: 2, r: 2 },
        slotPosition: 2,
        currentAction: createMoveAction({ q: 2, r: 3 }, 1),
      });
      const moverB1 = createCharacter({
        id: "moverB1",
        position: { q: -1, r: -1 },
        slotPosition: 3,
        currentAction: createMoveAction({ q: -2, r: -1 }, 1), // Target Y=5, X=5
      });
      const moverB2 = createCharacter({
        id: "moverB2",
        position: { q: -2, r: 0 },
        slotPosition: 4,
        currentAction: createMoveAction({ q: -2, r: -1 }, 1),
      });

      const result1 = resolveMovement(
        [moverA1, moverA2, moverB1, moverB2],
        1,
        initRNG(1000),
      );
      const result2 = resolveMovement(
        [moverB1, moverB2, moverA1, moverA2],
        1,
        initRNG(1000),
      ); // Different order

      // Results should be identical regardless of input order
      expect(result1.rngState).toBe(result2.rngState);
    });
  });

  // ===========================================================================
  // Section 10: Stress Tests (1 test)
  // ===========================================================================
  describe("stress tests", () => {
    it("should handle 6-way collision", () => {
      // Target: {q:2, r:1}
      // 6 neighbors (max collision in hex): (3,1), (1,1), (2,2), (2,0), (3,0), (1,2)
      const movers = [
        createCharacter({
          id: "mover0",
          position: { q: 3, r: 1 },
          slotPosition: 1,
          currentAction: createMoveAction({ q: 2, r: 1 }, 1),
        }),
        createCharacter({
          id: "mover1",
          position: { q: 1, r: 1 },
          slotPosition: 2,
          currentAction: createMoveAction({ q: 2, r: 1 }, 1),
        }),
        createCharacter({
          id: "mover2",
          position: { q: 2, r: 2 },
          slotPosition: 3,
          currentAction: createMoveAction({ q: 2, r: 1 }, 1),
        }),
        createCharacter({
          id: "mover3",
          position: { q: 2, r: 0 },
          slotPosition: 4,
          currentAction: createMoveAction({ q: 2, r: 1 }, 1),
        }),
        createCharacter({
          id: "mover4",
          position: { q: 3, r: 0 },
          slotPosition: 5,
          currentAction: createMoveAction({ q: 2, r: 1 }, 1),
        }),
        createCharacter({
          id: "mover5",
          position: { q: 1, r: 2 },
          slotPosition: 6,
          currentAction: createMoveAction({ q: 2, r: 1 }, 1),
        }),
      ];

      const result = resolveMovement(movers, 1, initRNG(1000));

      // Exactly 1 winner, 5 losers
      expect(result.events.filter((e) => e.collided === false)).toHaveLength(1);
      expect(result.events.filter((e) => e.collided === true)).toHaveLength(5);

      // Exactly 1 character at {q:2, r:1}
      const atTarget = result.updatedCharacters.filter(
        (c) => c.position.q === 2 && c.position.r === 1,
      );
      expect(atTarget).toHaveLength(1);
    });
  });
});
