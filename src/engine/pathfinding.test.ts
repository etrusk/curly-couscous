/**
 * Unit tests for A* pathfinding algorithm.
 * Tests cover basic paths, obstacle avoidance, edge cases, and performance.
 */

import { describe, it, expect } from "vitest";
import { findPath, positionKey } from "./pathfinding";
import { Position } from "./types";

// Constants for assertions
const SQRT_2 = Math.sqrt(2);

/**
 * Helper to calculate total path cost (sum of movement costs).
 */
function calculatePathCost(path: Position[]): number {
  if (path.length <= 1) return 0;

  let totalCost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]!;
    const to = path[i + 1]!;
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    // Diagonal move costs sqrt(2), cardinal move costs 1
    if (dx === 1 && dy === 1) {
      totalCost += SQRT_2;
    } else {
      totalCost += 1;
    }
  }

  return totalCost;
}

describe("findPath - Basic Cardinal Paths", () => {
  it("should find straight-line horizontal path (east)", () => {
    const start: Position = { x: 0, y: 5 };
    const goal: Position = { x: 4, y: 5 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path.length).toBe(5); // start + 4 steps
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(goal);

    // All intermediate positions should have y=5
    for (const pos of path) {
      expect(pos.y).toBe(5);
    }
  });

  it("should find straight-line vertical path (south)", () => {
    const start: Position = { x: 3, y: 0 };
    const goal: Position = { x: 3, y: 5 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path.length).toBe(6); // start + 5 steps
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(goal);

    // All positions should have x=3
    for (const pos of path) {
      expect(pos.x).toBe(3);
    }
  });
});

describe("findPath - Diagonal Paths", () => {
  it("should find optimal diagonal path (southeast)", () => {
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: 4, y: 4 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path.length).toBe(5); // start + 4 diagonal steps
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(goal);

    // Each step should move diagonally (+1, +1)
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]!;
      const to = path[i + 1]!;
      expect(to.x - from.x).toBe(1);
      expect(to.y - from.y).toBe(1);
    }

    // Verify path cost
    const cost = calculatePathCost(path);
    expect(cost).toBeCloseTo(4 * SQRT_2, 2);
  });

  it("should find diagonal path in negative direction (northwest)", () => {
    const start: Position = { x: 7, y: 7 };
    const goal: Position = { x: 3, y: 3 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path.length).toBe(5); // start + 4 diagonal steps
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(goal);

    // Each step should move diagonally (-1, -1)
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]!;
      const to = path[i + 1]!;
      expect(to.x - from.x).toBe(-1);
      expect(to.y - from.y).toBe(-1);
    }
  });
});

describe("findPath - Mixed Paths", () => {
  it("should combine cardinal and diagonal moves optimally", () => {
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: 3, y: 5 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    // Path should be start + 5 moves (3 diagonal + 2 cardinal)
    expect(path.length).toBe(6);
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(goal);

    // Total cost should be less than pure cardinal path (3 + 5 = 8)
    const cost = calculatePathCost(path);
    expect(cost).toBeLessThan(8);
  });

  it("should prefer cardinal over diagonal when cheaper", () => {
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: 1, y: 0 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);

    // Should use cardinal move (cost 1), not diagonal
    const cost = calculatePathCost(path);
    expect(cost).toBe(1);
  });
});

describe("findPath - Obstacle Avoidance", () => {
  it("should navigate around single obstacle", () => {
    const start: Position = { x: 0, y: 5 };
    const goal: Position = { x: 2, y: 5 };
    const obstacles = new Set<string>([positionKey({ x: 1, y: 5 })]);

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path[path.length - 1]).toEqual(goal);
    expect(path.length).toBeGreaterThanOrEqual(3); // Optimal detour path is exactly 3 nodes

    // Path should not contain the obstacle
    for (const pos of path) {
      expect(positionKey(pos)).not.toBe("1,5");
    }

    // Path should go through (1,4) or (1,6)
    const pathKeys = path.map(positionKey);
    expect(pathKeys.includes("1,4") || pathKeys.includes("1,6")).toBe(true);
  });

  it("should navigate around horizontal wall", () => {
    const start: Position = { x: 0, y: 5 };
    const goal: Position = { x: 4, y: 5 };
    const obstacles = new Set<string>([
      positionKey({ x: 1, y: 5 }),
      positionKey({ x: 2, y: 5 }),
      positionKey({ x: 3, y: 5 }),
    ]);

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path[path.length - 1]).toEqual(goal);

    // Path should avoid all obstacle cells
    for (const pos of path) {
      expect(obstacles.has(positionKey(pos))).toBe(false);
    }

    // Path should go above or below the wall (y !== 5 at some point)
    const hasDetour = path.some((pos) => pos.y !== 5);
    expect(hasDetour).toBe(true);
  });

  it("should navigate around L-shaped obstacle", () => {
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: 2, y: 2 };
    // Corrected obstacle configuration: blocks direct path but allows detour
    const obstacles = new Set<string>([
      positionKey({ x: 1, y: 0 }),
      positionKey({ x: 1, y: 1 }),
      positionKey({ x: 2, y: 1 }),
    ]);

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path[path.length - 1]).toEqual(goal);

    // Path should avoid all obstacle cells
    for (const pos of path) {
      expect(obstacles.has(positionKey(pos))).toBe(false);
    }
  });

  it("should navigate through narrow corridor", () => {
    const start: Position = { x: 0, y: 5 };
    const goal: Position = { x: 4, y: 5 };

    // Wall from (2,0) to (2,4) and (2,6) to (2,9), leaving gap at (2,5)
    const obstacles = new Set<string>();
    for (let y = 0; y <= 4; y++) {
      obstacles.add(positionKey({ x: 2, y }));
    }
    for (let y = 6; y <= 9; y++) {
      obstacles.add(positionKey({ x: 2, y }));
    }

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path[path.length - 1]).toEqual(goal);

    // Path should go through the gap at (2,5)
    const pathKeys = path.map(positionKey);
    expect(pathKeys.includes("2,5")).toBe(true);
  });
});

