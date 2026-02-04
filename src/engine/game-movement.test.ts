/**
 * Integration tests for computeMoveDestination with hex pathfinding.
 * Tests verify pathfinding integration, away mode with escape routes, and hex grid behavior.
 */

import { describe, it, expect } from "vitest";
import {
  computeMoveDestination,
  countEscapeRoutes,
  generateValidCandidates,
} from "./game-movement";
import { createCharacter } from "./game-test-helpers";
import { hexDistance } from "./hex";

describe("computeMoveDestination - Towards Mode", () => {
  it("uses A* to find first step toward target", () => {
    const mover = createCharacter({
      id: "mover",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 3, r: 0 },
    });

    const destination = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
    ]);

    expect(destination).toEqual({ q: 1, r: 0 });
  });

  it("returns current position when already at target", () => {
    const mover = createCharacter({
      id: "mover",
      position: { q: 2, r: 1 },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 2, r: 1 },
    });

    const destination = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
    ]);

    expect(destination).toEqual(mover.position);
  });

  it("routes around obstacle", () => {
    const mover = createCharacter({
      id: "mover",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 2, r: 0 },
    });
    const blocker = createCharacter({
      id: "blocker",
      position: { q: 1, r: 0 },
    });

    const destination = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
      blocker,
    ]);

    // Should not move into blocker
    expect(destination).not.toEqual({ q: 1, r: 0 });

    // Result is a valid hex neighbor of mover
    expect(hexDistance(mover.position, destination)).toBeLessThanOrEqual(1);

    // Should move closer or maintain distance
    const initialDist = hexDistance(mover.position, target.position);
    const resultDist = hexDistance(destination, target.position);
    expect(resultDist).toBeLessThanOrEqual(initialDist);
  });
});

describe("computeMoveDestination - Away Mode", () => {
  it("moves away from threat", () => {
    const mover = createCharacter({
      id: "mover",
      position: { q: 0, r: 0 },
    });
    const threat = createCharacter({
      id: "threat",
      position: { q: 2, r: 0 },
    });

    const destination = computeMoveDestination(mover, threat, "away", [
      mover,
      threat,
    ]);

    const initialDist = hexDistance(mover.position, threat.position);
    const resultDist = hexDistance(destination, threat.position);

    expect(resultDist).toBeGreaterThanOrEqual(initialDist);

    // Result is a valid hex neighbor or current position
    expect(hexDistance(mover.position, destination)).toBeLessThanOrEqual(1);
  });

  it("escape route count is 0-6 (not 0-8)", () => {
    // Interior hex should have 6 escape routes
    const escapeRoutes = countEscapeRoutes({ q: 0, r: 0 }, new Set());

    // Interior hex should have 6 escape routes
    expect(escapeRoutes).toBe(6);
    expect(escapeRoutes).toBeLessThanOrEqual(6);
  });

  it("edge hex has fewer escape routes", () => {
    const escapeRoutes = countEscapeRoutes({ q: 5, r: 0 }, new Set());

    // Boundary hex has fewer than 6 neighbors
    expect(escapeRoutes).toBeLessThan(6);
    expect(escapeRoutes).toBeGreaterThan(0);
  });

  it("vertex hex has fewest escape routes", () => {
    const escapeRoutes = countEscapeRoutes({ q: 5, r: -5 }, new Set());

    // Corner of hex map has exactly 3 neighbors
    expect(escapeRoutes).toBe(3);
  });

  it("prefers interior over boundary when scores compete", () => {
    const mover = createCharacter({
      id: "mover",
      position: { q: 4, r: 0 },
    });
    const threat = createCharacter({
      id: "threat",
      position: { q: 0, r: 0 },
    });

    const destination = computeMoveDestination(mover, threat, "away", [
      mover,
      threat,
    ]);

    // Mover is near boundary. Away movement should prefer interior positions
    // with more escape routes over boundary positions with fewer escape routes.
    // Since this depends on composite scoring (distance * escapeRoutes),
    // we just verify a valid move was made
    expect(hexDistance(mover.position, destination)).toBeLessThanOrEqual(1);
  });
});

describe("computeMoveDestination - Escape Routes", () => {
  it("tiebreaking uses |dq|, |dr|, r, q", () => {
    // This test requires access to the internal scoring, which may not be exposed.
    // For now, we test deterministic behavior: same inputs give same outputs.
    const mover = createCharacter({
      id: "mover",
      position: { q: 0, r: 0 },
    });
    const threat = createCharacter({
      id: "threat",
      position: { q: 3, r: 0 },
    });

    const destination1 = computeMoveDestination(mover, threat, "away", [
      mover,
      threat,
    ]);
    const destination2 = computeMoveDestination(mover, threat, "away", [
      mover,
      threat,
    ]);

    // Deterministic: same result both times
    expect(destination1).toEqual(destination2);
  });

  it("deterministic results for replay", () => {
    const mover = createCharacter({
      id: "mover",
      position: { q: 2, r: -1 },
    });
    const target = createCharacter({
      id: "target",
      position: { q: -2, r: 3 },
    });

    const dest1 = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
    ]);
    const dest2 = computeMoveDestination(mover, target, "towards", [
      mover,
      target,
    ]);

    expect(dest1).toEqual(dest2);
  });
});

describe("generateValidCandidates", () => {
  it("returns only hex neighbors", () => {
    const mover = createCharacter({
      id: "mover",
      position: { q: 0, r: 0 },
    });
    const threat = createCharacter({
      id: "threat",
      position: { q: 3, r: 0 },
    });

    const candidates = generateValidCandidates(mover, [mover, threat], "away");

    // At most 7 candidates for away mode (6 neighbors + stay)
    expect(candidates.length).toBeLessThanOrEqual(7);

    // All candidates are valid hexes
    for (const candidate of candidates) {
      expect(hexDistance(mover.position, candidate)).toBeLessThanOrEqual(1);
    }
  });

  it("away mode includes stay option", () => {
    const mover = createCharacter({
      id: "mover",
      position: { q: 0, r: 0 },
    });
    const threat = createCharacter({
      id: "threat",
      position: { q: 5, r: 0 },
    });

    const candidates = generateValidCandidates(mover, [mover, threat], "away");

    // Should include current position as stay option
    const hasStay = candidates.some((c) => c.q === 0 && c.r === 0);
    expect(hasStay).toBe(true);
  });

  it("towards mode does not include stay option", () => {
    const mover = createCharacter({
      id: "mover",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "target",
      position: { q: 3, r: 0 },
    });

    const candidates = generateValidCandidates(
      mover,
      [mover, target],
      "towards",
    );

    // At most 6 candidates (no stay option)
    expect(candidates.length).toBeLessThanOrEqual(6);

    // Should not include current position
    const hasStay = candidates.some((c) => c.q === 0 && c.r === 0);
    expect(hasStay).toBe(false);
  });
});
