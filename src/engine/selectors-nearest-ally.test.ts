/**
 * Tests for nearest ally target+criterion evaluation.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateTargetCriterion", () => {
  // =========================================================================
  // Section 3: target="ally", criterion="nearest"
  // =========================================================================
  describe("ally nearest", () => {
    it("should return closest ally by Chebyshev distance", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const allyA = createCharacter({
        id: "allyA",
        faction: "friendly",
        position: { q: 0, r: 2 }, // dist=2
      });
      const allyB = createCharacter({
        id: "allyB",
        faction: "friendly",
        position: { q: 3, r: 0 }, // dist=3
      });

      const result = evaluateTargetCriterion("ally", "nearest", evaluator, [
        evaluator,
        allyA,
        allyB,
      ]);

      expect(result).toBe(allyA);
    });

    it("should exclude self from ally selection", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });

      const result = evaluateTargetCriterion("ally", "nearest", evaluator, [
        evaluator,
      ]);

      expect(result).toBeNull();
    });

    it("should ignore enemies when selecting nearest ally", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 0, r: 1 }, // dist=1
      });
      const ally = createCharacter({
        id: "ally",
        faction: "friendly",
        position: { q: 0, r: 3 }, // dist=3
      });

      const result = evaluateTargetCriterion("ally", "nearest", evaluator, [
        evaluator,
        enemy,
        ally,
      ]);

      expect(result).toBe(ally);
    });

    it("should return null when only evaluator exists (no other allies)", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });

      const result = evaluateTargetCriterion("ally", "nearest", evaluator, [
        evaluator,
      ]);

      expect(result).toBeNull();
    });
  });
});
