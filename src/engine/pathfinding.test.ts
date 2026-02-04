/**
 * Unit tests for A* pathfinding algorithm with hex grid.
 * Tests cover 6-directional movement, hex distance heuristic, and hex boundary compliance.
 */

import { describe, it, expect } from "vitest";
import { findPath, positionKey } from "./pathfinding";
import { Position } from "./types";
import { hexDistance, isValidHex } from "./hex";

describe("findPath - Basic Hex Paths", () => {
  it("finds path between adjacent hexes", () => {
    const start: Position = { q: 0, r: 0 };
    const goal: Position = { q: 1, r: 0 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, obstacles);

    expect(path).toHaveLength(2);
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(goal);
  });

  it("finds straight-line path along q-axis", () => {
    const start: Position = { q: 0, r: 0 };
    const goal: Position = { q: 3, r: 0 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, obstacles);

    expect(path).toHaveLength(4);
    expect(path).toEqual([
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 2, r: 0 },
      { q: 3, r: 0 },
    ]);
  });

  it("finds path along r-axis", () => {
    const start: Position = { q: 0, r: 0 };
    const goal: Position = { q: 0, r: 3 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, obstacles);

    expect(path).toHaveLength(4);

    // Each step moves by {dq: 0, dr: 1}
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]!;
      const to = path[i + 1]!;
      expect(to.q - from.q).toBe(0);
      expect(to.r - from.r).toBe(1);
    }
  });

  it("finds path using mixed directions", () => {
    const start: Position = { q: 0, r: 0 };
    const goal: Position = { q: 2, r: 1 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, obstacles);

    // Hex distance is max(2, 1, 3) = 3, so path should be start + 3 steps
    expect(path).toHaveLength(4);

    // All steps are adjacent hex moves
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]!;
      const to = path[i + 1]!;
      expect(hexDistance(from, to)).toBe(1);
    }

    expect(path[path.length - 1]).toEqual(goal);
  });
});

describe("findPath - Path Validity", () => {
  it("all path steps are adjacent hexes (distance 1)", () => {
    const testCases: [Position, Position][] = [
      [
        { q: 0, r: 0 },
        { q: 3, r: 2 },
      ],
      [
        { q: -2, r: 1 },
        { q: 2, r: -1 },
      ],
      [
        { q: -5, r: 0 },
        { q: 5, r: 0 },
      ],
    ];

    for (const [start, goal] of testCases) {
      const path = findPath(start, goal, new Set());

      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i]!;
        const to = path[i + 1]!;
        expect(hexDistance(from, to)).toBe(1);
      }
    }
  });

  it("path cost equals path length minus 1 (uniform cost)", () => {
    const start: Position = { q: 0, r: 0 };
    const goal: Position = { q: 2, r: 1 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, obstacles);

    // Hex distance is 3, path should be 4 nodes (start + 3 steps)
    expect(path.length - 1).toBe(hexDistance(start, goal));
  });

  it("path stays within valid hex bounds", () => {
    const testCases: [Position, Position][] = [
      [
        { q: -4, r: 3 },
        { q: 4, r: -3 },
      ],
      [
        { q: 0, r: -5 },
        { q: 0, r: 5 },
      ],
      [
        { q: 5, r: -5 },
        { q: -5, r: 5 },
      ],
    ];

    for (const [start, goal] of testCases) {
      const path = findPath(start, goal, new Set());

      for (const pos of path) {
        expect(isValidHex(pos, 5)).toBe(true);
      }
    }
  });

  it("path length is optimal (equals hex distance for obstacle-free)", () => {
    const testCases: [Position, Position][] = [
      [
        { q: 0, r: 0 },
        { q: 3, r: 0 },
      ],
      [
        { q: 0, r: 0 },
        { q: 2, r: 1 },
      ],
      [
        { q: -2, r: 3 },
        { q: 1, r: -1 },
      ],
    ];

    for (const [start, goal] of testCases) {
      const path = findPath(start, goal, new Set());
      expect(path.length - 1).toBe(hexDistance(start, goal));
    }
  });

  it("pathfinding uses 6 directions (not 8)", () => {
    const start: Position = { q: 0, r: 0 };
    const goal: Position = { q: 3, r: 2 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, obstacles);

    // Verify no step has |dq| > 1 or |dr| > 1
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]!;
      const to = path[i + 1]!;
      const dq = Math.abs(to.q - from.q);
      const dr = Math.abs(to.r - from.r);

      expect(dq).toBeLessThanOrEqual(1);
      expect(dr).toBeLessThanOrEqual(1);

      // Each step is one of the 6 hex directions
      expect(hexDistance(from, to)).toBe(1);
    }
  });
});

