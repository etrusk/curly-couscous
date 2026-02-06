/**
 * Tests for tie-breaking rules in target+criterion evaluation.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateTargetCriterion", () => {
  // =========================================================================
  // Section 6: Tie-Breaking (Section 6.2)
  // =========================================================================
  describe("tie-breaking rules", () => {
    it("enemy nearest: should prefer lower R when distances equal", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { q: 1, r: -1 }, // hex dist=1, R=-1
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { q: -1, r: 1 }, // hex dist=1, R=1
      });

      const result = evaluateTargetCriterion("enemy", "nearest", evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // R=-1 < R=1
    });

    it("enemy nearest: should prefer lower Q when R and distances equal", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { q: -1, r: 0 }, // hex dist=1, Q=-1
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { q: 1, r: 0 }, // hex dist=1, Q=1
      });

      const result = evaluateTargetCriterion("enemy", "nearest", evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // Q=-1 < Q=1
    });

    it("enemy lowest_hp: should prefer lower R when HP equal", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        hp: 50,
        position: { q: -2, r: -1 }, // R=-1
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        hp: 50,
        position: { q: 2, r: 1 }, // R=1
      });

      const result = evaluateTargetCriterion("enemy", "lowest_hp", evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // R=-1 < R=1
    });

    it("enemy lowest_hp: should prefer lower Q when HP and R equal", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        hp: 50,
        position: { q: -1, r: 2 }, // Q=-1
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        hp: 50,
        position: { q: 2, r: 2 }, // Q=2
      });

      const result = evaluateTargetCriterion("enemy", "lowest_hp", evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // Q=-1 < Q=2
    });

    it("enemy nearest: three-way tie resolved correctly", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { q: 0, r: -1 }, // hex dist=1, R=-1
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { q: 1, r: 0 }, // hex dist=1, R=0
      });
      const enemyC = createCharacter({
        id: "enemyC",
        faction: "enemy",
        position: { q: -1, r: 0 }, // hex dist=1, R=0
      });

      const result = evaluateTargetCriterion("enemy", "nearest", evaluator, [
        evaluator,
        enemyA,
        enemyB,
        enemyC,
      ]);

      expect(result).toBe(enemyA); // Lowest R=-1
    });
  });
});
