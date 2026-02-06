/**
 * Tests for lowest HP enemy target+criterion evaluation.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateTargetCriterion", () => {
  // =========================================================================
  // Section 4: target="enemy", criterion="lowest_hp"
  // =========================================================================
  describe("enemy lowest_hp", () => {
    it("should return enemy with lowest current HP", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        hp: 75,
        position: { q: 3, r: 0 },
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        hp: 50,
        position: { q: 2, r: 2 },
      });
      const enemyC = createCharacter({
        id: "enemyC",
        faction: "enemy",
        hp: 90,
        position: { q: 3, r: 2 },
      });

      const result = evaluateTargetCriterion("enemy", "lowest_hp", evaluator, [
        evaluator,
        enemyA,
        enemyB,
        enemyC,
      ]);

      expect(result).toBe(enemyB);
    });

    it("should ignore allies when selecting lowest HP enemy", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const ally = createCharacter({
        id: "ally",
        faction: "friendly",
        hp: 10,
        position: { q: 2, r: 2 },
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        hp: 50,
        position: { q: 3, r: 2 },
      });

      const result = evaluateTargetCriterion("enemy", "lowest_hp", evaluator, [
        evaluator,
        ally,
        enemy,
      ]);

      expect(result).toBe(enemy);
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
        position: { q: 2, r: 2 },
      });

      const result = evaluateTargetCriterion("enemy", "lowest_hp", evaluator, [
        evaluator,
        ally,
      ]);

      expect(result).toBeNull();
    });
  });
});
