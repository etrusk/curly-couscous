/**
 * Tests for the `always` trigger.
 * Follows test design document: docs/test-design-trigger-evaluation.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import { createCharacter } from "./triggers-test-helpers";

describe("evaluateTrigger - always trigger (scope-independent)", () => {
  it("should return true with enemy scope even when no enemies present", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
    });
    const trigger: Trigger = { scope: "enemy", condition: "always" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });
});

describe("evaluateTrigger - always trigger (legacy)", () => {
  it("should return true for always trigger type", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { q: 3, r: 2 },
    });
    const trigger: Trigger = { scope: "enemy", condition: "always" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });

  it("should return true for always trigger regardless of evaluator state", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 10, // Low HP
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 }, // dist=1
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 1, r: 4 }, // dist=2
    });
    const trigger: Trigger = { scope: "enemy", condition: "always" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      enemy,
      ally,
    ]);

    expect(result).toBe(true);
  });
});
