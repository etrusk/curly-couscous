/**
 * Tests for tie-breaking rules in selectors.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateSelector } from "./selectors";
import { Selector } from "./types";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateSelector", () => {
  // =========================================================================
  // Section 6: Tie-Breaking (Section 6.2)
  // =========================================================================
  describe("tie-breaking rules", () => {
    it("nearest_enemy: should prefer lower R when distances equal", () => {
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
      const selector: Selector = { type: "nearest_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // R=-1 < R=1
    });

    it("nearest_enemy: should prefer lower Q when R and distances equal", () => {
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
      const selector: Selector = { type: "nearest_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // Q=-1 < Q=1
    });

    it("lowest_hp_enemy: should prefer lower R when HP equal", () => {
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
      const selector: Selector = { type: "lowest_hp_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // R=-1 < R=1
    });

    it("lowest_hp_enemy: should prefer lower Q when HP and R equal", () => {
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
      const selector: Selector = { type: "lowest_hp_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // Q=-1 < Q=2
    });

    it("nearest_enemy: three-way tie resolved correctly", () => {
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
      const selector: Selector = { type: "nearest_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
        enemyC,
      ]);

      expect(result).toBe(enemyA); // Lowest R=-1
    });
  });
});
