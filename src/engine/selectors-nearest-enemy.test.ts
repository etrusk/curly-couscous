/**
 * Tests for nearest enemy target+criterion evaluation.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateTargetCriterion", () => {
  // =========================================================================
  // Section 2: target="enemy", criterion="nearest"
  // =========================================================================
  describe("enemy nearest", () => {
    it("should return closest enemy by hex distance", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { q: 0, r: 2 }, // dist=2
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { q: 3, r: 0 }, // dist=3
      });

      const result = evaluateTargetCriterion("enemy", "nearest", evaluator, [
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
        position: { q: 0, r: 0 },
      });
      const ally = createCharacter({
        id: "ally",
        faction: "friendly",
        position: { q: 0, r: 1 }, // dist=1
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 0, r: 3 }, // dist=3
      });

      const result = evaluateTargetCriterion("enemy", "nearest", evaluator, [
        evaluator,
        ally,
        enemy,
      ]);

      expect(result).toBe(enemy);
    });

    it("should handle non-adjacent distances correctly (hex)", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { q: 1, r: 1 }, // hex dist=2
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { q: 0, r: 3 }, // dist=3
      });

      const result = evaluateTargetCriterion("enemy", "nearest", evaluator, [
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
        position: { q: 0, r: 0 },
      });
      const ally = createCharacter({
        id: "ally",
        faction: "friendly",
        position: { q: 1, r: 1 },
      });

      const result = evaluateTargetCriterion("enemy", "nearest", evaluator, [
        evaluator,
        ally,
      ]);

      expect(result).toBeNull();
    });
  });
});
