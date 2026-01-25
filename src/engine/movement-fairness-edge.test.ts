/**
 * Tests for fairness testing and edge cases.
 * Sections: 6 (Fairness testing) and 7 (Edge cases)
 * Total: 10 tests
 */

import { describe, it, expect } from "vitest";
import { initRNG, resolveMovement } from "./movement";
import { createCharacter, createMoveAction } from "./game-test-helpers";

describe("Movement Fairness and Edge Cases", () => {
  // ===========================================================================
  // Section 6: Fairness Testing (3 tests)
  // ===========================================================================
  describe("fairness testing", () => {
    it("should give each contestant ~50% win rate over 10000 trials", () => {
      const trials = 10000;
      const wins: Record<string, number> = { moverA: 0, moverB: 0 };

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

        const result = resolveMovement([moverA, moverB], 1, initRNG(i));
        const winner = result.events.find(
          (e) => e.collided === false,
        )?.characterId;
        if (winner) wins[winner] = (wins[winner] ?? 0) + 1;
      }

      // For n=10000, p=0.5: σ = 50, 3σ bounds: 4850-5150
      expect(wins.moverA).toBeGreaterThan(4850);
      expect(wins.moverA).toBeLessThan(5150);
      expect(wins.moverB).toBeGreaterThan(4850);
      expect(wins.moverB).toBeLessThan(5150);
    });

    it("should be fair regardless of slotPosition", () => {
      const trials = 10000;
      const wins: Record<string, number> = { moverA: 0, moverB: 0 };

      for (let i = 0; i < trials; i++) {
        const moverA = createCharacter({
          id: "moverA",
          position: { x: 4, y: 5 },
          slotPosition: 99, // High slot position
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });
        const moverB = createCharacter({
          id: "moverB",
          position: { x: 5, y: 4 },
          slotPosition: 0, // Low slot position
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });

        const result = resolveMovement([moverA, moverB], 1, initRNG(i));
        const winner = result.events.find(
          (e) => e.collided === false,
        )?.characterId;
        if (winner) wins[winner] = (wins[winner] ?? 0) + 1;
      }

      expect(wins.moverA).toBeGreaterThan(4850);
      expect(wins.moverA).toBeLessThan(5150);
      expect(wins.moverB).toBeGreaterThan(4850);
      expect(wins.moverB).toBeLessThan(5150);
    });

    it("should be fair regardless of faction", () => {
      const trials = 10000;
      const wins: Record<string, number> = { friendly: 0, enemy: 0 };

      for (let i = 0; i < trials; i++) {
        const moverA = createCharacter({
          id: "moverA",
          faction: "friendly",
          position: { x: 4, y: 5 },
          slotPosition: 0,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });
        const moverB = createCharacter({
          id: "moverB",
          faction: "enemy",
          position: { x: 5, y: 4 },
          slotPosition: 1,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });

        const result = resolveMovement([moverA, moverB], 1, initRNG(i));
        const winner = result.events.find(
          (e) => e.collided === false,
        )?.characterId;
        if (winner === "moverA") wins.friendly = (wins.friendly ?? 0) + 1;
        if (winner === "moverB") wins.enemy = (wins.enemy ?? 0) + 1;
      }

      expect(wins.friendly).toBeGreaterThan(4850);
      expect(wins.friendly).toBeLessThan(5150);
      expect(wins.enemy).toBeGreaterThan(4850);
      expect(wins.enemy).toBeLessThan(5150);
    });
  });

  // ===========================================================================
  // Section 7: Edge Cases (7 tests)
  // ===========================================================================
  describe("edge cases", () => {
    it("should handle empty characters array", () => {
      const result = resolveMovement([], 1, initRNG(1000));

      expect(result.updatedCharacters).toHaveLength(0);
      expect(result.events).toHaveLength(0);
    });

    it("should not consume RNG when no collisions occur", () => {
      const mover = createCharacter({
        id: "mover",
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 1),
      });

      const initialState = initRNG(1000);
      const result = resolveMovement([mover], 1, initialState);

      expect(result.rngState).toBe(initialState); // Unchanged
    });

    it("should advance RNG when collision occurs", () => {
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

      const initialState = initRNG(1000);
      const result = resolveMovement([moverA, moverB], 1, initialState);

      expect(result.rngState).not.toBe(initialState); // Advanced
    });

    it("should block mover targeting cell occupied by outgoing mover (snapshot-based)", () => {
      const outgoingMover = createCharacter({
        id: "outgoingMover",
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 1), // Moving away
      });
      const incomingMover = createCharacter({
        id: "incomingMover",
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1), // Moving into vacating cell
      });

      const result = resolveMovement(
        [outgoingMover, incomingMover],
        1,
        initRNG(1000),
      );

      // Outgoing mover should succeed
      expect(
        result.updatedCharacters.find((c) => c.id === "outgoingMover")
          ?.position,
      ).toEqual({ x: 6, y: 5 });
      // Incoming mover should be blocked (snapshot-based)
      expect(
        result.updatedCharacters.find((c) => c.id === "incomingMover")
          ?.position,
      ).toEqual({ x: 4, y: 5 });
      expect(
        result.events.find((e) => e.characterId === "incomingMover")?.collided,
      ).toBe(true);
    });

    it("should prevent chain movement through vacating cells", () => {
      const charA = createCharacter({
        id: "charA",
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 1),
      });
      const charB = createCharacter({
        id: "charB",
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const charC = createCharacter({
        id: "charC",
        position: { x: 3, y: 5 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 4, y: 5 }, 1),
      });

      const result = resolveMovement([charA, charB, charC], 1, initRNG(1000));

      // A should move (unobstructed at start)
      expect(
        result.updatedCharacters.find((c) => c.id === "charA")?.position,
      ).toEqual({ x: 6, y: 5 });
      // B should be blocked by A's start position
      expect(
        result.updatedCharacters.find((c) => c.id === "charB")?.position,
      ).toEqual({ x: 4, y: 5 });
      // C should move (B didn't vacate)
      expect(
        result.updatedCharacters.find((c) => c.id === "charC")?.position,
      ).toEqual({ x: 3, y: 5 });
    });

    it("should preserve all character properties except position", () => {
      const mover = createCharacter({
        id: "mover",
        name: "TestMover",
        faction: "friendly",
        position: { x: 5, y: 5 },
        hp: 75,
        maxHp: 100,
        slotPosition: 42,
        skills: [
          {
            id: "skill1",
            name: "Skill",
            tickCost: 1,
            range: 1,
            enabled: true,
            triggers: [],
          },
        ],
        currentAction: createMoveAction({ x: 6, y: 5 }, 1),
      });

      const result = resolveMovement([mover], 1, initRNG(1000));

      const updated = result.updatedCharacters.find((c) => c.id === "mover");
      expect(updated?.name).toBe("TestMover");
      expect(updated?.faction).toBe("friendly");
      expect(updated?.hp).toBe(75);
      expect(updated?.maxHp).toBe(100);
      expect(updated?.slotPosition).toBe(42);
      expect(updated?.skills).toHaveLength(1);
    });

    it("should handle hold action correctly (move to current cell)", () => {
      const holder = createCharacter({
        id: "holder",
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1), // Hold
      });

      const result = resolveMovement([holder], 1, initRNG(1000));

      expect(
        result.updatedCharacters.find((c) => c.id === "holder")?.position,
      ).toEqual({ x: 5, y: 5 });
      // Hold doesn't generate an event (acts as blocker, doesn't move)
      expect(result.events).toHaveLength(0);
    });
  });
});
