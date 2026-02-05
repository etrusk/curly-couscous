/**
 * Tests for trigger formatting functions.
 * Follows test design document: .tdd/test-designs.md (Feature B2 & B1 formatter tests)
 */

import { describe, it, expect } from "vitest";
import {
  formatTrigger,
  formatTriggers,
  formatRejectionReasonCompact,
} from "./rule-evaluations-formatters";
import { Trigger, SkillEvaluationResult } from "../../engine/types";
import { createSkill } from "../../engine/triggers-test-helpers";

describe("formatTrigger - NOT modifier", () => {
  it("should add NOT prefix when negated", () => {
    const trigger: Trigger = { type: "hp_below", value: 50, negated: true };

    const result = formatTrigger(trigger);

    expect(result).toBe("NOT hp_below(50)");
  });

  it("should not add prefix when not negated", () => {
    const trigger1: Trigger = { type: "hp_below", value: 50 };
    const trigger2: Trigger = { type: "hp_below", value: 50, negated: false };

    const result1 = formatTrigger(trigger1);
    const result2 = formatTrigger(trigger2);

    expect(result1).toBe("hp_below(50)");
    expect(result2).toBe("hp_below(50)");
  });

  it("should work with triggers without value", () => {
    const trigger: Trigger = { type: "always", negated: true };

    const result = formatTrigger(trigger);

    expect(result).toBe("NOT always");
  });

  it("should format ally_hp_below trigger", () => {
    const trigger: Trigger = { type: "ally_hp_below", value: 50 };

    const result = formatTrigger(trigger);

    expect(result).toBe("ally_hp_below(50)");
  });

  it("should show NOT prefix in rejection reasons", () => {
    const skill = createSkill({ id: "test", damage: 10 });
    const evalResult: SkillEvaluationResult = {
      skill,
      status: "rejected",
      rejectionReason: "trigger_failed",
      failedTriggers: [{ type: "hp_below", value: 50, negated: true }],
    };

    const result = formatRejectionReasonCompact(evalResult);

    expect(result).toBe("trigger_failed: NOT hp_below(50)");
  });
});

describe("formatTriggers - AND combinator", () => {
  it("should join multiple triggers with AND", () => {
    const triggers: Trigger[] = [
      { type: "enemy_in_range", value: 3 },
      { type: "hp_below", value: 50 },
    ];

    const result = formatTriggers(triggers);

    expect(result).toBe("enemy_in_range(3) AND hp_below(50)");
  });

  it("should handle single trigger without AND", () => {
    const triggers: Trigger[] = [{ type: "always" }];

    const result = formatTriggers(triggers);

    expect(result).toBe("always");
  });

  it("should handle empty array as always", () => {
    const triggers: Trigger[] = [];

    const result = formatTriggers(triggers);

    expect(result).toBe("always");
  });

  it("should handle negated triggers in compound expressions", () => {
    const triggers: Trigger[] = [
      { type: "enemy_in_range", value: 3 },
      { type: "hp_below", value: 50, negated: true },
    ];

    const result = formatTriggers(triggers);

    expect(result).toBe("enemy_in_range(3) AND NOT hp_below(50)");
  });
});
