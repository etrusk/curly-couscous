/**
 * Tests for new skill registry entries (Phases 4+5).
 * Ranged Attack, Dash, and distance field propagation tests.
 * Split from skill-registry.test.ts to maintain 400-line limit.
 */

import { describe, it, expect } from "vitest";
import {
  SKILL_REGISTRY,
  getDefaultSkills,
  createSkillFromDefinition,
} from "./skill-registry";

describe("Skill Registry - New Skills", () => {
  // Phase 4: Ranged Attack registry tests
  describe("Ranged Attack", () => {
    it("has correct intrinsic stats", () => {
      const rangedAttack = SKILL_REGISTRY.find((s) => s.id === "ranged-attack");

      expect(rangedAttack?.actionType).toBe("attack");
      expect(rangedAttack?.tickCost).toBe(1);
      expect(rangedAttack?.range).toBe(4);
      expect(rangedAttack?.damage).toBe(15);
      expect(rangedAttack?.cooldown).toBe(2);
    });

    it("is not innate", () => {
      const rangedAttack = SKILL_REGISTRY.find((s) => s.id === "ranged-attack");

      expect(rangedAttack?.innate).toBe(false);
    });

    it("has no behaviors", () => {
      const rangedAttack = SKILL_REGISTRY.find((s) => s.id === "ranged-attack");

      expect(rangedAttack?.behaviors).toEqual([]);
      expect(rangedAttack?.defaultBehavior).toBe("");
    });

    it("defaults to nearest enemy with cell targeting", () => {
      const rangedAttack = SKILL_REGISTRY.find((s) => s.id === "ranged-attack");

      expect(rangedAttack?.defaultTarget).toBe("enemy");
      expect(rangedAttack?.defaultCriterion).toBe("nearest");
      expect(rangedAttack?.targetingMode).toBe("cell");
    });

    it("createSkillFromDefinition propagates ranged-attack stats", () => {
      const rangedAttackDef = SKILL_REGISTRY.find(
        (s) => s.id === "ranged-attack",
      )!;
      const skill = createSkillFromDefinition(rangedAttackDef);

      expect(skill.damage).toBe(15);
      expect(skill.range).toBe(4);
      expect(skill.tickCost).toBe(1);
      expect(skill.actionType).toBe("attack");
      expect(skill.target).toBe("enemy");
      expect(skill.criterion).toBe("nearest");
    });
  });

  // Phase 5: distance field propagation tests
  describe("distance Field", () => {
    it("move-towards has distance 1", () => {
      const move = SKILL_REGISTRY.find((s) => s.id === "move-towards");

      expect(move?.distance).toBe(1);
    });

    it("getDefaultSkills propagates distance", () => {
      const skills = getDefaultSkills();
      const move = skills.find((s) => s.id === "move-towards");

      expect(move?.distance).toBe(1);
    });

    it("createSkillFromDefinition propagates distance", () => {
      const moveDef = SKILL_REGISTRY.find((s) => s.id === "move-towards")!;
      const skill = createSkillFromDefinition(moveDef);

      expect(skill.distance).toBe(1);
    });

    it("skills without distance have undefined", () => {
      const lightPunch = SKILL_REGISTRY.find((s) => s.id === "light-punch");
      const heavyPunch = SKILL_REGISTRY.find((s) => s.id === "heavy-punch");
      const heal = SKILL_REGISTRY.find((s) => s.id === "heal");

      expect(lightPunch?.distance).toBeUndefined();
      expect(heavyPunch?.distance).toBeUndefined();
      expect(heal?.distance).toBeUndefined();
    });
  });

  // Phase 5: Dash registry tests
  describe("Dash", () => {
    it("has correct intrinsic stats", () => {
      const dash = SKILL_REGISTRY.find((s) => s.id === "dash");

      expect(dash?.id).toBe("dash");
      expect(dash?.actionType).toBe("move");
      expect(dash?.tickCost).toBe(0);
      expect(dash?.range).toBe(1);
      expect(dash?.distance).toBe(2);
      expect(dash?.cooldown).toBe(3);
    });

    it("has towards and away behaviors with away as default", () => {
      const dash = SKILL_REGISTRY.find((s) => s.id === "dash");

      expect(dash?.behaviors).toEqual(["towards", "away"]);
      expect(dash?.defaultBehavior).toBe("away");
      expect(dash?.innate).toBe(false);
    });

    it("defaults to nearest enemy targeting", () => {
      const dash = SKILL_REGISTRY.find((s) => s.id === "dash");

      expect(dash?.defaultTarget).toBe("enemy");
      expect(dash?.defaultCriterion).toBe("nearest");
    });

    it("createSkillFromDefinition propagates distance for dash", () => {
      const dashDef = SKILL_REGISTRY.find((s) => s.id === "dash")!;
      const skill = createSkillFromDefinition(dashDef);

      expect(skill.distance).toBe(2);
      expect(skill.tickCost).toBe(0);
      expect(skill.actionType).toBe("move");
    });
  });
});
