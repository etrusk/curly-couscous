/**
 * Unit tests for evaluateConditionForCandidate shared condition evaluator.
 * Tests the per-candidate predicate used by both triggers and filters.
 */

import { describe, it, expect } from "vitest";
import { evaluateConditionForCandidate } from "./triggers";
import { createCharacter, createSkill } from "./game-test-helpers";
import type {
  Action,
  ConditionType,
  ConditionQualifier,
  Character,
} from "./types";

function makeAction(
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

/** Shorthand for calling the shared evaluator with common defaults. */
function evalCondition(
  condition: ConditionType,
  candidate: Character,
  evaluator: Character,
  allChars: Character[],
  conditionValue?: number,
  qualifier?: ConditionQualifier,
): boolean {
  return evaluateConditionForCandidate(
    condition,
    conditionValue,
    qualifier,
    candidate,
    evaluator,
    allChars,
  );
}

describe("evaluateConditionForCandidate", () => {
  describe("hp_below condition", () => {
    it("returns true when candidate HP percentage is below conditionValue", () => {
      const candidate = createCharacter({ id: "c", hp: 30, maxHp: 100 });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition(
          "hp_below",
          candidate,
          evaluator,
          [evaluator, candidate],
          50,
        ),
      ).toBe(true);
    });

    it("returns false when candidate HP percentage is at or above conditionValue", () => {
      const candidate = createCharacter({ id: "c", hp: 50, maxHp: 100 });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition(
          "hp_below",
          candidate,
          evaluator,
          [evaluator, candidate],
          50,
        ),
      ).toBe(false);
    });

    it("returns false when maxHp is zero (division-by-zero guard)", () => {
      const candidate = createCharacter({ id: "c", hp: 0, maxHp: 0 });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition(
          "hp_below",
          candidate,
          evaluator,
          [evaluator, candidate],
          50,
        ),
      ).toBe(false);
    });
  });

  describe("hp_above condition", () => {
    it("returns true when candidate HP percentage is above conditionValue", () => {
      const candidate = createCharacter({ id: "c", hp: 80, maxHp: 100 });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition(
          "hp_above",
          candidate,
          evaluator,
          [evaluator, candidate],
          50,
        ),
      ).toBe(true);
    });

    it("returns false at exact threshold (strict greater-than)", () => {
      const candidate = createCharacter({ id: "c", hp: 50, maxHp: 100 });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition(
          "hp_above",
          candidate,
          evaluator,
          [evaluator, candidate],
          50,
        ),
      ).toBe(false);
    });

    it("returns false when maxHp is zero (division-by-zero guard)", () => {
      const candidate = createCharacter({ id: "c", hp: 0, maxHp: 0 });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition(
          "hp_above",
          candidate,
          evaluator,
          [evaluator, candidate],
          50,
        ),
      ).toBe(false);
    });
  });

  describe("channeling condition", () => {
    it("returns true when candidate has non-null currentAction", () => {
      const candidate = createCharacter({ id: "c" });
      candidate.currentAction = makeAction();
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition("channeling", candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });

    it("returns false when candidate has null currentAction", () => {
      const candidate = createCharacter({ id: "c" });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition("channeling", candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });

    it("with skill qualifier returns true only when candidate channels matching skill", () => {
      const candidate = createCharacter({ id: "c" });
      candidate.currentAction = makeAction({
        skillId: "heal",
        actionType: "heal",
      });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition(
          "channeling",
          candidate,
          evaluator,
          [evaluator, candidate],
          undefined,
          { type: "skill", id: "heal" },
        ),
      ).toBe(true);
    });

    it("with skill qualifier returns false when candidate channels a different skill", () => {
      const candidate = createCharacter({ id: "c" });
      candidate.currentAction = makeAction({
        skillId: "heavy-punch",
        actionType: "attack",
      });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition(
          "channeling",
          candidate,
          evaluator,
          [evaluator, candidate],
          undefined,
          { type: "skill", id: "heal" },
        ),
      ).toBe(false);
    });

    it("with action qualifier returns true when candidate action type matches", () => {
      const candidate = createCharacter({ id: "c" });
      candidate.currentAction = makeAction({ actionType: "attack" });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition(
          "channeling",
          candidate,
          evaluator,
          [evaluator, candidate],
          undefined,
          { type: "action", id: "attack" },
        ),
      ).toBe(true);
    });

    it("with action qualifier returns false when action type mismatches", () => {
      const candidate = createCharacter({ id: "c" });
      candidate.currentAction = makeAction({ actionType: "heal" });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition(
          "channeling",
          candidate,
          evaluator,
          [evaluator, candidate],
          undefined,
          { type: "action", id: "attack" },
        ),
      ).toBe(false);
    });
  });

  describe("idle condition", () => {
    it("returns true when candidate has null currentAction", () => {
      const candidate = createCharacter({ id: "c" });
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition("idle", candidate, evaluator, [evaluator, candidate]),
      ).toBe(true);
    });

    it("returns false when candidate has non-null currentAction", () => {
      const candidate = createCharacter({ id: "c" });
      candidate.currentAction = makeAction();
      const evaluator = createCharacter({ id: "e" });
      expect(
        evalCondition("idle", candidate, evaluator, [evaluator, candidate]),
      ).toBe(false);
    });
  });

  describe("targeting_me condition", () => {
    it("returns true when candidate action targets evaluator's cell", () => {
      const evaluator = createCharacter({ id: "e", position: { q: 0, r: 0 } });
      const candidate = createCharacter({ id: "c", position: { q: 1, r: 0 } });
      candidate.currentAction = makeAction({ targetCell: { q: 0, r: 0 } });
      expect(
        evalCondition("targeting_me", candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(true);
    });

    it("returns false when candidate action targets a different cell", () => {
      const evaluator = createCharacter({ id: "e", position: { q: 0, r: 0 } });
      const candidate = createCharacter({ id: "c", position: { q: 1, r: 0 } });
      candidate.currentAction = makeAction({ targetCell: { q: 2, r: 0 } });
      expect(
        evalCondition("targeting_me", candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });

    it("returns false when candidate has no current action", () => {
      const evaluator = createCharacter({ id: "e", position: { q: 0, r: 0 } });
      const candidate = createCharacter({ id: "c", position: { q: 1, r: 0 } });
      expect(
        evalCondition("targeting_me", candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });
  });

  describe("targeting_ally condition", () => {
    it("returns true when candidate action targets any ally's cell", () => {
      const evaluator = createCharacter({
        id: "e",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const ally = createCharacter({
        id: "a",
        faction: "friendly",
        position: { q: 1, r: 0 },
      });
      const candidate = createCharacter({
        id: "c",
        faction: "enemy",
        position: { q: 2, r: 0 },
      });
      candidate.currentAction = makeAction({ targetCell: { q: 1, r: 0 } });
      expect(
        evalCondition("targeting_ally", candidate, evaluator, [
          evaluator,
          ally,
          candidate,
        ]),
      ).toBe(true);
    });

    it("returns false when candidate action targets evaluator (not an ally)", () => {
      const evaluator = createCharacter({
        id: "e",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const candidate = createCharacter({
        id: "c",
        faction: "enemy",
        position: { q: 1, r: 0 },
      });
      candidate.currentAction = makeAction({ targetCell: { q: 0, r: 0 } });
      expect(
        evalCondition("targeting_ally", candidate, evaluator, [
          evaluator,
          candidate,
        ]),
      ).toBe(false);
    });

    it("returns false when candidate has no current action", () => {
      const evaluator = createCharacter({
        id: "e",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const ally = createCharacter({
        id: "a",
        faction: "friendly",
        position: { q: 1, r: 0 },
      });
      const candidate = createCharacter({
        id: "c",
        faction: "enemy",
        position: { q: 2, r: 0 },
      });
      expect(
        evalCondition("targeting_ally", candidate, evaluator, [
          evaluator,
          ally,
          candidate,
        ]),
      ).toBe(false);
    });

    it("returns false when candidate targets a dead ally", () => {
      const evaluator = createCharacter({
        id: "e",
        faction: "friendly",
        position: { q: 0, r: 0 },
      });
      const deadAlly = createCharacter({
        id: "d",
        faction: "friendly",
        position: { q: 1, r: 0 },
        hp: 0,
      });
      const candidate = createCharacter({
        id: "c",
        faction: "enemy",
        position: { q: 2, r: 0 },
      });
      candidate.currentAction = makeAction({ targetCell: { q: 1, r: 0 } });
      expect(
        evalCondition("targeting_ally", candidate, evaluator, [
          evaluator,
          deadAlly,
          candidate,
        ]),
      ).toBe(false);
    });
  });
});