describe("findPath - Edge Cases", () => {
  it("should handle start equals goal", () => {
    const start: Position = { x: 5, y: 5 };
    const goal: Position = { x: 5, y: 5 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path).toEqual([{ x: 5, y: 5 }]);
    expect(path.length).toBe(1);
  });

  it("should return empty path when goal is obstacle", () => {
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: 3, y: 3 };
    const obstacles = new Set<string>([positionKey({ x: 3, y: 3 })]);

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path).toEqual([]);
  });

  it("should return empty path when start out of bounds", () => {
    const start: Position = { x: -1, y: 5 };
    const goal: Position = { x: 5, y: 5 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path).toEqual([]);
  });

  it("should return empty path when goal out of bounds", () => {
    const start: Position = { x: 5, y: 5 };
    const goal: Position = { x: 15, y: 5 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path).toEqual([]);
  });

  it("should handle adjacent start and goal", () => {
    const start: Position = { x: 5, y: 5 };
    const goal: Position = { x: 6, y: 5 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path).toEqual([
      { x: 5, y: 5 },
      { x: 6, y: 5 },
    ]);
    expect(path.length).toBe(2);
  });

  it("should return empty path when target completely blocked", () => {
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: 5, y: 5 };

    // Surround goal with obstacles
    const obstacles = new Set<string>([
      positionKey({ x: 4, y: 4 }),
      positionKey({ x: 5, y: 4 }),
      positionKey({ x: 6, y: 4 }),
      positionKey({ x: 4, y: 5 }),
      positionKey({ x: 6, y: 5 }),
      positionKey({ x: 4, y: 6 }),
      positionKey({ x: 5, y: 6 }),
      positionKey({ x: 6, y: 6 }),
    ]);

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path).toEqual([]);
  });

  it("should return empty path when mover surrounded", () => {
    const start: Position = { x: 5, y: 5 };
    const goal: Position = { x: 0, y: 0 };

    // Surround start with obstacles
    const obstacles = new Set<string>([
      positionKey({ x: 4, y: 4 }),
      positionKey({ x: 5, y: 4 }),
      positionKey({ x: 6, y: 4 }),
      positionKey({ x: 4, y: 5 }),
      positionKey({ x: 6, y: 5 }),
      positionKey({ x: 4, y: 6 }),
      positionKey({ x: 5, y: 6 }),
      positionKey({ x: 6, y: 6 }),
    ]);

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path).toEqual([]);
  });
});

describe("findPath - Performance and Scale", () => {
  it("should work on empty grid with no obstacles", () => {
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: 9, y: 9 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path.length).toBe(10); // start + 9 diagonal steps
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(goal);

    // Should be optimal diagonal route
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]!;
      const to = path[i + 1]!;
      expect(to.x - from.x).toBe(1);
      expect(to.y - from.y).toBe(1);
    }
  });

  it("should verify path cost calculation", () => {
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: 2, y: 1 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, 10, 10, obstacles);

    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual(goal);

    // Optimal path: diagonal (0,0)->(1,1) then cardinal (1,1)->(2,1)
    // OR cardinal (0,0)->(1,0) then diagonal (1,0)->(2,1)
    // Both cost sqrt(2) + 1 ≈ 2.414
    const cost = calculatePathCost(path);
    expect(cost).toBeCloseTo(SQRT_2 + 1, 2);

    // Alternative pure cardinal path would cost 3
    expect(cost).toBeLessThan(3);
  });

  it("should complete efficiently without exploring unnecessary nodes", () => {
    const start: Position = { x: 0, y: 10 };
    const goal: Position = { x: 19, y: 10 };
    const obstacles = new Set<string>();

    const startTime = performance.now();
    const path = findPath(start, goal, 20, 20, obstacles);
    const endTime = performance.now();

    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual(goal);

    // Should complete quickly (heuristic guides search efficiently)
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(10); // milliseconds
  });

  it("should scale to large grid (30x30)", () => {
    const start: Position = { x: 0, y: 0 };
    const goal: Position = { x: 29, y: 29 };

    // Scattered obstacles (not blocking path)
    const obstacles = new Set<string>([
      positionKey({ x: 5, y: 5 }),
      positionKey({ x: 10, y: 10 }),
      positionKey({ x: 15, y: 15 }),
      positionKey({ x: 20, y: 20 }),
      positionKey({ x: 25, y: 25 }),
    ]);

    const startTime = performance.now();
    const path = findPath(start, goal, 30, 30, obstacles);
    const endTime = performance.now();

    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual(goal);

    // Should complete within reasonable time
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(100); // milliseconds

    // Path should avoid obstacles
    for (const pos of path) {
      expect(obstacles.has(positionKey(pos))).toBe(false);
    }

    // Path should stay in bounds
    for (const pos of path) {
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThan(30);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThan(30);
    }
  });
});
