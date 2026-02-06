/**
 * Tests for self target+criterion evaluation.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateTargetCriterion", () => {
  // =========================================================================
  // Section 1: target="self"
  // =========================================================================
  describe("self target", () => {
    it("should return evaluator for self target", () => {
      const evaluator = createCharacter({
        id: "eval",
        position: { q: 0, r: 0 },
      });

      const result = evaluateTargetCriterion("self", "nearest", evaluator, [
        evaluator,
      ]);

      expect(result).toBe(evaluator);
    });

    it("should return evaluator regardless of other characters", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 3, r: 0 },
      });
      const enemy1 = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { q: 3, r: 1 },
      });
      const enemy2 = createCharacter({
        id: "enemy2",
        faction: "enemy",
        position: { q: 4, r: 0 },
      });

      const result = evaluateTargetCriterion("self", "nearest", evaluator, [
        evaluator,
        enemy1,
        enemy2,
      ]);

      expect(result).toBe(evaluator);
    });
  });
});
