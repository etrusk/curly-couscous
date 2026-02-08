/**
 * Tests for multi-step movement computation (computeMultiStepDestination).
 * Phase 5: Supports distance > 1 for Dash skill.
 */

import { describe, it, expect } from "vitest";
import { computeMoveDestination } from "./game-movement";
import { computeMultiStepDestination } from "./game-movement";
import { createCharacter } from "./game-test-helpers";
import { hexDistance } from "./hex";

describe("computeMultiStepDestination", () => {
  describe("towards mode", () => {
    it("distance=1 returns same result as single-step computeMoveDestination", () => {
      const mover = createCharacter({
        id: "mover",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const target = createCharacter({
        id: "target",
        faction: "enemy",
        position: { q: 3, r: 0 },
      });
      const allChars = [mover, target];

      const singleStep = computeMoveDestination(
        mover,
        target,
        "towards",
        allChars,
      );
      const multiStep = computeMultiStepDestination(
        mover,
        target,
        "towards",
        allChars,
        1,
      );

      expect(singleStep).toEqual({ q: 1, r: 0 });
      expect(multiStep).toEqual(singleStep);
    });

    it("distance=2 with clear path advances 2 hexes toward target", () => {
      const mover = createCharacter({
        id: "mover",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const target = createCharacter({
        id: "target",
        faction: "enemy",
        position: { q: 3, r: 0 },
      });
      const allChars = [mover, target];

      const result = computeMultiStepDestination(
        mover,
        target,
        "towards",
        allChars,
        2,
      );

      expect(result).toEqual({ q: 2, r: 0 });
    });

    it("distance=2 with second step blocked results in partial movement", () => {
      const mover = createCharacter({
        id: "mover",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const target = createCharacter({
        id: "target",
        faction: "enemy",
        position: { q: 3, r: 0 },
      });
      const blocker = createCharacter({
        id: "blocker",
        faction: "enemy",
        position: { q: 2, r: 0 },
      });
      const allChars = [mover, target, blocker];

      const result = computeMultiStepDestination(
        mover,
        target,
        "towards",
        allChars,
        2,
      );

      // Should have moved at least 1 step
      expect(result).not.toEqual({ q: 0, r: 0 });
      // Should not have reached the blocked cell
      expect(result).not.toEqual({ q: 2, r: 0 });
      // Should be between 1 and 2 hexes from start
      const dist = hexDistance(result, { q: 0, r: 0 });
      expect(dist).toBeGreaterThanOrEqual(1);
      expect(dist).toBeLessThanOrEqual(2);
    });

    it("distance=2 with first step fully blocked stays at origin", () => {
      const mover = createCharacter({
        id: "mover",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const target = createCharacter({
        id: "target",
        faction: "enemy",
        position: { q: 3, r: 0 },
      });
      // Block ALL 6 hex neighbors of (0,0)
      const b1 = createCharacter({
        id: "b1",
        faction: "enemy",
        position: { q: 1, r: 0 },
      });
      const b2 = createCharacter({
        id: "b2",
        faction: "enemy",
        position: { q: -1, r: 0 },
      });
      const b3 = createCharacter({
        id: "b3",
        faction: "enemy",
        position: { q: 0, r: 1 },
      });
      const b4 = createCharacter({
        id: "b4",
        faction: "enemy",
        position: { q: 0, r: -1 },
      });
      const b5 = createCharacter({
        id: "b5",
        faction: "enemy",
        position: { q: 1, r: -1 },
      });
      const b6 = createCharacter({
        id: "b6",
        faction: "enemy",
        position: { q: -1, r: 1 },
      });
      const allChars = [mover, target, b1, b2, b3, b4, b5, b6];

      const result = computeMultiStepDestination(
        mover,
        target,
        "towards",
        allChars,
        2,
      );

      expect(result).toEqual({ q: 0, r: 0 });
    });
  });

  describe("away mode", () => {
    it("distance=2 with clear path moves 2 hexes away from target", () => {
      const mover = createCharacter({
        id: "mover",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const target = createCharacter({
        id: "target",
        faction: "enemy",
        position: { q: 2, r: 0 },
      });
      const allChars = [mover, target];

      const result = computeMultiStepDestination(
        mover,
        target,
        "away",
        allChars,
        2,
      );

      // Should have moved further from target
      const originalDist = hexDistance({ q: 0, r: 0 }, { q: 2, r: 0 });
      const newDist = hexDistance(result, { q: 2, r: 0 });
      expect(newDist).toBeGreaterThan(originalDist);
      // Should have moved exactly 2 steps from start
      expect(hexDistance(result, { q: 0, r: 0 })).toBe(2);
    });

    it("distance=2 with second step blocked results in partial movement", () => {
      const mover = createCharacter({
        id: "mover",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const target = createCharacter({
        id: "target",
        faction: "enemy",
        position: { q: 2, r: 0 },
      });
      // Block the cells around the first away-step position to limit second step
      // First step away from (2,0) should go to (-1,0) or similar
      // Place blockers to constrain second step options
      const b1 = createCharacter({
        id: "b1",
        faction: "enemy",
        position: { q: -2, r: 0 },
      });
      const b2 = createCharacter({
        id: "b2",
        faction: "enemy",
        position: { q: -2, r: 1 },
      });
      const b3 = createCharacter({
        id: "b3",
        faction: "enemy",
        position: { q: -1, r: -1 },
      });
      const b4 = createCharacter({
        id: "b4",
        faction: "enemy",
        position: { q: 0, r: -1 },
      });
      const b5 = createCharacter({
        id: "b5",
        faction: "enemy",
        position: { q: -1, r: 1 },
      });
      const allChars = [mover, target, b1, b2, b3, b4, b5];

      const result = computeMultiStepDestination(
        mover,
        target,
        "away",
        allChars,
        2,
      );

      // Should have moved at least 1 step
      expect(result).not.toEqual({ q: 0, r: 0 });
      expect(hexDistance(result, { q: 0, r: 0 })).toBeGreaterThanOrEqual(1);
    });

    it("distance=2 with all neighbors blocked stays at origin", () => {
      const mover = createCharacter({
        id: "mover",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const target = createCharacter({
        id: "target",
        faction: "enemy",
        position: { q: 2, r: 0 },
      });
      // Block ALL 6 hex neighbors of (0,0)
      const b1 = createCharacter({
        id: "b1",
        faction: "enemy",
        position: { q: 1, r: 0 },
      });
      const b2 = createCharacter({
        id: "b2",
        faction: "enemy",
        position: { q: -1, r: 0 },
      });
      const b3 = createCharacter({
        id: "b3",
        faction: "enemy",
        position: { q: 0, r: 1 },
      });
      const b4 = createCharacter({
        id: "b4",
        faction: "enemy",
        position: { q: 0, r: -1 },
      });
      const b5 = createCharacter({
        id: "b5",
        faction: "enemy",
        position: { q: 1, r: -1 },
      });
      const b6 = createCharacter({
        id: "b6",
        faction: "enemy",
        position: { q: -1, r: 1 },
      });
      const allChars = [mover, target, b1, b2, b3, b4, b5, b6];

      const result = computeMultiStepDestination(
        mover,
        target,
        "away",
        allChars,
        2,
      );

      expect(result).toEqual({ q: 0, r: 0 });
    });

    it("distance=1 produces identical result to single-step computeMoveDestination", () => {
      const mover = createCharacter({
        id: "mover",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const target = createCharacter({
        id: "target",
        faction: "enemy",
        position: { q: 2, r: 0 },
      });
      const allChars = [mover, target];

      const singleStep = computeMoveDestination(
        mover,
        target,
        "away",
        allChars,
      );
      const multiStep = computeMultiStepDestination(
        mover,
        target,
        "away",
        allChars,
        1,
      );

      expect(multiStep).toEqual(singleStep);
    });
  });

  describe("defaults", () => {
    it("distance=undefined defaults to 1 step", () => {
      const mover = createCharacter({
        id: "mover",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const target = createCharacter({
        id: "target",
        faction: "enemy",
        position: { q: 3, r: 0 },
      });
      const allChars = [mover, target];

      // Call without the distance parameter
      const result = computeMultiStepDestination(
        mover,
        target,
        "towards",
        allChars,
      );

      expect(result).toEqual({ q: 1, r: 0 });
    });
  });
});
