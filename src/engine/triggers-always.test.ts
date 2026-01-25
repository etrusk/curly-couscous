/**
 * Tests for the `always` trigger.
 * Follows test design document: docs/test-design-trigger-evaluation.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import { createCharacter } from "./triggers-test-helpers";

describe("evaluateTrigger - always trigger", () => {
  it("should return true for always trigger type", () => {
    const evaluator = createCharacter({
      id: "eval",
      position: { x: 5, y: 5 },
    });
    const trigger: Trigger = { type: "always" };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(true);
  });

  it("should return true for always trigger regardless of evaluator state", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
      hp: 10, // Low HP
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 6 }, // dist=1
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { x: 5, y: 7 }, // dist=2
    });
    const trigger: Trigger = { type: "always" };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      enemy,
      ally,
    ]);

    expect(result).toBe(true);
  });
});
