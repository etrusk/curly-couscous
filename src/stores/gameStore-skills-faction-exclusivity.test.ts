import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";

describe("assignSkillToCharacter - faction exclusivity", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("rejects assignment when another same-faction character already has the skill", () => {
    const friendlyA = createCharacter({
      id: "f1",
      faction: "friendly",
      skills: [],
    });
    const friendlyB = createCharacter({
      id: "f2",
      faction: "friendly",
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendlyA, friendlyB]);

    useGameStore.getState().actions.assignSkillToCharacter("f1", "light-punch");

    useGameStore.getState().actions.assignSkillToCharacter("f2", "light-punch");

    const updatedF2 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "f2");
    expect(updatedF2?.skills.some((s) => s.id === "light-punch")).toBe(false);
    expect(updatedF2?.skills.length).toBe(0);

    const updatedF1 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "f1");
    expect(updatedF1?.skills.some((s) => s.id === "light-punch")).toBe(true);
  });

  it("rejects assignment when another same-faction enemy already has the skill", () => {
    const enemyA = createCharacter({ id: "e1", faction: "enemy", skills: [] });
    const enemyB = createCharacter({ id: "e2", faction: "enemy", skills: [] });
    useGameStore.getState().actions.initBattle([enemyA, enemyB]);

    useGameStore.getState().actions.assignSkillToCharacter("e1", "heavy-punch");

    useGameStore.getState().actions.assignSkillToCharacter("e2", "heavy-punch");

    const updatedE2 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "e2");
    expect(updatedE2?.skills.some((s) => s.id === "heavy-punch")).toBe(false);
    expect(updatedE2?.skills.length).toBe(0);

    const updatedE1 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "e1");
    expect(updatedE1?.skills.some((s) => s.id === "heavy-punch")).toBe(true);
  });

  it("allows cross-faction assignment of the same skill", () => {
    const friendlyA = createCharacter({
      id: "f1",
      faction: "friendly",
      skills: [],
    });
    const enemyA = createCharacter({ id: "e1", faction: "enemy", skills: [] });
    useGameStore.getState().actions.initBattle([friendlyA, enemyA]);

    useGameStore.getState().actions.assignSkillToCharacter("f1", "light-punch");

    useGameStore.getState().actions.assignSkillToCharacter("e1", "light-punch");

    const updatedE1 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "e1");
    expect(updatedE1?.skills.some((s) => s.id === "light-punch")).toBe(true);
    expect(updatedE1?.skills.length).toBe(1);

    const updatedF1 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "f1");
    expect(updatedF1?.skills.some((s) => s.id === "light-punch")).toBe(true);
  });

  it("allows assignment after skill is removed from same-faction character", () => {
    const friendlyA = createCharacter({
      id: "f1",
      faction: "friendly",
      skills: [],
    });
    const friendlyB = createCharacter({
      id: "f2",
      faction: "friendly",
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendlyA, friendlyB]);

    useGameStore.getState().actions.assignSkillToCharacter("f1", "light-punch");

    // Get instanceId of light-punch to remove it
    const f1 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "f1");
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const lightPunchInstanceId = f1?.skills.find(
      (s) => s.id === "light-punch",
    )?.instanceId!;

    useGameStore
      .getState()
      .actions.removeSkillFromCharacter("f1", lightPunchInstanceId);

    useGameStore.getState().actions.assignSkillToCharacter("f2", "light-punch");

    const updatedF2 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "f2");
    expect(updatedF2?.skills.some((s) => s.id === "light-punch")).toBe(true);
    expect(updatedF2?.skills.length).toBe(1);

    const updatedF1 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "f1");
    expect(updatedF1?.skills.some((s) => s.id === "light-punch")).toBe(false);
  });

  it("innate skills do not trigger faction exclusivity guard", () => {
    const moveSkill = createSkill({ id: "move-towards", behavior: "towards" });
    const friendlyA = createCharacter({
      id: "f1",
      faction: "friendly",
      skills: [moveSkill],
    });
    const friendlyB = createCharacter({
      id: "f2",
      faction: "friendly",
      skills: [moveSkill],
    });
    useGameStore.getState().actions.initBattle([friendlyA, friendlyB]);

    const characters = useGameStore.getState().gameState.characters;

    const char1 = characters.find((c) => c.id === "f1");
    const char2 = characters.find((c) => c.id === "f2");

    expect(char1?.skills.some((s) => s.id === "move-towards")).toBe(true);
    expect(char2?.skills.some((s) => s.id === "move-towards")).toBe(true);
  });

  it("does not affect already-assigned skills on target character", () => {
    const friendlyA = createCharacter({
      id: "f1",
      faction: "friendly",
      skills: [],
    });
    const friendlyB = createCharacter({
      id: "f2",
      faction: "friendly",
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendlyA, friendlyB]);

    useGameStore.getState().actions.assignSkillToCharacter("f1", "light-punch");
    useGameStore.getState().actions.assignSkillToCharacter("f2", "heavy-punch");

    useGameStore.getState().actions.assignSkillToCharacter("f2", "light-punch");

    const updatedF2 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "f2");
    expect(updatedF2?.skills.some((s) => s.id === "heavy-punch")).toBe(true);
    expect(updatedF2?.skills.some((s) => s.id === "light-punch")).toBe(false);
    expect(updatedF2?.skills.length).toBe(1);
  });
});
