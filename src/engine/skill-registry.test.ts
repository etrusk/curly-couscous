/**
 * Tests for skill registry.
 * Following TDD workflow - these tests are written before implementation.
 */

import { describe, it, expect } from "vitest";
import {
  SKILL_REGISTRY,
  getDefaultSkills,
  createSkillFromDefinition,
} from "./skill-registry";

describe("Skill Registry", () => {
  describe("SKILL_REGISTRY", () => {
    it("exports all skills", () => {
      expect(SKILL_REGISTRY).toHaveLength(3);

      const skillIds = SKILL_REGISTRY.map((skill) => skill.id);
      expect(skillIds).toEqual(["light-punch", "heavy-punch", "move-towards"]);
    });

    it("skill definitions have required fields", () => {
      SKILL_REGISTRY.forEach((skill) => {
        // Required fields for all skills
        expect(skill.id).toBeTruthy();
        expect(typeof skill.id).toBe("string");

        expect(skill.name).toBeTruthy();
        expect(typeof skill.name).toBe("string");

        expect(skill.tickCost).toBeGreaterThan(0);
        expect(typeof skill.tickCost).toBe("number");

        expect(skill.range).toBeGreaterThan(0);
        expect(typeof skill.range).toBe("number");

        expect(typeof skill.innate).toBe("boolean");
      });
    });

    it("attack skills have damage", () => {
      const lightPunch = SKILL_REGISTRY.find((s) => s.id === "light-punch");
      const heavyPunch = SKILL_REGISTRY.find((s) => s.id === "heavy-punch");

      expect(lightPunch?.damage).toBe(10);
      expect(lightPunch?.mode).toBeUndefined();

      expect(heavyPunch?.damage).toBe(25);
      expect(heavyPunch?.mode).toBeUndefined();
    });

    it("move skill has mode", () => {
      const moveSkill = SKILL_REGISTRY.find((s) => s.id === "move-towards");

      expect(moveSkill?.mode).toBe("towards");
      expect(moveSkill?.damage).toBeUndefined();
    });

    it("move is innate", () => {
      const moveSkill = SKILL_REGISTRY.find((s) => s.id === "move-towards");
      const lightPunch = SKILL_REGISTRY.find((s) => s.id === "light-punch");
      const heavyPunch = SKILL_REGISTRY.find((s) => s.id === "heavy-punch");

      expect(moveSkill?.innate).toBe(true);
      expect(lightPunch?.innate).toBe(false);
      expect(heavyPunch?.innate).toBe(false);
    });
  });

  describe("getDefaultSkills", () => {
    it("returns only innate skills", () => {
      const skills = getDefaultSkills();

      // Should only return Move (the only innate skill)
      expect(skills).toHaveLength(1);
      expect(skills[0]?.id).toBe("move-towards");
    });

    it("adds behavioral fields to innate skills", () => {
      const skills = getDefaultSkills();

      // Should only contain Move skill
      expect(skills).toHaveLength(1);
      const skill = skills[0]!;

      expect(skill.enabled).toBe(true);
      expect(skill.triggers).toHaveLength(1);
      expect(skill.triggers[0]?.type).toBe("always");
      expect(skill.selectorOverride).toBeDefined();
      expect(skill.selectorOverride?.type).toBe("nearest_enemy");
    });

    it("preserves intrinsic properties for innate skills", () => {
      const skills = getDefaultSkills();

      // Only Move should be returned
      expect(skills).toHaveLength(1);
      const move = skills[0]!;

      expect(move.id).toBe("move-towards");
      expect(move.tickCost).toBe(1);
      expect(move.range).toBe(1);
      expect(move.mode).toBe("towards");
      expect(move.damage).toBeUndefined();
    });

    it("move name includes direction", () => {
      const skills = getDefaultSkills();

      // Only Move is returned as innate
      expect(skills).toHaveLength(1);
      const move = skills[0]!;

      expect(move.name).toBe("Move Towards");
    });

    it("returns fresh instances", () => {
      const result1 = getDefaultSkills();
      const result2 = getDefaultSkills();

      // Arrays should not be the same reference
      expect(result1).not.toBe(result2);

      // Individual skill objects should not be the same reference
      expect(result1[0]).not.toBe(result2[0]);
    });
  });

  describe("createSkillFromDefinition", () => {
    it("creates skill with behavioral fields from definition", () => {
      const lightPunchDef = SKILL_REGISTRY.find((s) => s.id === "light-punch")!;
      const skill = createSkillFromDefinition(lightPunchDef);

      expect(skill.id).toBe("light-punch");
      expect(skill.name).toBe("Light Punch");
      expect(skill.tickCost).toBe(1);
      expect(skill.range).toBe(1);
      expect(skill.damage).toBe(10);
      expect(skill.enabled).toBe(true);
      expect(skill.triggers).toHaveLength(1);
      expect(skill.triggers[0]?.type).toBe("always");
      expect(skill.selectorOverride?.type).toBe("nearest_enemy");
    });

    it("creates move skill with direction in name", () => {
      const moveDef = SKILL_REGISTRY.find((s) => s.id === "move-towards")!;
      const skill = createSkillFromDefinition(moveDef);

      expect(skill.name).toBe("Move Towards");
      expect(skill.mode).toBe("towards");
      expect(skill.damage).toBeUndefined();
    });
  });
});
