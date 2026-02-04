/**
 * Tests for Move skill duplication functionality.
 * Extracted from gameStore-skills.test.ts for better organization.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";

describe("duplicateSkill", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("creates new instance with unique instanceId", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      instanceId: "move-towards-inst1",
      mode: "towards",
    });
    const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore
      .getState()
      .actions.duplicateSkill("char1", "move-towards-inst1");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(2);
    expect(updatedChar?.skills[0]?.id).toBe("move-towards");
    expect(updatedChar?.skills[1]?.id).toBe("move-towards");
    expect(updatedChar?.skills[0]?.instanceId).not.toBe(
      updatedChar?.skills[1]?.instanceId,
    );
    expect(updatedChar?.skills[1]?.instanceId).toBeTruthy();
    expect(updatedChar?.skills[1]?.instanceId).toMatch(/^move-towards-/);
  });

  it("inserts after source in priority list", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      instanceId: "inst1",
      mode: "towards",
    });
    const punchSkill = createSkill({
      id: "light-punch",
      instanceId: "inst2",
      damage: 10,
    });
    const char1 = createCharacter({
      id: "char1",
      skills: [moveSkill, punchSkill],
    });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.duplicateSkill("char1", "inst1");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(3);
    expect(updatedChar?.skills[0]?.instanceId).toBe("inst1");
    expect(updatedChar?.skills[1]?.id).toBe("move-towards");
    expect(updatedChar?.skills[2]?.instanceId).toBe("inst2");
  });

  it("new instance has default config", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      instanceId: "source",
      mode: "away",
      triggers: [{ type: "hp_below", value: 50 }],
      selectorOverride: { type: "lowest_hp_enemy" },
    });
    const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.duplicateSkill("char1", "source");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const newSkill = updatedChar?.skills[1];
    expect(newSkill?.mode).toBe("towards");
    expect(newSkill?.triggers).toEqual([{ type: "always" }]);
    expect(newSkill?.selectorOverride).toEqual({ type: "nearest_enemy" });
    expect(newSkill?.enabled).toBe(true);
  });

  it("enforces max 3 move instances", () => {
    const move1 = createSkill({
      id: "move-towards",
      instanceId: "move1",
      mode: "towards",
    });
    const move2 = createSkill({
      id: "move-towards",
      instanceId: "move2",
      mode: "towards",
    });
    const move3 = createSkill({
      id: "move-towards",
      instanceId: "move3",
      mode: "towards",
    });
    const char1 = createCharacter({
      id: "char1",
      skills: [move1, move2, move3],
    });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.duplicateSkill("char1", "move1");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(3);
  });

  it("enforces max skill slots", () => {
    const move = createSkill({
      id: "move-towards",
      instanceId: "move1",
      mode: "towards",
    });
    const punch1 = createSkill({
      id: "light-punch",
      instanceId: "punch1",
      damage: 10,
    });
    const punch2 = createSkill({
      id: "heavy-punch",
      instanceId: "punch2",
      damage: 25,
    });
    const char1 = createCharacter({
      id: "char1",
      skills: [move, punch1, punch2],
    });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.duplicateSkill("char1", "move1");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(3);
  });

  it("rejects non-move skills", () => {
    const punchSkill = createSkill({
      id: "light-punch",
      instanceId: "punch1",
      damage: 10,
    });
    const char1 = createCharacter({ id: "char1", skills: [punchSkill] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.duplicateSkill("char1", "punch1");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(1);
  });

  it("handles nonexistent character gracefully", () => {
    useGameStore.getState().actions.initBattle([]);

    expect(() => {
      useGameStore.getState().actions.duplicateSkill("nonexistent", "some-id");
    }).not.toThrow();
  });

  it("handles nonexistent instanceId gracefully", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      instanceId: "move1",
      mode: "towards",
    });
    const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
    useGameStore.getState().actions.initBattle([char1]);

    expect(() => {
      useGameStore
        .getState()
        .actions.duplicateSkill("char1", "nonexistent-instance");
    }).not.toThrow();

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(1);
  });
});

describe("removeSkillFromCharacter - with Move duplication", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("allows removing duplicate move", () => {
    const move1 = createSkill({
      id: "move-towards",
      instanceId: "move1",
      mode: "towards",
    });
    const move2 = createSkill({
      id: "move-towards",
      instanceId: "move2",
      mode: "towards",
    });
    const char1 = createCharacter({ id: "char1", skills: [move1, move2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.removeSkillFromCharacter("char1", "move2");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(1);
    expect(updatedChar?.skills[0]?.instanceId).toBe("move1");
    expect(updatedChar?.skills.some((s) => s.instanceId === "move2")).toBe(
      false,
    );
  });

  it("prevents removing last move instance", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      instanceId: "move1",
      mode: "towards",
    });
    const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.removeSkillFromCharacter("char1", "move1");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(1);
    expect(updatedChar?.skills[0]?.instanceId).toBe("move1");
  });

  it("allows removing original if duplicate exists", () => {
    const original = createSkill({
      id: "move-towards",
      instanceId: "original",
      mode: "towards",
    });
    const duplicate = createSkill({
      id: "move-towards",
      instanceId: "duplicate",
      mode: "towards",
    });
    const char1 = createCharacter({
      id: "char1",
      skills: [original, duplicate],
    });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore
      .getState()
      .actions.removeSkillFromCharacter("char1", "original");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(1);
    expect(updatedChar?.skills[0]?.instanceId).toBe("duplicate");
  });
});

describe("updateSkill - targets correct instance by instanceId", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("targets correct instance by instanceId", () => {
    const move1 = createSkill({
      id: "move-towards",
      instanceId: "inst1",
      mode: "towards",
    });
    const move2 = createSkill({
      id: "move-towards",
      instanceId: "inst2",
      mode: "towards",
    });
    const char1 = createCharacter({ id: "char1", skills: [move1, move2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore
      .getState()
      .actions.updateSkill("char1", "inst2", { mode: "away" });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(
      updatedChar?.skills.find((s) => s.instanceId === "inst1")?.mode,
    ).toBe("towards");
    expect(
      updatedChar?.skills.find((s) => s.instanceId === "inst2")?.mode,
    ).toBe("away");
  });
});
