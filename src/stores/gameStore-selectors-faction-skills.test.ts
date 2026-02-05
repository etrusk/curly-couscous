/**
 * Tests for getFactionAssignedSkillIds helper function.
 * Tests faction-scoped skill exclusivity logic.
 */

import { describe, it, expect } from "vitest";
import { getFactionAssignedSkillIds } from "./gameStore-selectors";
import { createCharacter, createSkill } from "../engine/game-test-helpers";

describe("getFactionAssignedSkillIds", () => {
  it("returns empty set when no characters exist", () => {
    const result = getFactionAssignedSkillIds([], "friendly");

    expect(result.size).toBe(0);
  });

  it("returns skill IDs for characters of matching faction only", () => {
    const friendlyA = createCharacter({
      id: "f1",
      faction: "friendly",
      skills: [createSkill({ id: "light-punch" })],
    });
    const enemyA = createCharacter({
      id: "e1",
      faction: "enemy",
      skills: [createSkill({ id: "heavy-punch" })],
    });

    const result = getFactionAssignedSkillIds([friendlyA, enemyA], "friendly");

    expect(result.has("light-punch")).toBe(true);
    expect(result.has("heavy-punch")).toBe(false);
    expect(result.size).toBe(1);
  });

  it("excludes innate skills from the returned set", () => {
    const friendlyA = createCharacter({
      id: "f1",
      faction: "friendly",
      skills: [createSkill({ id: "move-towards", behavior: "towards" })],
    });
    const friendlyB = createCharacter({
      id: "f2",
      faction: "friendly",
      skills: [createSkill({ id: "move-towards", behavior: "towards" })],
    });

    const result = getFactionAssignedSkillIds(
      [friendlyA, friendlyB],
      "friendly",
    );

    expect(result.has("move-towards")).toBe(false);
    expect(result.size).toBe(0);
  });

  it("returns multiple skill IDs across multiple same-faction characters", () => {
    const friendlyA = createCharacter({
      id: "f1",
      faction: "friendly",
      skills: [createSkill({ id: "light-punch" })],
    });
    const friendlyB = createCharacter({
      id: "f2",
      faction: "friendly",
      skills: [createSkill({ id: "heavy-punch" })],
    });

    const result = getFactionAssignedSkillIds(
      [friendlyA, friendlyB],
      "friendly",
    );

    expect(result.has("light-punch")).toBe(true);
    expect(result.has("heavy-punch")).toBe(true);
    expect(result.size).toBe(2);
  });

  it("includes non-registry skill IDs (custom test skills treated as assignable)", () => {
    const friendlyA = createCharacter({
      id: "f1",
      faction: "friendly",
      skills: [createSkill({ id: "custom-skill" })],
    });

    const result = getFactionAssignedSkillIds([friendlyA], "friendly");

    expect(result.has("custom-skill")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("works correctly for enemy faction", () => {
    const enemyA = createCharacter({
      id: "e1",
      faction: "enemy",
      skills: [createSkill({ id: "light-punch" })],
    });
    const enemyB = createCharacter({
      id: "e2",
      faction: "enemy",
      skills: [createSkill({ id: "heavy-punch" })],
    });
    const friendlyA = createCharacter({
      id: "f1",
      faction: "friendly",
      skills: [createSkill({ id: "light-punch" })],
    });

    const result = getFactionAssignedSkillIds(
      [enemyA, enemyB, friendlyA],
      "enemy",
    );

    expect(result.has("light-punch")).toBe(true);
    expect(result.has("heavy-punch")).toBe(true);
    expect(result.size).toBe(2);
  });
});
