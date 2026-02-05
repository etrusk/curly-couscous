/**
 * Tests for `lowest_hp_enemy` selector.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from "vitest";
import { evaluateSelector } from "./selectors";
import { createCharacter } from "./selectors-test-helpers";

describe("evaluateSelector", () => {
  // =========================================================================
  // Section 4: `lowest_hp_enemy` Selector
  // =========================================================================
  describe("lowest_hp_enemy selector", () => {
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
      const selector = { type: "lowest_hp_enemy" } as const;

      const result = evaluateSelector(selector, evaluator, [
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
      const selector = { type: "lowest_hp_enemy" } as const;

      const result = evaluateSelector(selector, evaluator, [
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
      const selector = { type: "lowest_hp_enemy" } as const;

      const result = evaluateSelector(selector, evaluator, [evaluator, ally]);

      expect(result).toBeNull();
    });
  });
});
