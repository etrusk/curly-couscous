/**
 * Unit tests for evaluateSelectorFilter pure function.
 * Tests hp_below and hp_above filter types with boundary cases.
 */

import { describe, it, expect } from "vitest";
import { evaluateSelectorFilter } from "./selector-filters";
import { SelectorFilter } from "./types";
import { createCharacter } from "./game-test-helpers";

describe("evaluateSelectorFilter", () => {
  describe("hp_below filter", () => {
    it("passes when target HP is below threshold", () => {
      const target = createCharacter({ id: "target", hp: 30, maxHp: 100 });
      const filter: SelectorFilter = { type: "hp_below", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(true);
    });

    it("fails when target HP is above threshold", () => {
      const target = createCharacter({ id: "target", hp: 70, maxHp: 100 });
      const filter: SelectorFilter = { type: "hp_below", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(false);
    });

    it("fails at exact threshold (strict less-than)", () => {
      const target = createCharacter({ id: "target", hp: 50, maxHp: 100 });
      const filter: SelectorFilter = { type: "hp_below", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(false);
    });

    it("passes when one below threshold", () => {
      const target = createCharacter({ id: "target", hp: 49, maxHp: 100 });
      const filter: SelectorFilter = { type: "hp_below", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(true);
    });

    it("returns false when maxHp is zero (division-by-zero guard)", () => {
      const target = createCharacter({ id: "target", hp: 0, maxHp: 0 });
      const filter: SelectorFilter = { type: "hp_below", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(false);
    });

    it("passes when target has zero HP (0% is below any positive threshold)", () => {
      const target = createCharacter({ id: "target", hp: 0, maxHp: 100 });
      const filter: SelectorFilter = { type: "hp_below", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(true);
    });

    it("correctly computes percentage with non-standard maxHp", () => {
      // hp: 25, maxHp: 200 = 12.5%
      const target = createCharacter({ id: "target", hp: 25, maxHp: 200 });
      const filter: SelectorFilter = { type: "hp_below", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(true);
    });
  });

  describe("hp_above filter", () => {
    it("passes when target HP is above threshold", () => {
      const target = createCharacter({ id: "target", hp: 80, maxHp: 100 });
      const filter: SelectorFilter = { type: "hp_above", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(true);
    });

    it("fails when target HP is below threshold", () => {
      const target = createCharacter({ id: "target", hp: 30, maxHp: 100 });
      const filter: SelectorFilter = { type: "hp_above", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(false);
    });

    it("fails at exact threshold (strict greater-than)", () => {
      const target = createCharacter({ id: "target", hp: 50, maxHp: 100 });
      const filter: SelectorFilter = { type: "hp_above", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(false);
    });

    it("passes when one above threshold", () => {
      const target = createCharacter({ id: "target", hp: 51, maxHp: 100 });
      const filter: SelectorFilter = { type: "hp_above", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(true);
    });

    it("returns false when maxHp is zero (division-by-zero guard)", () => {
      const target = createCharacter({ id: "target", hp: 0, maxHp: 0 });
      const filter: SelectorFilter = { type: "hp_above", value: 50 };

      expect(evaluateSelectorFilter(filter, target)).toBe(false);
    });

    it("fails when target is at full HP and threshold is 100% (strict greater-than)", () => {
      const target = createCharacter({ id: "target", hp: 100, maxHp: 100 });
      const filter: SelectorFilter = { type: "hp_above", value: 100 };

      expect(evaluateSelectorFilter(filter, target)).toBe(false);
    });
  });
});
