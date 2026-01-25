/**
 * Tests for `nearest_enemy` selector.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateSelector } from "./selectors";
import { Selector } from "./types";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateSelector", () => {
  // =========================================================================
  // Section 2: `nearest_enemy` Selector
  // =========================================================================
  describe("nearest_enemy selector", () => {
    it("should return closest enemy by Chebyshev distance", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { x: 5, y: 7 }, // dist=2
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { x: 8, y: 5 }, // dist=3
      });
      const selector: Selector = { type: "nearest_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA);
    });

    it("should ignore allies when selecting nearest enemy", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: "ally",
        faction: "friendly",
        position: { x: 5, y: 6 }, // dist=1
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 5, y: 8 }, // dist=3
      });
      const selector: Selector = { type: "nearest_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        ally,
        enemy,
      ]);

      expect(result).toBe(enemy);
    });

    it("should handle diagonal distances correctly (Chebyshev)", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { x: 7, y: 7 }, // dist=2 (diagonal)
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { x: 5, y: 8 }, // dist=3
      });
      const selector: Selector = { type: "nearest_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA);
    });

    it("should return null when no enemies exist", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: "ally",
        faction: "friendly",
        position: { x: 6, y: 6 },
      });
      const selector: Selector = { type: "nearest_enemy" };

      const result = evaluateSelector(selector, evaluator, [evaluator, ally]);

      expect(result).toBeNull();
    });
  });
});
