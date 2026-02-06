/**
 * Tests for edge cases in target+criterion evaluation.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateTargetCriterion", () => {
  // =========================================================================
  // Section 8: Edge Cases
  // =========================================================================
  describe("edge cases", () => {
    it("should return null for any target+criterion when allCharacters is empty", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });

      const result = evaluateTargetCriterion("enemy", "nearest", evaluator, []);

      expect(result).toBeNull();
    });

    it("should handle evaluator at distance 0 from themselves", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });

      const result = evaluateTargetCriterion("enemy", "nearest", evaluator, [
        evaluator,
      ]);

      expect(result).toBeNull(); // No enemies, not self
    });

    it("should handle all characters at same position as evaluator (distance 0)", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemy1 = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { q: 0, r: 0 }, // Same position
      });
      const enemy2 = createCharacter({
        id: "enemy2",
        faction: "enemy",
        position: { q: 0, r: 0 }, // Same position
      });

      const result = evaluateTargetCriterion("enemy", "nearest", evaluator, [
        evaluator,
        enemy1,
        enemy2,
      ]);

      // Note: This test relies on ES2019+ Array.sort() stability.
      // In ES2019+, sort() is guaranteed stable, so equal elements maintain
      // their original order. This ensures deterministic tie-breaking.
      // Should return one of them via tie-break (both at same position, so Y and X equal)
      // Both enemies have same position, so first one in array order
      expect(result).toBe(enemy1);
    });
  });
});
