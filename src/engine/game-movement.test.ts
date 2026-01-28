/**
 * Integration tests for computeMoveDestination with A* pathfinding.
 * Tests verify pathfinding integration and real-world multi-character scenarios.
 */

import { describe, it, expect } from "vitest";
import { computeMoveDestination } from "./game-movement";
import { createCharacter } from "./game-test-helpers";

describe("computeMoveDestination - Pathfinding Integration", () => {
  it("should use pathfinding to navigate around blocker (towards mode)", () => {
    const mover = createCharacter({
      id: "mover",
      position: { x: 0, y: 0 },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 4, y: 0 },
    });
    const blocker = createCharacter({
      id: "blocker",
      position: { x: 1, y: 0 },
    });

    const destination = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
      blocker,
    ]);

    // Should not move into blocker
    expect(destination).not.toEqual({ x: 1, y: 0 });

    // Should take first step around blocker (diagonal or cardinal detour)
    expect(
      (destination.x === 1 && destination.y === 1) ||
        (destination.x === 0 && destination.y === 1),
    ).toBe(true);
  });

  it("should not affect away mode behavior", () => {
    const mover = createCharacter({
      id: "mover",
      position: { x: 5, y: 5 },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 8, y: 5 },
    });

    const destination = computeMoveDestination(mover, target, "away", [
      mover,
      target,
    ]);

    // Should move away (x should decrease)
    expect(destination.x).toBeLessThan(5);
  });

  it("should treat all other characters as obstacles", () => {
    const mover = createCharacter({
      id: "mover",
      position: { x: 0, y: 5 },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 4, y: 5 },
    });
    const blocker1 = createCharacter({
      id: "blocker1",
      position: { x: 1, y: 5 },
    });
    const blocker2 = createCharacter({
      id: "blocker2",
      position: { x: 2, y: 5 },
    });
    const blocker3 = createCharacter({
      id: "blocker3",
      position: { x: 1, y: 4 },
    });
    const blocker4 = createCharacter({
      id: "blocker4",
      position: { x: 2, y: 4 },
    });

    const destination = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
      blocker1,
      blocker2,
      blocker3,
      blocker4,
    ]);

    // Should avoid all blocker positions
    expect(destination).not.toEqual(blocker1.position);
    expect(destination).not.toEqual(blocker2.position);
    expect(destination).not.toEqual(blocker3.position);
    expect(destination).not.toEqual(blocker4.position);
  });

  it("should return current position when mover is surrounded", () => {
    const mover = createCharacter({
      id: "mover",
      position: { x: 5, y: 5 },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 0, y: 0 },
    });

    // Surround mover with blockers
    const blockers = [
      createCharacter({ id: "b1", position: { x: 4, y: 4 } }),
      createCharacter({ id: "b2", position: { x: 5, y: 4 } }),
      createCharacter({ id: "b3", position: { x: 6, y: 4 } }),
      createCharacter({ id: "b4", position: { x: 4, y: 5 } }),
      createCharacter({ id: "b5", position: { x: 6, y: 5 } }),
      createCharacter({ id: "b6", position: { x: 4, y: 6 } }),
      createCharacter({ id: "b7", position: { x: 5, y: 6 } }),
      createCharacter({ id: "b8", position: { x: 6, y: 6 } }),
    ];

    const destination = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
      ...blockers,
    ]);

    // Should stay in current position (cannot move)
    expect(destination).toEqual({ x: 5, y: 5 });
  });

  it("should move to adjacent target position", () => {
    const mover = createCharacter({
      id: "mover",
      position: { x: 5, y: 5 },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 6, y: 5 },
    });

    const destination = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
    ]);

    // Should move directly to adjacent target
    expect(destination).toEqual({ x: 6, y: 5 });
  });

  it("should return current position when no path exists", () => {
    const mover = createCharacter({
      id: "mover",
      position: { x: 0, y: 0 },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 5, y: 5 },
    });

    // Completely surround target
    const blockers = [
      createCharacter({ id: "b1", position: { x: 4, y: 4 } }),
      createCharacter({ id: "b2", position: { x: 5, y: 4 } }),
      createCharacter({ id: "b3", position: { x: 6, y: 4 } }),
      createCharacter({ id: "b4", position: { x: 4, y: 5 } }),
      createCharacter({ id: "b5", position: { x: 6, y: 5 } }),
      createCharacter({ id: "b6", position: { x: 4, y: 6 } }),
      createCharacter({ id: "b7", position: { x: 5, y: 6 } }),
      createCharacter({ id: "b8", position: { x: 6, y: 6 } }),
    ];

    const destination = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
      ...blockers,
    ]);

    // Should stay in current position (no path)
    expect(destination).toEqual({ x: 0, y: 0 });
  });

  it("should exclude self from obstacles", () => {
    const mover = createCharacter({
      id: "mover",
      position: { x: 5, y: 5 },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 7, y: 5 },
    });

    const destination = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
    ]);

    // Path should be found (mover doesn't block itself)
    expect(destination).not.toEqual({ x: 5, y: 5 });

    // Should move towards target
    expect(destination.x).toBeGreaterThan(5);
  });

  it("should not treat target position as obstacle", () => {
    const mover = createCharacter({
      id: "mover",
      position: { x: 5, y: 5 },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 6, y: 5 },
    });

    const destination = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
    ]);

    // Should move toward target (target position is valid destination)
    expect(destination).toEqual({ x: 6, y: 5 });
  });
});
