/**
 * Tests for `self` selector.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateSelector } from "./selectors";
import { Selector } from "./types";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateSelector", () => {
  // =========================================================================
  // Section 1: `self` Selector
  // =========================================================================
  describe("self selector", () => {
    it("should return evaluator for self selector", () => {
      const evaluator = createCharacter({
        id: "eval",
        position: { x: 5, y: 5 },
      });
      const selector: Selector = { type: "self" };

      const result = evaluateSelector(selector, evaluator, [evaluator]);

      expect(result).toBe(evaluator);
    });

    it("should return evaluator regardless of other characters", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 3, y: 3 },
      });
      const enemy1 = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { x: 3, y: 4 },
      });
      const enemy2 = createCharacter({
        id: "enemy2",
        faction: "enemy",
        position: { x: 4, y: 3 },
      });
      const selector: Selector = { type: "self" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemy1,
        enemy2,
      ]);

      expect(result).toBe(evaluator);
    });
  });
});
