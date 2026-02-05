/**
 * Tests for `highest_hp` criterion selector.
 * Mirror of lowest_hp selector logic - maximizes HP instead of minimizing.
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateTargetCriterion - highest_hp criterion", () => {
  describe("highest_hp enemy", () => {
    it("should return enemy with maximum HP", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { q: 0, r: 1 },
        hp: 50,
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { q: 0, r: 2 },
        hp: 80,
      });

      const result = evaluateTargetCriterion("enemy", "highest_hp", evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyB);
    });

    it("should tiebreak by lower R then lower Q when HP is equal", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { q: -2, r: -1 }, // R=-1
        hp: 80,
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { q: 2, r: 1 }, // R=1
        hp: 80,
      });

      const result = evaluateTargetCriterion("enemy", "highest_hp", evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA);
    });

    it("should ignore dead characters (hp <= 0)", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { q: 0, r: 1 },
        hp: 0,
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { q: 0, r: 2 },
        hp: 30,
      });

      const result = evaluateTargetCriterion("enemy", "highest_hp", evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyB);
    });
  });

  describe("highest_hp ally", () => {
    it("should return ally with maximum HP excluding self", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
        hp: 100,
      });
      const allyA = createCharacter({
        id: "allyA",
        faction: "friendly",
        position: { q: 0, r: 1 },
        hp: 60,
      });
      const allyB = createCharacter({
        id: "allyB",
        faction: "friendly",
        position: { q: 0, r: 2 },
        hp: 90,
      });

      const result = evaluateTargetCriterion("ally", "highest_hp", evaluator, [
        evaluator,
        allyA,
        allyB,
      ]);

      expect(result).toBe(allyB);
    });

    it("should return null when only evaluator exists", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });

      const result = evaluateTargetCriterion("ally", "highest_hp", evaluator, [
        evaluator,
      ]);

      expect(result).toBeNull();
    });
  });
});
