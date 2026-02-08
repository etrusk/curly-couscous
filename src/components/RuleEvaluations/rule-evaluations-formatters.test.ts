/**
 * Tests for trigger formatting functions.
 * Updated for Phase 1 unified trigger system.
 */

import { describe, it, expect } from "vitest";
import {
  formatTrigger,
  formatRejectionReasonCompact,
  formatRejectionReason,
} from "./rule-evaluations-formatters";
import { Trigger, SkillEvaluationResult } from "../../engine/types";
import { createSkill } from "../../engine/triggers-test-helpers";

describe("formatTrigger - new unified shape", () => {
  it("should format always trigger (enemy scope implicit)", () => {
    const trigger: Trigger = { scope: "enemy", condition: "always" };

    const result = formatTrigger(trigger);

    expect(result).toBe("always");
  });

  it("should format trigger with conditionValue", () => {
    const trigger: Trigger = {
      scope: "enemy",
      condition: "in_range",
      conditionValue: 3,
    };

    const result = formatTrigger(trigger);

    expect(result).toBe("in_range(3)");
  });

  it("should show self scope prefix", () => {
    const trigger: Trigger = {
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = formatTrigger(trigger);

    expect(result).toBe("self:hp_below(50)");
  });

  it("should show ally scope prefix", () => {
    const trigger: Trigger = {
      scope: "ally",
      condition: "hp_below",
      conditionValue: 50,
    };

    const result = formatTrigger(trigger);

    expect(result).toBe("ally:hp_below(50)");
  });

  it("should add NOT prefix for negated triggers", () => {
    const trigger: Trigger = {
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
      negated: true,
    };

    const result = formatTrigger(trigger);

    expect(result).toBe("NOT self:hp_below(50)");
  });

  it("should format targeting_me condition (no conditionValue)", () => {
    const trigger: Trigger = { scope: "enemy", condition: "targeting_me" };

    const result = formatTrigger(trigger);

    expect(result).toBe("targeting_me");
  });
});

describe("formatRejectionReasonCompact - singular failedTrigger", () => {
  it("should format trigger_failed with singular failedTrigger", () => {
    const skill = createSkill({ id: "test", damage: 10 });
    const evalResult: SkillEvaluationResult = {
      skill,
      status: "rejected",
      rejectionReason: "trigger_failed",
      failedTrigger: {
        scope: "self",
        condition: "hp_below",
        conditionValue: 50,
        negated: true,
      },
    };

    const result = formatRejectionReasonCompact(evalResult);

    expect(result).toBe("trigger_failed: NOT self:hp_below(50)");
  });

  it("should handle trigger_failed without failedTrigger present", () => {
    const skill = createSkill({ id: "test", damage: 10 });
    const evalResult: SkillEvaluationResult = {
      skill,
      status: "rejected",
      rejectionReason: "trigger_failed",
    };

    const result = formatRejectionReasonCompact(evalResult);

    expect(result).toBe("trigger_failed");
  });
});

describe("formatRejectionReasonCompact - filter_failed with SkillFilter", () => {
  it("handles filter_failed with new SkillFilter shape", () => {
    const skill = createSkill({ id: "test", damage: 10 });
    const evalResult: SkillEvaluationResult = {
      skill,
      status: "rejected",
      rejectionReason: "filter_failed",
      failedFilter: { condition: "hp_below", conditionValue: 50 },
    };

    const result = formatRejectionReasonCompact(evalResult);

    expect(result).toBe("filter_failed: hp_below(50)");
  });

  it("handles filter_failed without failedFilter present", () => {
    const skill = createSkill({ id: "test", damage: 10 });
    const evalResult: SkillEvaluationResult = {
      skill,
      status: "rejected",
      rejectionReason: "filter_failed",
    };

    const result = formatRejectionReasonCompact(evalResult);

    expect(result).toBe("filter_failed");
  });

  it("handles filter_failed with negated filter", () => {
    const skill = createSkill({ id: "test", damage: 10 });
    const evalResult: SkillEvaluationResult = {
      skill,
      status: "rejected",
      rejectionReason: "filter_failed",
      failedFilter: {
        condition: "hp_below",
        conditionValue: 50,
        negated: true,
      },
    };

    const result = formatRejectionReasonCompact(evalResult);

    expect(result).toContain("NOT");
    expect(result).toBe("filter_failed: NOT hp_below(50)");
  });

  it("handles filter_failed with condition that has no value", () => {
    const skill = createSkill({ id: "test", damage: 10 });
    const evalResult: SkillEvaluationResult = {
      skill,
      status: "rejected",
      rejectionReason: "filter_failed",
      failedFilter: { condition: "channeling" },
    };

    const result = formatRejectionReasonCompact(evalResult);

    expect(result).toBe("filter_failed: channeling");
  });

  it("handles filter_failed with qualifier", () => {
    const skill = createSkill({ id: "test", damage: 10 });
    const evalResult: SkillEvaluationResult = {
      skill,
      status: "rejected",
      rejectionReason: "filter_failed",
      failedFilter: {
        condition: "channeling",
        qualifier: { type: "skill", id: "heal" },
      },
    };

    const result = formatRejectionReasonCompact(evalResult);

    expect(result).toContain("channeling");
    expect(result).toContain("heal");
  });
});

describe("formatRejectionReason - filter_failed generic message", () => {
  it("returns generic message for filter_failed", () => {
    const skill = createSkill({ id: "test", damage: 10 });
    const evalResult: SkillEvaluationResult = {
      skill,
      status: "rejected",
      rejectionReason: "filter_failed",
    };

    const result = formatRejectionReason(evalResult);

    expect(result).toBe("filter condition not met");
  });
});
