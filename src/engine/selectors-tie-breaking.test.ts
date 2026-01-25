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
    it("nearest_enemy: should prefer lower Y when distances equal", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { x: 6, y: 4 }, // dist=1, Y=4
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { x: 4, y: 6 }, // dist=1, Y=6
      });
      const selector: Selector = { type: "nearest_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // Y=4 < Y=6
    });

    it("nearest_enemy: should prefer lower X when Y and distances equal", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { x: 4, y: 5 }, // dist=1, X=4
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { x: 6, y: 5 }, // dist=1, X=6
      });
      const selector: Selector = { type: "nearest_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // X=4 < X=6
    });

    it("lowest_hp_enemy: should prefer lower Y when HP equal", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        hp: 50,
        position: { x: 3, y: 2 }, // Y=2
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        hp: 50,
        position: { x: 7, y: 4 }, // Y=4
      });
      const selector: Selector = { type: "lowest_hp_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // Y=2 < Y=4
    });

    it("lowest_hp_enemy: should prefer lower X when HP and Y equal", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 0, y: 0 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        hp: 50,
        position: { x: 2, y: 3 }, // X=2
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        hp: 50,
        position: { x: 5, y: 3 }, // X=5
      });
      const selector: Selector = { type: "lowest_hp_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
      ]);

      expect(result).toBe(enemyA); // X=2 < X=5
    });

    it("nearest_enemy: three-way tie resolved correctly", () => {
      const evaluator = createCharacter({
        id: "eval",
        faction: "friendly",
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: "enemyA",
        faction: "enemy",
        position: { x: 5, y: 4 }, // dist=1, Y=4
      });
      const enemyB = createCharacter({
        id: "enemyB",
        faction: "enemy",
        position: { x: 6, y: 5 }, // dist=1, Y=5
      });
      const enemyC = createCharacter({
        id: "enemyC",
        faction: "enemy",
        position: { x: 4, y: 5 }, // dist=1, Y=5
      });
      const selector: Selector = { type: "nearest_enemy" };

      const result = evaluateSelector(selector, evaluator, [
        evaluator,
        enemyA,
        enemyB,
        enemyC,
      ]);

      expect(result).toBe(enemyA); // Lowest Y=4
    });
  });
});
