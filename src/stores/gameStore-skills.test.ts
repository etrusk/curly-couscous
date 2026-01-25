/**
 * Tests for SkillsPanel store integration (skill configuration, selection, ordering).
 * Extracted from gameStore.test.ts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";
import type { Skill } from "../engine/types";

describe("updateSkill", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should update skill enabled property", () => {
    const skill = createSkill({ id: "skill1", enabled: true });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore
      .getState()
      .actions.updateSkill("char1", "skill1", { enabled: false });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    expect(updatedSkill?.enabled).toBe(false);
  });

  it("should update skill triggers", () => {
    const skill = createSkill({ id: "skill1", triggers: [{ type: "always" }] });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    const newTriggers = [{ type: "enemy_in_range" as const, value: 3 }];
    useGameStore
      .getState()
      .actions.updateSkill("char1", "skill1", { triggers: newTriggers });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    expect(updatedSkill?.triggers).toEqual(newTriggers);
  });

  it("should update skill selectorOverride", () => {
    const skill = createSkill({ id: "skill1" });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    const newSelector = { type: "lowest_hp_enemy" as const };
    useGameStore.getState().actions.updateSkill("char1", "skill1", {
      selectorOverride: newSelector,
    });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    expect(updatedSkill?.selectorOverride).toEqual(newSelector);
  });

  it("should update skill mode (for Move skill)", () => {
    const skill = createSkill({ id: "move", mode: "towards" });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore
      .getState()
      .actions.updateSkill("char1", "move", { mode: "away" });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "move");
    expect(updatedSkill?.mode).toBe("away");
  });

  it("should not affect other skills on the same character", () => {
    const skill1 = createSkill({ id: "skill1", enabled: true });
    const skill2 = createSkill({ id: "skill2", enabled: true });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore
      .getState()
      .actions.updateSkill("char1", "skill1", { enabled: false });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill2 = updatedChar?.skills.find((s) => s.id === "skill2");
    expect(updatedSkill2?.enabled).toBe(true);
  });

  it("should not affect other characters", () => {
    const skill = createSkill({ id: "skill1", enabled: true });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    const char2 = createCharacter({ id: "char2", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1, char2]);

    useGameStore
      .getState()
      .actions.updateSkill("char1", "skill1", { enabled: false });

    const updatedChar2 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char2");
    const char2Skill = updatedChar2?.skills.find((s) => s.id === "skill1");
    expect(char2Skill?.enabled).toBe(true);
  });

  it("should handle updating non-existent skill gracefully", () => {
    const char1 = createCharacter({ id: "char1", skills: [] });
    useGameStore.getState().actions.initBattle([char1]);

    // Should not throw
    expect(() => {
      useGameStore
        .getState()
        .actions.updateSkill("char1", "nonexistent", { enabled: false });
    }).not.toThrow();
  });

  it("should handle updating skill with empty updates object", () => {
    const skill = createSkill({ id: "skill1", enabled: true });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    expect(() => {
      useGameStore.getState().actions.updateSkill("char1", "skill1", {});
    }).not.toThrow();

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    expect(updatedSkill?.enabled).toBe(true); // unchanged
  });

  it("should ignore invalid property (non-existent property) without throwing", () => {
    const skill = createSkill({ id: "skill1" });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    expect(() => {
      useGameStore
        .getState()
        .actions.updateSkill("char1", "skill1", {
          foo: "bar",
        } as unknown as Partial<Skill>);
    }).not.toThrow();

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    // The property may be added but we don't care; just ensure no crash
    expect(updatedSkill).toBeDefined();
  });

  it("should handle null values for properties", () => {
    const skill = createSkill({ id: "skill1", enabled: true });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    expect(() => {
      useGameStore
        .getState()
        .actions.updateSkill("char1", "skill1", {
          enabled: null,
        } as unknown as Partial<Skill>);
    }).not.toThrow();

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    // The store may assign null; we just test no crash
    expect(updatedSkill).toBeDefined();
  });

  it("should handle undefined values for properties", () => {
    const skill = createSkill({ id: "skill1", enabled: true });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    expect(() => {
      useGameStore
        .getState()
        .actions.updateSkill("char1", "skill1", { enabled: undefined });
    }).not.toThrow();

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    // Property may become undefined; we just test no crash
    expect(updatedSkill).toBeDefined();
  });

  it("should handle updating skill on non-existent character gracefully", () => {
    useGameStore.getState().actions.initBattle([]);

    expect(() => {
      useGameStore
        .getState()
        .actions.updateSkill("nonexistent-char", "skill1", { enabled: false });
    }).not.toThrow();
  });
});

describe("moveSkillUp", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should move skill from index 1 to index 0", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillUp("char1", 1);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill2");
    expect(updatedChar?.skills[1]?.id).toBe("skill1");
  });

  it("should move skill from middle position", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const skill3 = createSkill({ id: "skill3" });
    const char1 = createCharacter({
      id: "char1",
      skills: [skill1, skill2, skill3],
    });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillUp("char1", 2);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill1");
    expect(updatedChar?.skills[1]?.id).toBe("skill3");
    expect(updatedChar?.skills[2]?.id).toBe("skill2");
  });

  it("should do nothing when skill is already at top (index 0)", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillUp("char1", 0);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill1");
    expect(updatedChar?.skills[1]?.id).toBe("skill2");
  });

  it("should not affect other characters", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    const char2 = createCharacter({ id: "char2", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1, char2]);

    useGameStore.getState().actions.moveSkillUp("char1", 1);

    const updatedChar2 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char2");
    expect(updatedChar2?.skills[0]?.id).toBe("skill1");
    expect(updatedChar2?.skills[1]?.id).toBe("skill2");
  });

  it("should handle out-of-bounds index gracefully", () => {
    const skill1 = createSkill({ id: "skill1" });
    const char1 = createCharacter({ id: "char1", skills: [skill1] });
    useGameStore.getState().actions.initBattle([char1]);

    // Should not throw
    expect(() => {
      useGameStore.getState().actions.moveSkillUp("char1", 5);
    }).not.toThrow();
  });
});

describe("moveSkillDown", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should move skill from index 0 to index 1", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillDown("char1", 0);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill2");
    expect(updatedChar?.skills[1]?.id).toBe("skill1");
  });

  it("should move skill from middle position", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const skill3 = createSkill({ id: "skill3" });
    const char1 = createCharacter({
      id: "char1",
      skills: [skill1, skill2, skill3],
    });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillDown("char1", 1);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill1");
    expect(updatedChar?.skills[1]?.id).toBe("skill3");
    expect(updatedChar?.skills[2]?.id).toBe("skill2");
  });

  it("should do nothing when skill is already at bottom", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillDown("char1", 1);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill1");
    expect(updatedChar?.skills[1]?.id).toBe("skill2");
  });

  it("should not affect other characters", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    const char2 = createCharacter({ id: "char2", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1, char2]);

    useGameStore.getState().actions.moveSkillDown("char1", 0);

    const updatedChar2 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char2");
    expect(updatedChar2?.skills[0]?.id).toBe("skill1");
    expect(updatedChar2?.skills[1]?.id).toBe("skill2");
  });

  it("should handle out-of-bounds index gracefully", () => {
    const skill1 = createSkill({ id: "skill1" });
    const char1 = createCharacter({ id: "char1", skills: [skill1] });
    useGameStore.getState().actions.initBattle([char1]);

    // Should not throw
    expect(() => {
      useGameStore.getState().actions.moveSkillDown("char1", 5);
    }).not.toThrow();
  });
});
