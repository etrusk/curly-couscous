/**
 * Tests for `furthest` criterion selector.
 * Mirror of nearest selector logic - maximizes distance instead of minimizing.
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateTargetCriterion - furthest criterion", () => {
  describe("furthest enemy", () => {
    it("should return furthest enemy by hex distance", () => {
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

      const result = evaluateTargetCriterion("enemy", "furthest", evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyB);
    });

    it("should ignore allies when selecting furthest enemy", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const ally = createCharacter({
        id: "ally",
        faction: "friendly",
        position: { q: 0, r: 5 }, // dist=5, same faction
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 0, r: 2 }, // dist=2, opposite faction
      });

      const result = evaluateTargetCriterion("enemy", "furthest", evaluator, [
        evaluator,
        ally,
        enemy,
      ]);

      expect(result).toBe(enemy);
    });

    it("should tiebreak by lower R then lower Q", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { q: 1, r: -1 }, // dist=1, R=-1
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { q: -1, r: 1 }, // dist=1, R=1
      });

      const result = evaluateTargetCriterion("enemy", "furthest", evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA);
    });

    it("should handle three-way tie with R then Q tiebreak", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { q: 0, r: -1 }, // dist=1, R=-1
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { q: 1, r: 0 }, // dist=1, R=0
      });
      const enemyC = createCharacter({
        id: "enemyC",
        faction: "enemy",
        position: { q: -1, r: 0 }, // dist=1, R=0, Q=-1
      });

      const result = evaluateTargetCriterion("enemy", "furthest", evaluator, [
        evaluator,
        enemyA,
        enemyB,
        enemyC,
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

      const result = evaluateTargetCriterion("enemy", "furthest", evaluator, [
        evaluator,
        ally,
      ]);

      expect(result).toBeNull();
    });
  });

  describe("furthest ally", () => {
    it("should return furthest ally excluding self", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const allyA = createCharacter({
        id: "allyA",
        faction: "friendly",
        position: { q: 0, r: 1 }, // dist=1
      });
      const allyB = createCharacter({
        id: "allyB",
        faction: "friendly",
        position: { q: 0, r: 3 }, // dist=3
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 0, r: 5 }, // dist=5, opposite faction
      });

      const result = evaluateTargetCriterion("ally", "furthest", evaluator, [
        evaluator,
        allyA,
        allyB,
        enemy,
      ]);

      expect(result).toBe(allyB);
    });

    it("should return null when only evaluator exists", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });

      const result = evaluateTargetCriterion("ally", "furthest", evaluator, [
        evaluator,
      ]);

      expect(result).toBeNull();
    });
  });
});
