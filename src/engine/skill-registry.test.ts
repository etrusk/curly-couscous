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
      expect(SKILL_REGISTRY).toHaveLength(8);

      const skillIds = SKILL_REGISTRY.map((skill) => skill.id);
      expect(skillIds).toEqual([
        "light-punch",
        "heavy-punch",
        "move-towards",
        "heal",
        "ranged-attack",
        "dash",
        "kick",
        "charge",
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
      expect(lightPunch?.behaviors).toEqual([]);

      expect(heavyPunch?.damage).toBe(25);
      expect(heavyPunch?.behaviors).toEqual([]);
    });

    it("move skill has behaviors", () => {
      const moveSkill = SKILL_REGISTRY.find((s) => s.id === "move-towards");

      expect(moveSkill?.behaviors).toEqual(["towards", "away"]);
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
      expect(heal?.behaviors).toEqual([]);
    });

    it("heal skill has default target/criterion", () => {
      const heal = SKILL_REGISTRY.find((s) => s.id === "heal");

      expect(heal?.defaultTarget).toBe("ally");
      expect(heal?.defaultCriterion).toBe("lowest_hp");
    });

    it("existing skills have default target/criterion", () => {
      const lightPunch = SKILL_REGISTRY.find((s) => s.id === "light-punch");
      const heavyPunch = SKILL_REGISTRY.find((s) => s.id === "heavy-punch");
      const move = SKILL_REGISTRY.find((s) => s.id === "move-towards");

      expect(lightPunch?.defaultTarget).toBe("enemy");
      expect(lightPunch?.defaultCriterion).toBe("nearest");
      expect(heavyPunch?.defaultTarget).toBe("enemy");
      expect(heavyPunch?.defaultCriterion).toBe("nearest");
      expect(move?.defaultTarget).toBe("enemy");
      expect(move?.defaultCriterion).toBe("nearest");
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
      expect(skill.trigger).toBeDefined();
      expect(skill.trigger.scope).toBe("enemy");
      expect(skill.trigger.condition).toBe("always");
      expect(skill.target).toBe("enemy");
      expect(skill.criterion).toBe("nearest");
    });

    it("produces new trigger shape (no triggers plural property)", () => {
      const skills = getDefaultSkills();

      skills.forEach((skill) => {
        expect(skill.trigger.scope).toBeDefined();
        expect(skill.trigger.condition).toBe("always");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- runtime guard
        expect((skill as any).triggers).toBeUndefined();
      });
    });

    it("preserves intrinsic properties for innate skills", () => {
      const skills = getDefaultSkills();

      // Only Move should be returned
      expect(skills).toHaveLength(1);
      const move = skills[0]!;

      expect(move.id).toBe("move-towards");
      expect(move.tickCost).toBe(1);
      expect(move.range).toBe(1);
      expect(move.behavior).toBe("towards");
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
      expect(skill.trigger).toBeDefined();
      expect(skill.trigger.scope).toBe("enemy");
      expect(skill.trigger.condition).toBe("always");
      expect(skill.target).toBe("enemy");
      expect(skill.criterion).toBe("nearest");
    });

    it("produces new trigger shape from definition", () => {
      const lightPunchDef = SKILL_REGISTRY.find((s) => s.id === "light-punch")!;
      const skill = createSkillFromDefinition(lightPunchDef);

      expect(skill.trigger).toBeDefined();
      expect(skill.trigger.scope).toBe("enemy");
      expect(skill.trigger.condition).toBe("always");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- runtime guard
      expect((skill as any).triggers).toBeUndefined();
    });

    it("creates move skill with direction in name", () => {
      const moveDef = SKILL_REGISTRY.find((s) => s.id === "move-towards")!;
      const skill = createSkillFromDefinition(moveDef);

      expect(skill.name).toBe("Move");
      expect(skill.behavior).toBe("towards");
      expect(skill.damage).toBeUndefined();
    });

    it("createSkillFromDefinition uses default target/criterion for heal", () => {
      const healDef = SKILL_REGISTRY.find((s) => s.id === "heal")!;
      const skill = createSkillFromDefinition(healDef);

      expect(skill.target).toBe("ally");
      expect(skill.criterion).toBe("lowest_hp");
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

  // NEW TESTS FOR ACTION TYPE FIELD
  describe("Action Type Field", () => {
    it("should have actionType field on all registry entries", () => {
      SKILL_REGISTRY.forEach((skill) => {
        expect(skill.actionType).toBeDefined();
        expect(["attack", "move", "heal", "interrupt", "charge"]).toContain(
          skill.actionType,
        );
      });

      const lightPunch = SKILL_REGISTRY.find((s) => s.id === "light-punch");
      const heavyPunch = SKILL_REGISTRY.find((s) => s.id === "heavy-punch");
      const move = SKILL_REGISTRY.find((s) => s.id === "move-towards");
      const heal = SKILL_REGISTRY.find((s) => s.id === "heal");

      expect(lightPunch?.actionType).toBe("attack");
      expect(heavyPunch?.actionType).toBe("attack");
      expect(move?.actionType).toBe("move");
      expect(heal?.actionType).toBe("heal");
    });

    it("should propagate actionType from registry to Skill instances", () => {
      const lightPunchDef = SKILL_REGISTRY.find((s) => s.id === "light-punch")!;
      const heavyPunchDef = SKILL_REGISTRY.find((s) => s.id === "heavy-punch")!;
      const moveDef = SKILL_REGISTRY.find((s) => s.id === "move-towards")!;
      const healDef = SKILL_REGISTRY.find((s) => s.id === "heal")!;

      const lightPunchSkill = createSkillFromDefinition(lightPunchDef);
      const heavyPunchSkill = createSkillFromDefinition(heavyPunchDef);
      const moveSkill = createSkillFromDefinition(moveDef);
      const healSkill = createSkillFromDefinition(healDef);

      expect(lightPunchSkill.actionType).toBe("attack");
      expect(heavyPunchSkill.actionType).toBe("attack");
      expect(moveSkill.actionType).toBe("move");
      expect(healSkill.actionType).toBe("heal");
    });
  });

  // NEW TESTS FOR BEHAVIORS ARRAY
  describe("Behaviors Array", () => {
    it("should have behaviors array on all registry entries", () => {
      SKILL_REGISTRY.forEach((skill) => {
        expect(Array.isArray(skill.behaviors)).toBe(true);
      });

      const lightPunch = SKILL_REGISTRY.find((s) => s.id === "light-punch");
      const heavyPunch = SKILL_REGISTRY.find((s) => s.id === "heavy-punch");
      const move = SKILL_REGISTRY.find((s) => s.id === "move-towards");
      const heal = SKILL_REGISTRY.find((s) => s.id === "heal");

      expect(lightPunch?.behaviors).toEqual([]);
      expect(lightPunch?.defaultBehavior).toBe("");
      expect(heavyPunch?.behaviors).toEqual([]);
      expect(heavyPunch?.defaultBehavior).toBe("");
      expect(move?.behaviors).toEqual(["towards", "away"]);
      expect(move?.defaultBehavior).toBe("towards");
      expect(heal?.behaviors).toEqual([]);
      expect(heal?.defaultBehavior).toBe("");
    });
  });

  // GUARD: No per-skill instance limit
  describe("No Per-Skill Instance Limit", () => {
    it("registry entries do not have maxInstances property", () => {
      SKILL_REGISTRY.forEach((skill) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- runtime guard against re-adding removed field
        expect((skill as any).maxInstances).toBeUndefined();
      });
    });
  });

  // NEW TESTS FOR DEFAULT TARGET AND CRITERION
  describe("Default Target and Criterion", () => {
    it("should have defaultTarget and defaultCriterion on all registry entries", () => {
      const lightPunch = SKILL_REGISTRY.find((s) => s.id === "light-punch");
      const heavyPunch = SKILL_REGISTRY.find((s) => s.id === "heavy-punch");
      const move = SKILL_REGISTRY.find((s) => s.id === "move-towards");
      const heal = SKILL_REGISTRY.find((s) => s.id === "heal");

      expect(lightPunch?.defaultTarget).toBe("enemy");
      expect(lightPunch?.defaultCriterion).toBe("nearest");
      expect(heavyPunch?.defaultTarget).toBe("enemy");
      expect(heavyPunch?.defaultCriterion).toBe("nearest");
      expect(move?.defaultTarget).toBe("enemy");
      expect(move?.defaultCriterion).toBe("nearest");
      expect(heal?.defaultTarget).toBe("ally");
      expect(heal?.defaultCriterion).toBe("lowest_hp");
    });
  });
});
