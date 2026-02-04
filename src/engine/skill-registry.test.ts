/**
 * Tests for skill registry.
 * Following TDD workflow - these tests are written before implementation.
 */

import { describe, it, expect } from "vitest";
import {
  SKILL_REGISTRY,
  getDefaultSkills,
  createSkillFromDefinition,
  generateInstanceId,
} from "./skill-registry";

describe("Skill Registry", () => {
  describe("SKILL_REGISTRY", () => {
    it("exports all skills", () => {
      expect(SKILL_REGISTRY).toHaveLength(4);

      const skillIds = SKILL_REGISTRY.map((skill) => skill.id);
      expect(skillIds).toEqual([
        "light-punch",
        "heavy-punch",
        "move-towards",
        "heal",
      ]);
    });

    it("skill definitions have required fields", () => {
      SKILL_REGISTRY.forEach((skill) => {
        // Required fields for all skills
        expect(skill.id).toBeTruthy();
        expect(typeof skill.id).toBe("string");

        expect(skill.name).toBeTruthy();
        expect(typeof skill.name).toBe("string");

        expect(skill.tickCost).toBeGreaterThanOrEqual(0);
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

    it("heal skill has healing and no damage", () => {
      const heal = SKILL_REGISTRY.find((s) => s.id === "heal");

      expect(heal?.healing).toBe(25);
      expect(heal?.damage).toBeUndefined();
      expect(heal?.tickCost).toBe(2);
      expect(heal?.range).toBe(5);
      expect(heal?.innate).toBe(false);
      expect(heal?.mode).toBeUndefined();
    });

    it("heal skill has defaultSelector lowest_hp_ally", () => {
      const heal = SKILL_REGISTRY.find((s) => s.id === "heal");

      expect(heal?.defaultSelector).toEqual({ type: "lowest_hp_ally" });
    });

    it("existing skills have defaultSelector nearest_enemy", () => {
      const lightPunch = SKILL_REGISTRY.find((s) => s.id === "light-punch");
      const heavyPunch = SKILL_REGISTRY.find((s) => s.id === "heavy-punch");
      const move = SKILL_REGISTRY.find((s) => s.id === "move-towards");

      expect(lightPunch?.defaultSelector).toEqual({ type: "nearest_enemy" });
      expect(heavyPunch?.defaultSelector).toEqual({ type: "nearest_enemy" });
      expect(move?.defaultSelector).toEqual({ type: "nearest_enemy" });
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

      expect(move.name).toBe("Move");
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
      expect(skill.tickCost).toBe(0);
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

      expect(skill.name).toBe("Move");
      expect(skill.mode).toBe("towards");
      expect(skill.damage).toBeUndefined();
    });

    it("createSkillFromDefinition uses defaultSelector for heal", () => {
      const healDef = SKILL_REGISTRY.find((s) => s.id === "heal")!;
      const skill = createSkillFromDefinition(healDef);

      expect(skill.selectorOverride?.type).toBe("lowest_hp_ally");
      expect(skill.healing).toBe(25);
      expect(skill.damage).toBeUndefined();
      expect(skill.tickCost).toBe(2);
      expect(skill.range).toBe(5);
    });
  });

  // NEW TESTS FOR INSTANT ATTACKS
  describe("Instant Attacks", () => {
    it("Light Punch has tickCost 0 (instant attack)", () => {
      const lightPunch = SKILL_REGISTRY.find((s) => s.id === "light-punch");
      expect(lightPunch?.tickCost).toBe(0);
    });

    it("createSkillFromDefinition preserves tickCost 0 for Light Punch", () => {
      const lightPunchDef = SKILL_REGISTRY.find((s) => s.id === "light-punch")!;
      const skill = createSkillFromDefinition(lightPunchDef);
      expect(skill.tickCost).toBe(0);
    });
  });

  // NEW TESTS FOR MOVE SKILL DUPLICATION
  describe("Instance ID Generation", () => {
    it("generateInstanceId returns string with registry prefix", () => {
      const instanceId = generateInstanceId("move-towards");

      expect(instanceId).toMatch(/^move-towards-\d+$/);
      expect(instanceId).toBeTruthy();
      expect(typeof instanceId).toBe("string");
    });

    it("generateInstanceId produces unique ids across calls", () => {
      const id1 = generateInstanceId("move-towards");
      const id2 = generateInstanceId("move-towards");
      const id3 = generateInstanceId("move-towards");

      const uniqueIds = new Set([id1, id2, id3]);
      expect(uniqueIds.size).toBe(3);
      expect(id1).toContain("move-towards-");
      expect(id2).toContain("move-towards-");
      expect(id3).toContain("move-towards-");
    });

    it("generateInstanceId unique across different registry ids", () => {
      const moveId = generateInstanceId("move-towards");
      const punchId = generateInstanceId("light-punch");

      expect(moveId).not.toBe(punchId);
      expect(moveId).toMatch(/^move-towards-/);
      expect(punchId).toMatch(/^light-punch-/);
    });

    it("getDefaultSkills generates unique instanceIds", () => {
      const skills = getDefaultSkills();

      expect(skills).toHaveLength(1);
      const skill = skills[0]!;
      expect(skill.instanceId).toBeDefined();
      expect(skill.instanceId).toBeTruthy();
      expect(skill.instanceId).toMatch(new RegExp(`^${skill.id}-`));
    });

    it("getDefaultSkills returns fresh instanceIds each call", () => {
      const result1 = getDefaultSkills();
      const result2 = getDefaultSkills();

      expect(result1[0]!.instanceId).not.toBe(result2[0]!.instanceId);
    });

    it("getDefaultSkills uses registry name without suffix", () => {
      const skills = getDefaultSkills();

      expect(skills).toHaveLength(1);
      const move = skills[0]!;
      expect(move.name).toBe("Move");
    });

    it("createSkillFromDefinition includes instanceId", () => {
      const lightPunchDef = SKILL_REGISTRY.find((s) => s.id === "light-punch")!;
      const skill = createSkillFromDefinition(lightPunchDef);

      expect(skill.instanceId).toBeDefined();
      expect(skill.instanceId).toBeTruthy();
      expect(skill.instanceId).toMatch(/^light-punch-/);
    });
  });
});