describe("findPath - Obstacle Avoidance", () => {
  it("navigates around single obstacle", () => {
    const start: Position = { q: 0, r: 0 };
    const goal: Position = { q: 2, r: 0 };
    const obstacles = new Set<string>([positionKey({ q: 1, r: 0 })]);

    const path = findPath(start, goal, obstacles);

    expect(path[path.length - 1]).toEqual(goal);
    // Path is [{0,0}, {0,1}, {1,1}, {2,0}] or [{0,0}, {1,-1}, {2,-1}, {2,0}] = 4 positions
    expect(path).toHaveLength(4);

    // Path should not contain the obstacle
    for (const pos of path) {
      expect(positionKey(pos)).not.toBe("1,0");
    }
  });

  it("navigates around wall of obstacles", () => {
    const start: Position = { q: -2, r: 0 };
    const goal: Position = { q: 2, r: 0 };
    const obstacles = new Set<string>([
      positionKey({ q: 0, r: -1 }),
      positionKey({ q: 0, r: 0 }),
      positionKey({ q: 0, r: 1 }),
    ]);

    const path = findPath(start, goal, obstacles);

    expect(path[path.length - 1]).toEqual(goal);

    // Path does not contain any obstacle
    for (const pos of path) {
      expect(obstacles.has(positionKey(pos))).toBe(false);
    }

    // Path goes around the wall (not through r=0 at q=0)
    const midPath = path.slice(1, -1);
    const hasDetour = midPath.some((pos) => pos.r !== 0 || pos.q !== 0);
    expect(hasDetour).toBe(true);
  });
});

describe("findPath - Edge Cases", () => {
  it("returns empty path when goal is an obstacle", () => {
    const start: Position = { q: 0, r: 0 };
    const goal: Position = { q: 3, r: 3 };
    const obstacles = new Set<string>([positionKey(goal)]);

    const path = findPath(start, goal, obstacles);

    expect(path).toEqual([]);
  });

  it("returns single-element path when start equals goal", () => {
    const start: Position = { q: 2, r: 1 };
    const goal: Position = { q: 2, r: 1 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, obstacles);

    expect(path).toEqual([start]);
    expect(path).toHaveLength(1);
  });

  it("returns empty path when start is outside valid hex grid", () => {
    const start: Position = { q: 6, r: 0 };
    const goal: Position = { q: 0, r: 0 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, obstacles);

    expect(path).toEqual([]);
  });

  it("returns empty path when goal is outside valid hex grid", () => {
    const start: Position = { q: 0, r: 0 };
    const goal: Position = { q: 0, r: 6 };
    const obstacles = new Set<string>();

    const path = findPath(start, goal, obstacles);

    expect(path).toEqual([]);
  });

  it("returns empty path when completely surrounded by obstacles", () => {
    const start: Position = { q: 0, r: 0 };
    const goal: Position = { q: 3, r: 0 };

    // Surround start with all 6 neighbors as obstacles
    const obstacles = new Set<string>([
      positionKey({ q: 1, r: 0 }),
      positionKey({ q: -1, r: 0 }),
      positionKey({ q: 0, r: 1 }),
      positionKey({ q: 0, r: -1 }),
      positionKey({ q: 1, r: -1 }),
      positionKey({ q: -1, r: 1 }),
    ]);

    const path = findPath(start, goal, obstacles);

    expect(path).toEqual([]);
  });
});

describe("findPath - API Signature", () => {
  it("accepts obstacles Set and radius parameter", () => {
    const start: Position = { q: 0, r: 0 };
    const goal: Position = { q: 2, r: 1 };
    const obstacles = new Set<string>();

    // New signature without gridWidth/gridHeight
    const path = findPath(start, goal, obstacles);

    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual(goal);
  });

  it("positionKey uses q,r format", () => {
    const pos: Position = { q: 3, r: -2 };
    const key = positionKey(pos);

    expect(key).toBe("3,-2");
  });
});
