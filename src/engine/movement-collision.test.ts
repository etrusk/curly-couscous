/**
 * Tests for two-way and multi-way collision resolution.
 * Sections: 4 (Two-way collision) and 5 (Multi-way collision)
 * Total: 10 tests
 */

import { describe, it, expect } from "vitest";
import { initRNG, resolveMovement } from "./movement";
import { createCharacter, createMoveAction } from "./game-test-helpers";

describe("Movement Collision System", () => {
  // ===========================================================================
  // Section 4: Two-Way Collision (6 tests)
  // ===========================================================================
  describe("two-way collision", () => {
    it("should select exactly one winner from two movers", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([moverA, moverB], 1, initRNG(1000));

      const movedCount = result.updatedCharacters.filter(
        (c) => c.position.x === 5 && c.position.y === 5,
      ).length;
      expect(movedCount).toBe(1);
    });

    it("should keep loser in original position", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([moverA, moverB], 1, initRNG(1000));

      const loserEvent = result.events.find((e) => e.collided === true);
      expect(loserEvent?.from).toEqual(loserEvent?.to); // Stayed in place
    });

    it("should set correct collided flags (winner=false, loser=true)", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([moverA, moverB], 1, initRNG(1000));

      const winnerEvent = result.events.find((e) => e.collided === false);
      const loserEvent = result.events.find((e) => e.collided === true);
      expect(winnerEvent).toBeDefined();
      expect(loserEvent).toBeDefined();
    });

    it("should generate events for both movers", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([moverA, moverB], 1, initRNG(1000));

      expect(result.events).toHaveLength(2);
      expect(result.events.map((e) => e.characterId).sort()).toEqual([
        "moverA",
        "moverB",
      ]);
    });

    it("should produce same winner with same rngState", () => {
      const seed = 42;
      const moverA = createCharacter({
        id: "moverA",
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result1 = resolveMovement([moverA, moverB], 1, initRNG(seed));
      const result2 = resolveMovement([moverA, moverB], 1, initRNG(seed));

      const winner1 = result1.events.find(
        (e) => e.collided === false,
      )?.characterId;
      const winner2 = result2.events.find(
        (e) => e.collided === false,
      )?.characterId;
      expect(winner1).toBe(winner2);
    });

    it("should potentially produce different winner with different rngState", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      // Try different seeds until we get different outcomes
      const results: string[] = [];
      for (let seed = 0; seed < 100; seed++) {
        const result = resolveMovement([moverA, moverB], 1, initRNG(seed));
        const winner = result.events.find(
          (e) => e.collided === false,
        )?.characterId;
        if (winner) results.push(winner);
      }

      // Should have both winners appear at least once
      const uniqueWinners = new Set(results);
      expect(uniqueWinners.size).toBe(2);
    });
  });

  // ===========================================================================
  // Section 5: Multi-Way Collision (4 tests)
  // ===========================================================================
  describe("multi-way collision", () => {
    it("should select exactly one winner from 3-way collision", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverC = createCharacter({
        id: "moverC",
        position: { x: 6, y: 5 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement(
        [moverA, moverB, moverC],
        1,
        initRNG(1000),
      );

      const winnersCount = result.events.filter(
        (e) => e.collided === false,
      ).length;
      expect(winnersCount).toBe(1);
    });

    it("should keep all losers in original positions", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverC = createCharacter({
        id: "moverC",
        position: { x: 6, y: 5 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement(
        [moverA, moverB, moverC],
        1,
        initRNG(1000),
      );

      const loserEvents = result.events.filter((e) => e.collided === true);
      expect(loserEvents).toHaveLength(2);
      loserEvents.forEach((event) => {
        expect(event.from).toEqual(event.to); // Each loser stayed in place
      });
    });

    it("should handle 4-way collision", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverC = createCharacter({
        id: "moverC",
        position: { x: 6, y: 5 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverD = createCharacter({
        id: "moverD",
        position: { x: 5, y: 6 },
        slotPosition: 3,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement(
        [moverA, moverB, moverC, moverD],
        1,
        initRNG(1000),
      );

      expect(result.events.filter((e) => e.collided === false)).toHaveLength(1);
      expect(result.events.filter((e) => e.collided === true)).toHaveLength(3);
    });

    it("should distribute wins uniformly over many trials (3-way)", () => {
      const trials = 10000;
      const wins: Record<string, number> = { moverA: 0, moverB: 0, moverC: 0 };

      for (let i = 0; i < trials; i++) {
        const moverA = createCharacter({
          id: "moverA",
          position: { x: 4, y: 5 },
          slotPosition: 0,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });
        const moverB = createCharacter({
          id: "moverB",
          position: { x: 5, y: 4 },
          slotPosition: 1,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });
        const moverC = createCharacter({
          id: "moverC",
          position: { x: 6, y: 5 },
          slotPosition: 2,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });

        const result = resolveMovement([moverA, moverB, moverC], 1, initRNG(i));
        const winner = result.events.find(
          (e) => e.collided === false,
        )?.characterId;
        if (winner) wins[winner] = (wins[winner] ?? 0) + 1;
      }

      // For n=10000, p=0.333: σ ≈ 47, 3σ bounds: 3050-3650
      expect(wins.moverA).toBeGreaterThan(3050);
      expect(wins.moverA).toBeLessThan(3650);
      expect(wins.moverB).toBeGreaterThan(3050);
      expect(wins.moverB).toBeLessThan(3650);
      expect(wins.moverC).toBeGreaterThan(3050);
      expect(wins.moverC).toBeLessThan(3650);
    });
  });
});
