/**
 * Tests for the `ally_in_range` trigger.
 * Follows test design document: docs/test-design-trigger-evaluation.md
 */

import { describe, it, expect } from "vitest";
import { evaluateTrigger } from "./triggers";
import { Trigger } from "./types";
import { createCharacter } from "./triggers-test-helpers";

describe("evaluateTrigger - ally_in_range trigger", () => {
  it("should return true when ally is within range", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { x: 5, y: 7 }, // dist=2
    });
    const trigger: Trigger = { type: "ally_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(true);
  });

  it("should return false when ally is outside range", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { x: 5, y: 9 }, // dist=4
    });
    const trigger: Trigger = { type: "ally_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(false);
  });

  it("should return true when ally is exactly at range boundary", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { x: 5, y: 8 }, // dist=3
    });
    const trigger: Trigger = { type: "ally_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

    expect(result).toBe(true);
  });

  it("should exclude self from ally range check", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const trigger: Trigger = { type: "ally_in_range", value: 0 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator]);

    expect(result).toBe(false);
  });

  it("should return true if any ally (not self) is in range", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const allyA = createCharacter({
      id: "allyA",
      faction: "friendly",
      position: { x: 10, y: 10 }, // dist=5
    });
    const allyB = createCharacter({
      id: "allyB",
      faction: "friendly",
      position: { x: 5, y: 6 }, // dist=1
    });
    const trigger: Trigger = { type: "ally_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [
      evaluator,
      allyA,
      allyB,
    ]);

    expect(result).toBe(true);
  });

  it("should return false when no allies except self exist", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 6 },
    });
    const trigger: Trigger = { type: "ally_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });

  it("should ignore enemies when checking ally range", () => {
    const evaluator = createCharacter({
      id: "eval",
      faction: "friendly",
      position: { x: 5, y: 5 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 6 }, // dist=1
    });
    const trigger: Trigger = { type: "ally_in_range", value: 3 };

    const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

    expect(result).toBe(false);
  });
});
