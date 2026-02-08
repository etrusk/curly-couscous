/**
 * Unit tests for evaluateFilterForCandidate function.
 * Tests the SkillFilter wrapper that delegates to the shared condition evaluator
 * with negation support.
 *
 * Rewritten for Phase 2: replaces evaluateSelectorFilter tests with
 * evaluateFilterForCandidate using new SkillFilter type.
 */

import { describe, it, expect } from "vitest";
import { evaluateFilterForCandidate } from "./selector-filters";
import { createCharacter, createSkill } from "./game-test-helpers";
import type { SkillFilter, Action } from "./types";

/**
 * Helper to create a channeling action for a candidate.
 */
function createChannelingAction(
  overrides: {
    skillId?: string;
    actionType?: Action["type"];
    targetCell?: { q: number; r: number };
  } = {},
): Action {
  const type = overrides.actionType ?? "attack";
  return {
    type,
    skill: createSkill({
      id: overrides.skillId ?? "test-skill",
      damage: type === "attack" ? 10 : undefined,
      healing: type === "heal" ? 25 : undefined,
    }),
    targetCell: overrides.targetCell ?? { q: 0, r: 0 },
    targetCharacter: null,
    startedAtTick: 0,
    resolvesAtTick: 1,
  };
}

describe("evaluateFilterForCandidate", () => {
  describe("hp_below filter", () => {
    it("passes when candidate HP is below threshold", () => {
      const filter: SkillFilter = { condition: "hp_below", conditionValue: 50 };
      const candidate = createCharacter({
        id: "candidate",
        hp: 30,
        maxHp: 100,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });

    it("fails when candidate HP is above threshold", () => {
      const filter: SkillFilter = { condition: "hp_below", conditionValue: 50 };
      const candidate = createCharacter({
        id: "candidate",
        hp: 70,
        maxHp: 100,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });

    it("fails at exact threshold (strict less-than)", () => {
      const filter: SkillFilter = { condition: "hp_below", conditionValue: 50 };
      const candidate = createCharacter({
        id: "candidate",
        hp: 50,
        maxHp: 100,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });

    it("passes at one below threshold", () => {
      const filter: SkillFilter = { condition: "hp_below", conditionValue: 50 };
      const candidate = createCharacter({
        id: "candidate",
        hp: 49,
        maxHp: 100,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });

    it("returns false when maxHp is zero", () => {
      const filter: SkillFilter = { condition: "hp_below", conditionValue: 50 };
      const candidate = createCharacter({ id: "candidate", hp: 0, maxHp: 0 });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });

    it("passes when candidate has zero HP", () => {
      const filter: SkillFilter = { condition: "hp_below", conditionValue: 50 };
      const candidate = createCharacter({ id: "candidate", hp: 0, maxHp: 100 });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });

    it("correctly computes percentage with non-standard maxHp", () => {
      const filter: SkillFilter = { condition: "hp_below", conditionValue: 50 };
      // hp: 25, maxHp: 200 = 12.5%
      const candidate = createCharacter({
        id: "candidate",
        hp: 25,
        maxHp: 200,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });
  });

  describe("hp_above filter", () => {
    it("passes when candidate HP is above threshold", () => {
      const filter: SkillFilter = { condition: "hp_above", conditionValue: 50 };
      const candidate = createCharacter({
        id: "candidate",
        hp: 80,
        maxHp: 100,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });

    it("fails when candidate HP is below threshold", () => {
      const filter: SkillFilter = { condition: "hp_above", conditionValue: 50 };
      const candidate = createCharacter({
        id: "candidate",
        hp: 30,
        maxHp: 100,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });

    it("fails at exact threshold (strict greater-than)", () => {
      const filter: SkillFilter = { condition: "hp_above", conditionValue: 50 };
      const candidate = createCharacter({
        id: "candidate",
        hp: 50,
        maxHp: 100,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });

    it("passes at one above threshold", () => {
      const filter: SkillFilter = { condition: "hp_above", conditionValue: 50 };
      const candidate = createCharacter({
        id: "candidate",
        hp: 51,
        maxHp: 100,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });

    it("returns false when maxHp is zero", () => {
      const filter: SkillFilter = { condition: "hp_above", conditionValue: 50 };
      const candidate = createCharacter({ id: "candidate", hp: 0, maxHp: 0 });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });

    it("fails at full HP with 100% threshold (strict greater-than)", () => {
      const filter: SkillFilter = {
        condition: "hp_above",
        conditionValue: 100,
      };
      const candidate = createCharacter({
        id: "candidate",
        hp: 100,
        maxHp: 100,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });
  });

  describe("channeling filter", () => {
    it("passes when candidate is channeling", () => {
      const filter: SkillFilter = { condition: "channeling" };
      const candidate = createCharacter({ id: "candidate" });
      candidate.currentAction = createChannelingAction();
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });

    it("fails when candidate is idle", () => {
      const filter: SkillFilter = { condition: "channeling" };
      const candidate = createCharacter({ id: "candidate" });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });
  });

  describe("idle filter", () => {
    it("passes when candidate has no current action", () => {
      const filter: SkillFilter = { condition: "idle" };
      const candidate = createCharacter({ id: "candidate" });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });

    it("fails when candidate is channeling", () => {
      const filter: SkillFilter = { condition: "idle" };
      const candidate = createCharacter({ id: "candidate" });
      candidate.currentAction = createChannelingAction();
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });
  });

  describe("targeting_me filter", () => {
    it("passes when candidate targets evaluator", () => {
      const filter: SkillFilter = { condition: "targeting_me" };
      const evaluator = createCharacter({
        id: "evaluator",
        position: { q: 0, r: 0 },
      });
      const candidate = createCharacter({
        id: "candidate",
        position: { q: 1, r: 0 },
      });
      candidate.currentAction = createChannelingAction({
        targetCell: { q: 0, r: 0 },
      });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });
  });

  describe("targeting_ally filter", () => {
    it("passes when candidate targets an ally", () => {
      const filter: SkillFilter = { condition: "targeting_ally" };
      const evaluator = createCharacter({
        id: "evaluator",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const ally = createCharacter({
        id: "ally",
        faction: "friendly",
        position: { q: 1, r: 0 },
      });
      const candidate = createCharacter({
        id: "candidate",
        faction: "enemy",
        position: { q: 2, r: 0 },
      });
      candidate.currentAction = createChannelingAction({
        targetCell: { q: 1, r: 0 },
      });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          ally,
          candidate,
        ]),
      ).toBe(true);
    });
  });

  describe("negated filter", () => {
    it("inverts the result (true base becomes false)", () => {
      const filter: SkillFilter = {
        condition: "hp_below",
        conditionValue: 50,
        negated: true,
      };
      // 30% is below 50%, so base result is true; negated should be false
      const candidate = createCharacter({
        id: "candidate",
        hp: 30,
        maxHp: 100,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });

    it("passes when base condition is false", () => {
      const filter: SkillFilter = {
        condition: "hp_below",
        conditionValue: 50,
        negated: true,
      };
      // 80% is not below 50%, so base result is false; negated should be true
      const candidate = createCharacter({
        id: "candidate",
        hp: 80,
        maxHp: 100,
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });
  });

  describe("channeling filter with qualifier", () => {
    it("passes for matching skill", () => {
      const filter: SkillFilter = {
        condition: "channeling",
        qualifier: { type: "skill", id: "heal" },
      };
      const candidate = createCharacter({ id: "candidate" });
      candidate.currentAction = createChannelingAction({
        skillId: "heal",
        actionType: "heal",
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });

    it("fails for non-matching skill", () => {
      const filter: SkillFilter = {
        condition: "channeling",
        qualifier: { type: "skill", id: "heal" },
      };
      const candidate = createCharacter({ id: "candidate" });
      candidate.currentAction = createChannelingAction({
        skillId: "heavy-punch",
        actionType: "attack",
      });
      const evaluator = createCharacter({ id: "evaluator" });

      expect(
        evaluateFilterForCandidate(filter, candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });
  });
});
