/**
 * Tests for click-to-place debugging UI (selection mode, position-based placement, movement).
 * Extracted from gameStore.test.ts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectClickableCells } from "./gameStore";
import { createCharacter } from "./gameStore-test-helpers";

describe("Selection Mode", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("selectionMode should default to 'idle'", () => {
    const { selectionMode } = useGameStore.getState();
    expect(selectionMode).toBe("idle");
  });

  it("setSelectionMode should update selectionMode state", () => {
    useGameStore.getState().actions.setSelectionMode("placing-friendly");
    expect(useGameStore.getState().selectionMode).toBe("placing-friendly");

    useGameStore.getState().actions.setSelectionMode("placing-enemy");
    expect(useGameStore.getState().selectionMode).toBe("placing-enemy");

    useGameStore.getState().actions.setSelectionMode("moving");
    expect(useGameStore.getState().selectionMode).toBe("moving");

    useGameStore.getState().actions.setSelectionMode("idle");
    expect(useGameStore.getState().selectionMode).toBe("idle");
  });
});

describe("selectCharacter", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should set selectedCharacterId when given a valid character id", () => {
    const char1 = createCharacter({ id: "char1" });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.selectCharacter("char1");

    expect(useGameStore.getState().selectedCharacterId).toBe("char1");
  });

  it("should clear selectedCharacterId when given null", () => {
    const char1 = createCharacter({ id: "char1" });
    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.selectCharacter("char1");

    useGameStore.getState().actions.selectCharacter(null);

    expect(useGameStore.getState().selectedCharacterId).toBeNull();
  });

  it("should allow selecting a different character", () => {
    const char1 = createCharacter({ id: "char1" });
    const char2 = createCharacter({ id: "char2" });
    useGameStore.getState().actions.initBattle([char1, char2]);

    useGameStore.getState().actions.selectCharacter("char1");
    expect(useGameStore.getState().selectedCharacterId).toBe("char1");

    useGameStore.getState().actions.selectCharacter("char2");
    expect(useGameStore.getState().selectedCharacterId).toBe("char2");
  });
});

describe("addCharacterAtPosition", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.initBattle([]);
  });

  it("addCharacterAtPosition should place character at specified position", () => {
    const result = useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 2, r: 3 });

    expect(result).toBe(true);

    const characters = useGameStore.getState().gameState.characters;
    expect(characters).toHaveLength(1);
    expect(characters[0]?.position).toEqual({ q: 2, r: 3 });
    expect(characters[0]?.faction).toBe("friendly");
  });

  it("addCharacterAtPosition should return false if position is occupied", () => {
    // Place first character
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 1, r: 1 });

    // Try to place second character at same position
    const result = useGameStore
      .getState()
      .actions.addCharacterAtPosition("enemy", { q: 1, r: 1 });

    expect(result).toBe(false);
    expect(useGameStore.getState().gameState.characters).toHaveLength(1);
  });

  it("addCharacterAtPosition should return false if position is out of bounds", () => {
    const outOfBoundsPositions = [
      { q: -6, r: 0 }, // |q| > 5
      { q: 0, r: -6 }, // |r| > 5
      { q: 6, r: 0 }, // |q| > 5
      { q: 0, r: 6 }, // |r| > 5
      { q: 3, r: 3 }, // |q+r| = 6 > 5
    ];

    outOfBoundsPositions.forEach((position) => {
      const result = useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", position);

      expect(result).toBe(false);
    });

    expect(useGameStore.getState().gameState.characters).toHaveLength(0);
  });

  it("addCharacterAtPosition should update initialCharacters for reset support", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 2, r: 3 });

    const charId = useGameStore.getState().gameState.characters[0]!.id;

    // Modify HP
    useGameStore.getState().actions.updateCharacter(charId, { hp: 50 });
    expect(useGameStore.getState().gameState.characters[0]?.hp).toBe(50);

    // Reset should restore to 100
    useGameStore.getState().actions.reset();
    const restoredChar = useGameStore.getState().gameState.characters[0];
    expect(restoredChar?.hp).toBe(100);
    expect(restoredChar?.position).toEqual({ q: 2, r: 3 });
  });

  it("addCharacterAtPosition should assign correct slotPosition", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 0, r: 0 });
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("enemy", { q: 1, r: 1 });
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 2, r: 2 });

    const characters = useGameStore.getState().gameState.characters;
    expect(characters[0]?.slotPosition).toBe(1);
    expect(characters[1]?.slotPosition).toBe(2);
    expect(characters[2]?.slotPosition).toBe(3);
  });

  it("addCharacterAtPosition should create character with only innate skills", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 2, r: 2 });

    const character = useGameStore.getState().gameState.characters[0];
    // Characters now start with only innate skills
    expect(character?.skills).toHaveLength(1);

    const skill = character?.skills[0];
    expect(skill?.id).toBe("move-towards");
    expect(skill).toHaveProperty("id");
    expect(skill).toHaveProperty("name");
    expect(skill).toHaveProperty("tickCost");
    expect(skill).toHaveProperty("range");
    expect(skill).toHaveProperty("enabled");
    expect(skill).toHaveProperty("trigger");
  });

  it("addCharacterAtPosition should create character with 100 HP", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 3, r: 1 });

    const character = useGameStore.getState().gameState.characters[0];
    expect(character?.hp).toBe(100);
    expect(character?.maxHp).toBe(100);
  });
});

describe("moveCharacter", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.initBattle([]);
  });

  it("moveCharacter should relocate character to new position", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 2, r: 3 });
    const charId = useGameStore.getState().gameState.characters[0]!.id;

    const result = useGameStore
      .getState()
      .actions.moveCharacter(charId, { q: 3, r: 2 });

    expect(result).toBe(true);

    const character = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === charId);
    expect(character?.position).toEqual({ q: 3, r: 2 });
  });

  it("moveCharacter should return false if target position is occupied", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 2, r: 3 });
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("enemy", { q: 2, r: 2 });

    const charId = useGameStore.getState().gameState.characters[0]!.id;

    // Try to move to occupied position
    const result = useGameStore
      .getState()
      .actions.moveCharacter(charId, { q: 2, r: 2 });

    expect(result).toBe(false);

    const character = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === charId);
    expect(character?.position).toEqual({ q: 2, r: 3 }); // Should not have moved
  });

  it("moveCharacter should return false if character not found", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 2, r: 3 });

    const result = useGameStore
      .getState()
      .actions.moveCharacter("non-existent-id", { q: 2, r: 2 });

    expect(result).toBe(false);
  });

  it("moveCharacter should return false if position is out of bounds", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 2, r: 3 });
    const charId = useGameStore.getState().gameState.characters[0]!.id;

    const outOfBoundsPositions = [
      { q: -6, r: 0 }, // |q| = 6 > 5
      { q: 0, r: -6 }, // |r| = 6 > 5
      { q: 6, r: 0 }, // |q| = 6 > 5
      { q: 0, r: 6 }, // |r| = 6 > 5
    ];

    outOfBoundsPositions.forEach((position) => {
      const result = useGameStore
        .getState()
        .actions.moveCharacter(charId, position);

      expect(result).toBe(false);
    });

    const character = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === charId);
    expect(character?.position).toEqual({ q: 2, r: 3 }); // Should not have moved
  });

  it("moveCharacter should update both gameState and initialCharacters", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 2, r: 3 });
    const charId = useGameStore.getState().gameState.characters[0]!.id;

    useGameStore.getState().actions.moveCharacter(charId, { q: 3, r: 2 });

    // Reset should restore to new moved position
    useGameStore.getState().actions.reset();

    const character = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === charId);
    expect(character?.position).toEqual({ q: 3, r: 2 });
  });

  it("moveCharacter should preserve all other character properties", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 2, r: 3 });
    const charId = useGameStore.getState().gameState.characters[0]!.id;
    const originalChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === charId)!;

    useGameStore.getState().actions.moveCharacter(charId, { q: 3, r: 2 });

    const movedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === charId)!;

    expect(movedChar.id).toBe(originalChar.id);
    expect(movedChar.name).toBe(originalChar.name);
    expect(movedChar.faction).toBe(originalChar.faction);
    expect(movedChar.hp).toBe(originalChar.hp);
    expect(movedChar.maxHp).toBe(originalChar.maxHp);
    expect(movedChar.slotPosition).toBe(originalChar.slotPosition);
    expect(movedChar.skills).toEqual(originalChar.skills);
    expect(movedChar.currentAction).toBe(originalChar.currentAction);
  });
});

describe("selectClickableCells", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.initBattle([]);
  });

  it("selectClickableCells should return empty Set in idle mode", () => {
    useGameStore.getState().actions.setSelectionMode("idle");

    const clickableCells = selectClickableCells(useGameStore.getState());

    expect(clickableCells).toBeInstanceOf(Set);
    expect(clickableCells.size).toBe(0);
  });

  it("selectClickableCells should return all empty cells in placing-friendly mode", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 2, r: 2 });
    useGameStore.getState().actions.setSelectionMode("placing-friendly");

    const clickableCells = selectClickableCells(useGameStore.getState());

    // Should have 90 empty cells (91 - 1 occupied)
    expect(clickableCells.size).toBe(90);
    expect(clickableCells.has("2,2")).toBe(false); // Occupied cell not clickable
    expect(clickableCells.has("0,0")).toBe(true); // Empty cell clickable
    expect(clickableCells.has("5,-5")).toBe(true); // Empty cell clickable at edge
  });

  it("selectClickableCells should return all empty cells in moving mode", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 3, r: 1 });
    useGameStore.getState().actions.setSelectionMode("moving");

    const clickableCells = selectClickableCells(useGameStore.getState());

    // Should have 90 empty cells
    expect(clickableCells.size).toBe(90);
    expect(clickableCells.has("3,1")).toBe(false); // Occupied cell not clickable
    expect(clickableCells.has("2,2")).toBe(true); // Empty cell clickable
  });

  it("selectClickableCells should exclude occupied positions", () => {
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 0, r: 0 });
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("enemy", { q: 2, r: 2 });
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 4, r: 1 });

    useGameStore.getState().actions.setSelectionMode("placing-friendly");

    const clickableCells = selectClickableCells(useGameStore.getState());

    // Should have 88 empty cells (91 - 3 occupied)
    expect(clickableCells.size).toBe(88);
    expect(clickableCells.has("0,0")).toBe(false);
    expect(clickableCells.has("2,2")).toBe(false);
    expect(clickableCells.has("4,1")).toBe(false);
    expect(clickableCells.has("1,1")).toBe(true); // Empty cell clickable
  });
});
