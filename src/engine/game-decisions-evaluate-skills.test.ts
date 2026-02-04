/**
 * Tests for evaluateSkillsForCharacter logic.
 */

/* eslint-disable max-lines */
// File exceeds 400 lines due to comprehensive test coverage for skill evaluation logic
// including graceful degradation tests. Cohesive grouping justified for test clarity.

import { describe, it, expect, vi, afterEach } from "vitest";
import { evaluateSkillsForCharacter } from "./game-decisions";
import {
  createCharacter,
  createSkill,
  createAttackAction,
} from "./game-test-helpers";

describe("evaluateSkillsForCharacter", () => {
  describe("mid-action detection", () => {
    it("should return isMidAction: true when character has currentAction", () => {
      const action = createAttackAction({ q: 3, r: 2 }, 10, 2);
      const character = createCharacter({
        id: "char1",
        position: { q: 3, r: 2 },
        currentAction: action,
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.isMidAction).toBe(true);
      expect(result.currentAction).toEqual(action);
      expect(result.skillEvaluations).toHaveLength(0);
      expect(result.selectedSkillIndex).toBeNull();
    });

    it("should evaluate skills when character has no currentAction", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 3, r: 2 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 3, r: 2 },
        currentAction: null,
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 5,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.isMidAction).toBe(false);
      expect(result.skillEvaluations).toHaveLength(1);
    });
  });

  describe("skill rejection reasons", () => {
    it("should reject disabled skill with reason 'disabled'", () => {
      const character = createCharacter({
        id: "char1",
        position: { q: 3, r: 2 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            enabled: false,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.skillEvaluations).toHaveLength(1);
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
      expect(result.skillEvaluations[0]!.rejectionReason).toBe("disabled");
    });

    it("should reject skill with failed trigger and include failedTriggers", () => {
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 3, r: 2 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "enemy_in_range", value: 1 }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.skillEvaluations).toHaveLength(1);
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
      expect(result.skillEvaluations[0]!.rejectionReason).toBe(
        "trigger_failed",
      );
      expect(result.skillEvaluations[0]!.failedTriggers).toHaveLength(1);
      expect(result.skillEvaluations[0]!.failedTriggers![0]!.type).toBe(
        "enemy_in_range",
      );
    });

    it("should reject skill when no target exists with reason 'no_target'", () => {
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 3, r: 2 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.skillEvaluations).toHaveLength(1);
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
      expect(result.skillEvaluations[0]!.rejectionReason).toBe("no_target");
    });

    it("should reject attack skill when target out of range with distance", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 3, r: -3 }, // Distance 5 from {q:3, r:2}
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 3, r: 2 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 1,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.skillEvaluations).toHaveLength(1);
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
      expect(result.skillEvaluations[0]!.rejectionReason).toBe("out_of_range");
      expect(result.skillEvaluations[0]!.distance).toBe(5);
      expect(result.skillEvaluations[0]!.target).toEqual(enemy);
    });
  });

  describe("skill selection", () => {
    it("should mark selected skill with status 'selected'", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 3, r: 2 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 5,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.skillEvaluations).toHaveLength(1);
      expect(result.skillEvaluations[0]!.status).toBe("selected");
      expect(result.selectedSkillIndex).toBe(0);
      expect(result.skillEvaluations[0]!.target).toEqual(enemy);
    });

    it("should select first matching skill in priority order", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 3, r: 2 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 5,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            range: 5,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.selectedSkillIndex).toBe(0);
      expect(result.skillEvaluations[0]!.skill.id).toBe("skill1");
      expect(result.skillEvaluations[0]!.status).toBe("selected");
    });

    it("should select second skill when first is rejected", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 3, r: -3 }, // Distance 5 from {q:3, r:2}
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 3, r: 2 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 1,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            range: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.selectedSkillIndex).toBe(1);
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
      expect(result.skillEvaluations[0]!.rejectionReason).toBe("out_of_range");
      expect(result.skillEvaluations[1]!.status).toBe("selected");
    });
  });

  describe("skipped skills", () => {
    it("should mark skills after selected skill as 'skipped'", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 3, r: 2 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 5,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            range: 5,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill3",
            damage: 30,
            range: 5,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.skillEvaluations).toHaveLength(3);
      expect(result.skillEvaluations[0]!.status).toBe("selected");
      expect(result.skillEvaluations[1]!.status).toBe("skipped");
      expect(result.skillEvaluations[2]!.status).toBe("skipped");
    });
  });

  describe("no valid skill (idle)", () => {
    it("should return null selectedSkillIndex when no skills are valid", () => {
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 3, r: 2 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 1,
            triggers: [{ type: "enemy_in_range", value: 1 }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.selectedSkillIndex).toBeNull();
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
    });

    it("should handle character with no skills", () => {
      const character = createCharacter({
        id: "char1",
        position: { q: 3, r: 2 },
        skills: [],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.skillEvaluations).toHaveLength(0);
      expect(result.selectedSkillIndex).toBeNull();
    });
  });

  describe("complex scenarios", () => {
    it("should evaluate multiple rejection reasons across skills", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 3, r: -3 }, // Distance 5 from {q:3, r:2}
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 3, r: 2 },
        hp: 100,
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            enabled: false,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            triggers: [{ type: "hp_below", value: 50 }],
          }),
          createSkill({
            id: "skill3",
            damage: 30,
            range: 1,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill4",
            damage: 40,
            range: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.skillEvaluations).toHaveLength(4);
      expect(result.skillEvaluations[0]!.rejectionReason).toBe("disabled");
      expect(result.skillEvaluations[1]!.rejectionReason).toBe(
        "trigger_failed",
      );
      expect(result.skillEvaluations[2]!.rejectionReason).toBe("out_of_range");
      expect(result.skillEvaluations[3]!.status).toBe("selected");
      expect(result.selectedSkillIndex).toBe(3);
    });
  });

  describe("graceful degradation for legacy hold mode", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should skip hold mode skill with console warning", () => {
      const character = createCharacter({
        id: "char1",
        position: { q: 3, r: 2 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "hold" as "towards" | "away",
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const consoleWarnSpy = vi.spyOn(console, "warn");

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.selectedSkillIndex).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/hold.*deprecated|deprecated.*hold/i),
      );
    });

    it("should fallback to next skill when first has deprecated hold mode", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 3, r: 2 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "hold" as "towards" | "away",
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 10,
            range: 5,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.selectedSkillIndex).toBe(1);
      expect(result.skillEvaluations[1]!.status).toBe("selected");
    });
  });

  // NEW TEST FOR MOVE SKILL DUPLICATION
  describe("Multiple Move Instances", () => {
    it("reports correct status for multiple moves", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 2, r: 0 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        hp: 100,
        maxHp: 100,
        skills: [
          createSkill({
            id: "move-towards",
            instanceId: "move-away-inst",
            mode: "away",
            triggers: [{ type: "hp_below", value: 50 }],
          }),
          createSkill({
            id: "move-towards",
            instanceId: "move-towards-inst",
            mode: "towards",
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.skillEvaluations[0]!.status).toBe("rejected");
      expect(result.skillEvaluations[0]!.rejectionReason).toBe(
        "trigger_failed",
      );
      expect(result.skillEvaluations[1]!.status).toBe("selected");
      expect(result.selectedSkillIndex).toBe(1);
    });
  });
});
