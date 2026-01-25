/**
 * Tests for metric independence in selectors.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateSelector } from "./selectors";
import { Selector } from "./types";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateSelector", () => {
  // =========================================================================
  // Section 7: Metric Independence
  // =========================================================================
  describe("metric independence", () => {
    it("nearest_enemy: should select by distance regardless of HP values", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        hp: 100,
        position: { x: 5, y: 6 }, // dist=1
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        hp: 10,
        position: { x: 5, y: 9 }, // dist=4
      });
      const selector: Selector = { type: "nearest_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // Closer, despite higher HP
    });

    it("lowest_hp_enemy: should select by HP regardless of distance", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        hp: 100,
        position: { x: 5, y: 6 }, // dist=1
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        hp: 10,
        position: { x: 5, y: 9 }, // dist=4
      });
      const selector: Selector = { type: "lowest_hp_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyB); // Lower HP, despite farther distance
    });
  });
});
