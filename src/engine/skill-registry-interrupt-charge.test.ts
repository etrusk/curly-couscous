/**
 * Tests for Kick and Charge skill registry entries.
 * Validates registry stats, defaultTrigger/defaultFilter fields,
 * and createSkillFromDefinition propagation.
 *
 * Phases 7+8: Kick/Interrupt + Charge
 */

import { describe, it, expect } from "vitest";
import {
  SKILL_REGISTRY,
  getDefaultSkills,
  createSkillFromDefinition,
} from "./skill-registry";

describe("Skill Registry - Interrupt & Charge", () => {
  // =========================================================================
  // Kick Registry Tests
  // =========================================================================
  describe("Kick", () => {
    it("kick-has-correct-intrinsic-stats", () => {
      const kick = SKILL_REGISTRY.find((s) => s.id === "kick");

      expect(kick).toBeDefined();
      expect(kick?.id).toBe("kick");
      expect(kick?.name).toBe("Kick");
      expect(kick?.actionType).toBe("interrupt");
      expect(kick?.tickCost).toBe(0);
      expect(kick?.range).toBe(1);
      expect(kick?.damage).toBe(0);
      expect(kick?.cooldown).toBe(4);
      expect(kick?.innate).toBe(false);
      expect(kick?.defaultTarget).toBe("enemy");
      expect(kick?.defaultCriterion).toBe("nearest");
      expect(kick?.targetingMode).toBe("cell");
    });

    it("kick-gets-default-channeling-trigger-and-filter", () => {
      const kick = SKILL_REGISTRY.find((s) => s.id === "kick");

      expect(kick).toBeDefined();
      expect(kick?.defaultTrigger).toEqual({
        scope: "enemy",
        condition: "channeling",
      });
      expect(kick?.defaultFilter).toEqual({
        condition: "channeling",
      });
    });
  });

  // =========================================================================
  // Charge Registry Tests
  // =========================================================================
  describe("Charge", () => {
    it("charge-has-correct-intrinsic-stats", () => {
      const charge = SKILL_REGISTRY.find((s) => s.id === "charge");

      expect(charge).toBeDefined();
      expect(charge?.id).toBe("charge");
      expect(charge?.name).toBe("Charge");
      expect(charge?.actionType).toBe("charge");
      expect(charge?.tickCost).toBe(1);
      expect(charge?.range).toBe(3);
      expect(charge?.damage).toBe(20);
      expect(charge?.distance).toBe(3);
      expect(charge?.cooldown).toBe(3);
      expect(charge?.innate).toBe(false);
      expect(charge?.defaultTarget).toBe("enemy");
      expect(charge?.defaultCriterion).toBe("nearest");
      expect(charge?.targetingMode).toBe("cell");
    });

    it("charge-gets-default-in-range-trigger", () => {
      const charge = SKILL_REGISTRY.find((s) => s.id === "charge");

      expect(charge).toBeDefined();
      expect(charge?.defaultTrigger).toEqual({
        scope: "enemy",
        condition: "in_range",
        conditionValue: 3,
      });
      expect(charge?.defaultFilter).toBeUndefined();
    });
  });

  // =========================================================================
  // Dash Registry Tests
  // =========================================================================
  describe("Dash", () => {
    it("dash-has-correct-default-trigger", () => {
      const dash = SKILL_REGISTRY.find((s) => s.id === "dash");

      expect(dash).toBeDefined();
      expect(dash?.defaultTrigger).toEqual({
        scope: "enemy",
        condition: "in_range",
        conditionValue: 1,
      });
      expect(dash?.defaultFilter).toBeUndefined();
    });
  });

  // =========================================================================
  // Factory Function Tests
  // =========================================================================
  describe("createSkillFromDefinition propagation", () => {
    it("createSkillFromDefinition-propagates-default-trigger-and-filter", () => {
      // Kick: defaultTrigger and defaultFilter should propagate
      const kickDef = SKILL_REGISTRY.find((s) => s.id === "kick")!;
      const kickSkill = createSkillFromDefinition(kickDef);

      expect(kickSkill.trigger).toEqual({
        scope: "enemy",
        condition: "channeling",
      });
      expect(kickSkill.filter).toMatchObject({
        condition: "channeling",
      });

      // Charge: defaultTrigger propagates, no defaultFilter
      const chargeDef = SKILL_REGISTRY.find((s) => s.id === "charge")!;
      const chargeSkill = createSkillFromDefinition(chargeDef);

      expect(chargeSkill.trigger).toEqual({
        scope: "enemy",
        condition: "in_range",
        conditionValue: 3,
      });

      // Light Punch: no defaultTrigger, falls back to "always"
      const lightPunchDef = SKILL_REGISTRY.find((s) => s.id === "light-punch")!;
      const lightPunchSkill = createSkillFromDefinition(lightPunchDef);

      expect(lightPunchSkill.trigger).toEqual({
        scope: "enemy",
        condition: "always",
      });
    });

    it("createSkillFromDefinition-propagates-dash-default-trigger", () => {
      const dashDef = SKILL_REGISTRY.find((s) => s.id === "dash")!;
      const dashSkill = createSkillFromDefinition(dashDef);

      expect(dashSkill.trigger).toEqual({
        scope: "enemy",
        condition: "in_range",
        conditionValue: 1,
      });
      expect(dashSkill.actionType).toBe("move");
      expect(dashSkill.distance).toBe(2);
    });

    it("getDefaultSkills-includes-correct-triggers-for-kick-and-charge", () => {
      // getDefaultSkills only returns innate skills (Move), which has no defaultTrigger
      const defaultSkills = getDefaultSkills();
      const moveSkill = defaultSkills.find((s) => s.id === "move-towards");
      expect(moveSkill?.trigger).toEqual({
        scope: "enemy",
        condition: "always",
      });

      // Verify createSkillFromDefinition for Kick produces correct skill
      const kickDef = SKILL_REGISTRY.find((s) => s.id === "kick")!;
      const kickSkill = createSkillFromDefinition(kickDef);
      expect(kickSkill.actionType).toBe("interrupt");
      expect(kickSkill.damage).toBe(0);
      expect(kickSkill.tickCost).toBe(0);

      // Verify createSkillFromDefinition for Charge produces correct skill
      const chargeDef = SKILL_REGISTRY.find((s) => s.id === "charge")!;
      const chargeSkill = createSkillFromDefinition(chargeDef);
      expect(chargeSkill.actionType).toBe("charge");
      expect(chargeSkill.damage).toBe(20);
      expect(chargeSkill.distance).toBe(3);
      expect(chargeSkill.tickCost).toBe(1);
      expect(chargeSkill.range).toBe(3);
    });
  });
});
