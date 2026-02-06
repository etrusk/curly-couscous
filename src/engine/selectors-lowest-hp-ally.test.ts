/**
 * Tests for lowest HP ally target+criterion evaluation.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTargetCriterion } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateTargetCriterion", () => {
  // =========================================================================
  // Section 5: target="ally", criterion="lowest_hp"
  // =========================================================================
  describe("ally lowest_hp", () => {
    it("should return ally with lowest current HP", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const allyA = createCharacter({
        id: "allyA",
        faction: "friendly",
        hp: 75,
        position: { q: 3, r: 0 },
      });
      const allyB = createCharacter({
        id: "allyB",
        faction: "friendly",
        hp: 50,
        position: { q: 2, r: 2 },
      });
      const allyC = createCharacter({
        id: "allyC",
        faction: "friendly",
        hp: 90,
        position: { q: 3, r: 2 },
      });

      const result = evaluateTargetCriterion("ally", "lowest_hp", evaluator, [
        evaluator,
        allyA,
        allyB,
        allyC,
      ]);

      expect(result).toBe(allyB);
    });

    it("should exclude self from lowest HP ally selection", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        hp: 10,
        position: { q: 0, r: 0 },
      });
      const ally = createCharacter({
        id: "ally",
        faction: "friendly",
        hp: 50,
        position: { q: 2, r: 2 },
      });

      const result = evaluateTargetCriterion("ally", "lowest_hp", evaluator, [
        evaluator,
        ally,
      ]);

      expect(result).toBe(ally);
    });

    it("should ignore enemies when selecting lowest HP ally", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        hp: 10,
        position: { q: 3, r: 2 },
      });
      const ally = createCharacter({
        id: "ally",
        faction: "friendly",
        hp: 50,
        position: { q: 2, r: 2 },
      });

      const result = evaluateTargetCriterion("ally", "lowest_hp", evaluator, [
        evaluator,
        enemy,
        ally,
      ]);

      expect(result).toBe(ally);
    });
  });
});
