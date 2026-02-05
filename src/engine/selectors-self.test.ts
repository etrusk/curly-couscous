/**
 * Tests for `self` selector.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateSelector } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateSelector", () => {
  // =========================================================================
  // Section 1: `self` Selector
  // =========================================================================
  describe("self selector", () => {
    it("should return evaluator for self selector", () => {
      const evaluator = createCharacter({
        id: "eval",
        position: { q: 0, r: 0 },
      });
      const selector = { type: "self" } as const;

      const result = evaluateSelector(selector, evaluator, [evaluator]);

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
      const selector = { type: "self" } as const;

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemy1,
        enemy2,
      ]);

      expect(result).toBe(evaluator);
    });
  });
});
