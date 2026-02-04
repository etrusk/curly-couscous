/**
 * Tests for character add/remove functionality (pre-battle editor).
 * Extracted from gameStore.test.ts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectIsGridFull } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";

describe("addCharacter", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should add a friendly character to empty battle", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");

    const characters = useGameStore.getState().gameState.characters;
    expect(characters).toHaveLength(1);
    expect(characters[0]?.faction).toBe("friendly");
  });

  it("should add an enemy character to empty battle", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("enemy");

    const characters = useGameStore.getState().gameState.characters;
    expect(characters).toHaveLength(1);
    expect(characters[0]?.faction).toBe("enemy");
  });

  it("should assign unique IDs across multiple adds", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");
    useGameStore.getState().actions.addCharacter("friendly");
    useGameStore.getState().actions.addCharacter("enemy");
    useGameStore.getState().actions.addCharacter("enemy");
    useGameStore.getState().actions.addCharacter("friendly");

    const characters = useGameStore.getState().gameState.characters;
    const ids = characters.map((c) => c.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(5);
    expect(ids).toHaveLength(5);
  });

  it("should not collide with existing character IDs from initBattle", () => {
    const char1 = createCharacter({ id: "char-1" });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.addCharacter("friendly");

    const characters = useGameStore.getState().gameState.characters;
    const ids = characters.map((c) => c.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(2);
    expect(ids.includes("char-1")).toBe(true);
  });

  it("should assign valid position within hex grid (radius 5)", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");

    const character = useGameStore.getState().gameState.characters[0];
    const { q, r } = character!.position;

    // Valid hex coordinates satisfy: max(|q|, |r|, |q+r|) <= 5
    expect(Math.abs(q)).toBeLessThanOrEqual(5);
    expect(Math.abs(r)).toBeLessThanOrEqual(5);
    expect(Math.abs(q + r)).toBeLessThanOrEqual(5);
  });

  it("should not place character on occupied cell", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");
    useGameStore.getState().actions.addCharacter("enemy");

    const characters = useGameStore.getState().gameState.characters;
    const pos1 = characters[0]!.position;
    const pos2 = characters[1]!.position;

    const samePosition = pos1.q === pos2.q && pos1.r === pos2.r;
    expect(samePosition).toBe(false);
  });

  it("should assign only innate skills (Move)", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");

    const character = useGameStore.getState().gameState.characters[0];
    // Characters now start with only innate skills
    expect(character?.skills).toHaveLength(1);

    const skill = character?.skills[0];
    expect(skill?.id).toBe("move-towards");
    expect(skill?.name).toBe("Move Towards");
    expect(skill).toHaveProperty("tickCost");
    expect(skill).toHaveProperty("range");
    expect(skill).toHaveProperty("enabled");
    expect(skill).toHaveProperty("triggers");
  });

  it("should set HP and maxHP to 100", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");

    const character = useGameStore.getState().gameState.characters[0];
    expect(character?.hp).toBe(100);
    expect(character?.maxHp).toBe(100);
  });

  it("should set currentAction to null", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");

    const character = useGameStore.getState().gameState.characters[0];
    expect(character?.currentAction).toBeNull();
  });

  it("should assign sequential slotPosition based on add order", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");
    useGameStore.getState().actions.addCharacter("enemy");
    useGameStore.getState().actions.addCharacter("friendly");

    const characters = useGameStore.getState().gameState.characters;
    expect(characters[0]?.slotPosition).toBe(1);
    expect(characters[1]?.slotPosition).toBe(2);
    expect(characters[2]?.slotPosition).toBe(3);
  });

  it("should recalculate battleStatus to active when opposing factions exist", () => {
    useGameStore.getState().actions.initBattle([]);
    expect(useGameStore.getState().gameState.battleStatus).toBe("draw");

    useGameStore.getState().actions.addCharacter("friendly");
    expect(useGameStore.getState().gameState.battleStatus).toBe("draw");

    useGameStore.getState().actions.addCharacter("enemy");
    expect(useGameStore.getState().gameState.battleStatus).toBe("active");
  });

  it("should update initialCharacters so reset includes added character", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");
    const addedId = useGameStore.getState().gameState.characters[0]!.id;

    // Modify HP
    useGameStore.getState().actions.updateCharacter(addedId, { hp: 50 });
    expect(useGameStore.getState().gameState.characters[0]?.hp).toBe(50);

    // Reset should restore to 100
    useGameStore.getState().actions.reset();
    const restoredChar = useGameStore.getState().gameState.characters[0];
    expect(restoredChar?.hp).toBe(100);
  });

  it("should return true when character added successfully", () => {
    useGameStore.getState().actions.initBattle([]);

    const result = useGameStore.getState().actions.addCharacter("friendly");

    expect(result).toBe(true);
  });

  it("should return false when grid is completely full (91 hexes)", () => {
    useGameStore.getState().actions.initBattle([]);

    // Fill the hex grid with 91 characters (radius 5)
    for (let i = 0; i < 91; i++) {
      useGameStore
        .getState()
        .actions.addCharacter(i % 2 === 0 ? "friendly" : "enemy");
    }

    const result = useGameStore.getState().actions.addCharacter("friendly");

    expect(result).toBe(false);
  });

  it("should not add character when grid is full", () => {
    useGameStore.getState().actions.initBattle([]);

    // Fill the hex grid with 91 characters
    for (let i = 0; i < 91; i++) {
      useGameStore
        .getState()
        .actions.addCharacter(i % 2 === 0 ? "friendly" : "enemy");
    }

    const beforeCount = useGameStore.getState().gameState.characters.length;
    useGameStore.getState().actions.addCharacter("friendly");
    const afterCount = useGameStore.getState().gameState.characters.length;

    expect(afterCount).toBe(beforeCount);
    expect(afterCount).toBe(91);
  });
});

describe("removeCharacter", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should remove character by ID", () => {
    useGameStore.getState().actions.initBattle([]);
    useGameStore.getState().actions.addCharacter("friendly");
    const charId = useGameStore.getState().gameState.characters[0]!.id;

    useGameStore.getState().actions.removeCharacter(charId);

    const characters = useGameStore.getState().gameState.characters;
    expect(characters).toHaveLength(0);
  });

  it("should clear selectedCharacterId if removed character was selected", () => {
    useGameStore.getState().actions.initBattle([]);
    useGameStore.getState().actions.addCharacter("friendly");
    const charId = useGameStore.getState().gameState.characters[0]!.id;

    useGameStore.getState().actions.selectCharacter(charId);
    expect(useGameStore.getState().selectedCharacterId).toBe(charId);

    useGameStore.getState().actions.removeCharacter(charId);
    expect(useGameStore.getState().selectedCharacterId).toBeNull();
  });

  it("should not affect other characters when removing one", () => {
    useGameStore.getState().actions.initBattle([]);
    useGameStore.getState().actions.addCharacter("friendly");
    useGameStore.getState().actions.addCharacter("enemy");
    useGameStore.getState().actions.addCharacter("friendly");

    const char1 = useGameStore.getState().gameState.characters[0]!;
    const char2 = useGameStore.getState().gameState.characters[1]!;
    const char3 = useGameStore.getState().gameState.characters[2]!;

    useGameStore.getState().actions.removeCharacter(char2.id);

    const remaining = useGameStore.getState().gameState.characters;
    expect(remaining).toHaveLength(2);
    expect(remaining.find((c) => c.id === char1.id)).toBeDefined();
    expect(remaining.find((c) => c.id === char3.id)).toBeDefined();
  });

  it("should handle removing non-existent ID gracefully (no error)", () => {
    useGameStore.getState().actions.initBattle([]);
    useGameStore.getState().actions.addCharacter("friendly");

    expect(() => {
      useGameStore.getState().actions.removeCharacter("non-existent-id");
    }).not.toThrow();
  });

  it("should recalculate battleStatus to victory when last enemy removed", () => {
    useGameStore.getState().actions.initBattle([]);
    useGameStore.getState().actions.addCharacter("friendly");
    useGameStore.getState().actions.addCharacter("enemy");

    expect(useGameStore.getState().gameState.battleStatus).toBe("active");

    const enemyId = useGameStore
      .getState()
      .gameState.characters.find((c) => c.faction === "enemy")!.id;

    useGameStore.getState().actions.removeCharacter(enemyId);
    expect(useGameStore.getState().gameState.battleStatus).toBe("victory");
  });

  it("should recalculate battleStatus to defeat when last friendly removed", () => {
    useGameStore.getState().actions.initBattle([]);
    useGameStore.getState().actions.addCharacter("friendly");
    useGameStore.getState().actions.addCharacter("enemy");

    expect(useGameStore.getState().gameState.battleStatus).toBe("active");

    const friendlyId = useGameStore
      .getState()
      .gameState.characters.find((c) => c.faction === "friendly")!.id;

    useGameStore.getState().actions.removeCharacter(friendlyId);
    expect(useGameStore.getState().gameState.battleStatus).toBe("defeat");
  });

  it("should recalculate battleStatus to draw when all characters removed", () => {
    useGameStore.getState().actions.initBattle([]);
    useGameStore.getState().actions.addCharacter("friendly");
    useGameStore.getState().actions.addCharacter("enemy");

    const chars = useGameStore.getState().gameState.characters;
    useGameStore.getState().actions.removeCharacter(chars[0]!.id);
    useGameStore.getState().actions.removeCharacter(chars[1]!.id);

    expect(useGameStore.getState().gameState.battleStatus).toBe("draw");
  });

  it("should update initialCharacters so reset excludes removed character", () => {
    useGameStore.getState().actions.initBattle([]);
    useGameStore.getState().actions.addCharacter("friendly");
    useGameStore.getState().actions.addCharacter("enemy");

    const charToRemove = useGameStore.getState().gameState.characters[0]!.id;
    useGameStore.getState().actions.removeCharacter(charToRemove);

    useGameStore.getState().actions.reset();

    const characters = useGameStore.getState().gameState.characters;
    expect(characters).toHaveLength(1);
    expect(characters.find((c) => c.id === charToRemove)).toBeUndefined();
  });

  it("should handle removing character with active currentAction", () => {
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [createSkill({ id: "skill1", damage: 10, range: 1 })],
      currentAction: {
        type: "attack",
        skill: createSkill({ id: "skill1" }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    });

    useGameStore.getState().actions.initBattle([char1]);

    expect(() => {
      useGameStore.getState().actions.removeCharacter("char1");
    }).not.toThrow();

    expect(useGameStore.getState().gameState.characters).toHaveLength(0);
  });
});

describe("selectIsGridFull", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should return false when grid has space", () => {
    const char1 = createCharacter({ id: "char1" });
    const char2 = createCharacter({ id: "char2" });
    const char3 = createCharacter({ id: "char3" });
    useGameStore.getState().actions.initBattle([char1, char2, char3]);

    const isFull = useGameStore.getState().selectIsGridFull?.() ?? false;

    expect(isFull).toBe(false);
  });

  it("should return true when grid has 91 hexes filled", () => {
    useGameStore.getState().actions.initBattle([]);

    // Fill the hex grid with 91 characters
    for (let i = 0; i < 91; i++) {
      useGameStore
        .getState()
        .actions.addCharacter(i % 2 === 0 ? "friendly" : "enemy");
    }

    const isFull = useGameStore.getState().selectIsGridFull?.() ?? false;

    expect(isFull).toBe(true);
  });

  it("should match exported selector selectIsGridFull", () => {
    const char1 = createCharacter({ id: "char1" });
    const char2 = createCharacter({ id: "char2" });
    useGameStore.getState().actions.initBattle([char1, char2]);

    const store = useGameStore.getState();
    const internalResult = store.selectIsGridFull?.() ?? false;
    const exportedResult = selectIsGridFull(store);

    expect(internalResult).toBe(false);
    expect(exportedResult).toBe(false);
    expect(internalResult).toBe(exportedResult);

    // Fill grid
    for (let i = 0; i < 142; i++) {
      useGameStore
        .getState()
        .actions.addCharacter(i % 2 === 0 ? "friendly" : "enemy");
    }

    const storeFull = useGameStore.getState();
    const internalFull = storeFull.selectIsGridFull?.() ?? false;
    const exportedFull = selectIsGridFull(storeFull);

    expect(internalFull).toBe(true);
    expect(exportedFull).toBe(true);
    expect(internalFull).toBe(exportedFull);
  });
});
