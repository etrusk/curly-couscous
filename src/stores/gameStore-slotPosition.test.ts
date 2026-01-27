/**
 * Tests for slotPosition assignment (1-based indexing).
 * Verifies that slotPosition starts at 1 and is correctly assigned across all character creation methods.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";
import { createCharacter } from "./gameStore-test-helpers";
import { slotPositionToLetter } from "../utils/letterMapping";

describe("slotPosition 1-based assignment", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  // Test: first-character-gets-slotPosition-1
  it("should assign slotPosition 1 to first character added via addCharacter", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");

    const characters = useGameStore.getState().gameState.characters;
    expect(characters[0]?.slotPosition).toBe(1);
  });

  // Test: initBattle-assigns-1-based-slotPositions
  it("should assign 1-based slotPositions when initializing battle with multiple characters", () => {
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { x: 5, y: 5 },
    });
    const char3 = createCharacter({
      id: "char3",
      faction: "friendly",
      position: { x: 10, y: 10 },
    });

    useGameStore.getState().actions.initBattle([char1, char2, char3]);

    const characters = useGameStore.getState().gameState.characters;
    expect(characters[0]?.slotPosition).toBe(1);
    expect(characters[1]?.slotPosition).toBe(2);
    expect(characters[2]?.slotPosition).toBe(3);
  });

  // Test: addCharacterAtPosition-assigns-1-based-slotPosition
  it("should assign 1-based slotPositions when adding characters at specific positions", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { x: 0, y: 0 });
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("enemy", { x: 5, y: 5 });
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { x: 10, y: 10 });

    const characters = useGameStore.getState().gameState.characters;
    expect(characters[0]?.slotPosition).toBe(1);
    expect(characters[1]?.slotPosition).toBe(2);
    expect(characters[2]?.slotPosition).toBe(3);
  });
});

// ============================================================================
// slotPosition to Letter Integration Tests
// ============================================================================

describe("slotPosition to letterMapping integration", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  // Test: slotPosition-to-letter-integration-no-throw
  it("should not throw when calling slotPositionToLetter with addCharacter slotPosition", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");

    const character = useGameStore.getState().gameState.characters[0];
    expect(() => slotPositionToLetter(character!.slotPosition)).not.toThrow();
    expect(slotPositionToLetter(character!.slotPosition)).toBe("A");
  });

  // Test: sequential-slotPositions-map-to-sequential-letters
  it("should map sequential slotPositions to sequential letters A, B, C", () => {
    useGameStore.getState().actions.initBattle([]);

    useGameStore.getState().actions.addCharacter("friendly");
    useGameStore.getState().actions.addCharacter("friendly");
    useGameStore.getState().actions.addCharacter("friendly");

    const characters = useGameStore.getState().gameState.characters;
    expect(slotPositionToLetter(characters[0]!.slotPosition)).toBe("A");
    expect(slotPositionToLetter(characters[1]!.slotPosition)).toBe("B");
    expect(slotPositionToLetter(characters[2]!.slotPosition)).toBe("C");
  });
});
