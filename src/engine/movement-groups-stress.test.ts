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
      // Group 1: Two movers to (5,5)
      const mover1A = createCharacter({
        id: "mover1A",
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const mover1B = createCharacter({
        id: "mover1B",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      // Group 2: Two movers to (8,8)
      const mover2A = createCharacter({
        id: "mover2A",
        position: { x: 7, y: 8 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 8, y: 8 }, 1),
      });
      const mover2B = createCharacter({
        id: "mover2B",
        position: { x: 8, y: 7 },
        slotPosition: 3,
        currentAction: createMoveAction({ x: 8, y: 8 }, 1),
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
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const mover1B = createCharacter({
        id: "mover1B",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const mover2A = createCharacter({
        id: "mover2A",
        position: { x: 7, y: 8 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 8, y: 8 }, 1),
      });
      const mover2B = createCharacter({
        id: "mover2B",
        position: { x: 8, y: 7 },
        slotPosition: 3,
        currentAction: createMoveAction({ x: 8, y: 8 }, 1),
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
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 2, y: 3 }, 1), // Target Y=3, X=2
      });
      const moverA2 = createCharacter({
        id: "moverA2",
        position: { x: 1, y: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 2, y: 3 }, 1),
      });
      const moverB1 = createCharacter({
        id: "moverB1",
        position: { x: 4, y: 4 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1), // Target Y=5, X=5
      });
      const moverB2 = createCharacter({
        id: "moverB2",
        position: { x: 5, y: 4 },
        slotPosition: 3,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
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
    it("should handle 8-way collision", () => {
      const movers = [
        createCharacter({
          id: "mover0",
          position: { x: 4, y: 4 },
          slotPosition: 0,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        }),
        createCharacter({
          id: "mover1",
          position: { x: 5, y: 4 },
          slotPosition: 1,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        }),
        createCharacter({
          id: "mover2",
          position: { x: 6, y: 4 },
          slotPosition: 2,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        }),
        createCharacter({
          id: "mover3",
          position: { x: 4, y: 5 },
          slotPosition: 3,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        }),
        createCharacter({
          id: "mover4",
          position: { x: 6, y: 5 },
          slotPosition: 4,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        }),
        createCharacter({
          id: "mover5",
          position: { x: 4, y: 6 },
          slotPosition: 5,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        }),
        createCharacter({
          id: "mover6",
          position: { x: 5, y: 6 },
          slotPosition: 6,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        }),
        createCharacter({
          id: "mover7",
          position: { x: 6, y: 6 },
          slotPosition: 7,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        }),
      ];

      const result = resolveMovement(movers, 1, initRNG(1000));

      // Exactly 1 winner, 7 losers
      expect(result.events.filter((e) => e.collided === false)).toHaveLength(1);
      expect(result.events.filter((e) => e.collided === true)).toHaveLength(7);

      // Exactly 1 character at (5,5)
      const atTarget = result.updatedCharacters.filter(
        (c) => c.position.x === 5 && c.position.y === 5,
      );
      expect(atTarget).toHaveLength(1);
    });
  });
});
