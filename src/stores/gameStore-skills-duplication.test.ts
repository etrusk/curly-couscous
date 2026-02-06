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
      behavior: "towards",
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
      behavior: "towards",
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
      behavior: "away",
      triggers: [{ type: "hp_below", value: 50 }],
      target: "enemy",
      criterion: "lowest_hp",
    });
    const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.duplicateSkill("char1", "source");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const newSkill = updatedChar?.skills[1];
    expect(newSkill?.behavior).toBe("towards");
    expect(newSkill?.target).toBe("enemy");
    expect(newSkill?.criterion).toBe("nearest");
    expect(newSkill?.triggers).toEqual([{ type: "always" }]);
    expect(newSkill?.enabled).toBe(true);
  });

  it("enforces max 3 move instances", () => {
    const move1 = createSkill({
      id: "move-towards",
      instanceId: "move1",
      behavior: "towards",
    });
    const move2 = createSkill({
      id: "move-towards",
      instanceId: "move2",
      behavior: "towards",
    });
    const move3 = createSkill({
      id: "move-towards",
      instanceId: "move3",
      behavior: "towards",
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
      behavior: "towards",
    });
    const fillerSkills = Array.from({ length: 9 }, (_, i) =>
      createSkill({ id: `filler${i}`, instanceId: `filler${i}` }),
    );
    const char1 = createCharacter({
      id: "char1",
      skills: [move, ...fillerSkills],
    });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.duplicateSkill("char1", "move1");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(10);
  });

  it("allows duplicating non-move skills within maxInstances", () => {
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
    expect(updatedChar?.skills).toHaveLength(2);
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
      behavior: "towards",
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

  // NEW TESTS FOR NON-MOVE DUPLICATION
  it("blocks duplication when skill has reached maxInstances", () => {
    const lp1 = createSkill({
      id: "light-punch",
      instanceId: "light-punch-inst1",
      damage: 10,
    });
    const lp2 = createSkill({
      id: "light-punch",
      instanceId: "light-punch-inst2",
      damage: 10,
    });
    const char1 = createCharacter({ id: "char1", skills: [lp1, lp2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore
      .getState()
      .actions.duplicateSkill("char1", "light-punch-inst1");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(2);
  });

  it("duplicated skill gets default config from registry", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      instanceId: "move-source",
      behavior: "away",
      triggers: [{ type: "hp_below", value: 50 }],
      target: "ally",
      criterion: "lowest_hp",
    });
    const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.duplicateSkill("char1", "move-source");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const newSkill = updatedChar?.skills[1];

    // Should get defaults from registry, not copy source config
    expect(newSkill?.behavior).toBe("towards");
    expect(newSkill?.target).toBe("enemy");
    expect(newSkill?.criterion).toBe("nearest");
    expect(newSkill?.triggers).toEqual([{ type: "always" }]);
    expect(newSkill?.enabled).toBe(true);
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
      behavior: "towards",
    });
    const move2 = createSkill({
      id: "move-towards",
      instanceId: "move2",
      behavior: "towards",
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
      behavior: "towards",
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
      behavior: "towards",
    });
    const duplicate = createSkill({
      id: "move-towards",
      instanceId: "duplicate",
      behavior: "towards",
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
      behavior: "towards",
    });
    const move2 = createSkill({
      id: "move-towards",
      instanceId: "inst2",
      behavior: "towards",
    });
    const char1 = createCharacter({ id: "char1", skills: [move1, move2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore
      .getState()
      .actions.updateSkill("char1", "inst2", { behavior: "away" });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(
      updatedChar?.skills.find((s) => s.instanceId === "inst1")?.behavior,
    ).toBe("towards");
    expect(
      updatedChar?.skills.find((s) => s.instanceId === "inst2")?.behavior,
    ).toBe("away");
  });
});
