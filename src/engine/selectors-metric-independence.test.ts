/**
 * Tests for metric independence in target+criterion evaluation.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateTargetCriterion", () => {
  // =========================================================================
  // Section 7: Metric Independence
  // =========================================================================
  describe("metric independence", () => {
    it("enemy nearest: should select by distance regardless of HP values", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        hp: 100,
        position: { q: 0, r: 1 }, // dist=1
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        hp: 10,
        position: { q: 0, r: 4 }, // dist=4
      });

      const result = evaluateTargetCriterion("enemy", "nearest", evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // Closer, despite higher HP
    });

    it("enemy lowest_hp: should select by HP regardless of distance", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        hp: 100,
        position: { q: 0, r: 1 }, // dist=1
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        hp: 10,
        position: { q: 0, r: 4 }, // dist=4
      });

      const result = evaluateTargetCriterion("enemy", "lowest_hp", evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyB); // Lower HP, despite farther distance
    });
  });
});
