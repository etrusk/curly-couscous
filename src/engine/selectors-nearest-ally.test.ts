/**
 * Tests for `nearest_ally` selector.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateSelector } from "./selectors";
import { Selector } from "./types";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateSelector", () => {
  // =========================================================================
  // Section 3: `nearest_ally` Selector
  // =========================================================================
  describe("nearest_ally selector", () => {
    it("should return closest ally by Chebyshev distance", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const allyA = createCharacter({
        id: "allyA",
        faction: "friendly",
        position: { x: 5, y: 7 }, // dist=2
      });
      const allyB = createCharacter({
        id: "allyB",
        faction: "friendly",
        position: { x: 8, y: 5 }, // dist=3
      });
      const selector: Selector = { type: "nearest_ally" };

      const result = evaluateSelector(selector, evaluator, [
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
        position: { x: 5, y: 5 },
      });
      const selector: Selector = { type: "nearest_ally" };

      const result = evaluateSelector(selector, evaluator, [evaluator]);

      expect(result).toBeNull();
    });

    it("should ignore enemies when selecting nearest ally", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 5, y: 6 }, // dist=1
      });
      const ally = createCharacter({
        id: "ally",
        faction: "friendly",
        position: { x: 5, y: 8 }, // dist=3
      });
      const selector: Selector = { type: "nearest_ally" };

      const result = evaluateSelector(selector, evaluator, [
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
        position: { x: 5, y: 5 },
      });
      const selector: Selector = { type: "nearest_ally" };

      const result = evaluateSelector(selector, evaluator, [evaluator]);

      expect(result).toBeNull();
    });
  });
});
