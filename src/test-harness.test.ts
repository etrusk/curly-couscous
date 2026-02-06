/**
 * Tests for window.__TEST_HARNESS__ API.
 * Verifies the test harness installs correctly and exposes accurate,
 * read-only state from the Zustand store.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { installTestHarness } from "./test-harness";
import { useGameStore } from "./stores/gameStore";
import type { Character } from "./engine/types";

describe("Test Harness API", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
    installTestHarness();
  });

  afterEach(() => {
    delete window.__TEST_HARNESS__;
  });

  it("installTestHarness attaches API to window", () => {
    // installTestHarness was called in beforeEach -- verify it attached
    expect(window.__TEST_HARNESS__).toBeDefined();
    expect(typeof window.__TEST_HARNESS__!.getState).toBe("function");
    expect(typeof window.__TEST_HARNESS__!.getCharacters).toBe("function");
    expect(typeof window.__TEST_HARNESS__!.getTick).toBe("function");
    expect(typeof window.__TEST_HARNESS__!.getBattleStatus).toBe("function");
    expect(typeof window.__TEST_HARNESS__!.getSelectedCharacterId).toBe(
      "function",
    );

    // Exactly 5 methods -- no extra mutation methods leaked
    const keys = Object.keys(window.__TEST_HARNESS__!);
    expect(keys).toHaveLength(5);
  });

  it("getState returns current game state with expected shape", () => {
    const actions = useGameStore.getState().actions;
    actions.initBattle([]);

    const state = window.__TEST_HARNESS__!.getState();

    expect(state).toBeDefined();
    expect(state).not.toBeNull();
    expect(Array.isArray(state.characters)).toBe(true);
    expect(typeof state.tick).toBe("number");
    expect(typeof state.phase).toBe("string");
    expect(["decision", "resolution"]).toContain(state.phase);
    expect(typeof state.battleStatus).toBe("string");
    expect(Array.isArray(state.history)).toBe(true);
    expect(typeof state.seed).toBe("number");
    expect(typeof state.rngState).toBe("number");
  });

  it("getCharacters returns character array", () => {
    const actions = useGameStore.getState().actions;
    actions.initBattle([]);
    actions.addCharacter("friendly");
    actions.addCharacter("enemy");

    const characters = window.__TEST_HARNESS__!.getCharacters();

    expect(characters).toHaveLength(2);
    expect(characters.some((c) => c.faction === "friendly")).toBe(true);
    expect(characters.some((c) => c.faction === "enemy")).toBe(true);

    // Each character has expected properties
    for (const char of characters) {
      expect(char).toHaveProperty("id");
      expect(char).toHaveProperty("name");
      expect(char).toHaveProperty("hp");
      expect(char).toHaveProperty("maxHp");
      expect(char).toHaveProperty("position");
      expect(char).toHaveProperty("skills");
    }
  });

  it("getCharacters returns empty array when no characters exist", () => {
    const actions = useGameStore.getState().actions;
    actions.initBattle([]);

    const characters = window.__TEST_HARNESS__!.getCharacters();

    expect(Array.isArray(characters)).toBe(true);
    expect(characters).toHaveLength(0);
  });

  it("getTick returns current tick number", () => {
    // Create an active battle with two factions so processTick advances
    const friendly: Character = {
      id: "friendly-1",
      name: "Friendly",
      faction: "friendly",
      slotPosition: 1,
      hp: 100,
      maxHp: 100,
      position: { q: 0, r: 0 },
      skills: [],
      currentAction: null,
    };
    const enemy: Character = {
      id: "enemy-1",
      name: "Enemy",
      faction: "enemy",
      slotPosition: 2,
      hp: 100,
      maxHp: 100,
      position: { q: -5, r: 5 },
      skills: [],
      currentAction: null,
    };

    const actions = useGameStore.getState().actions;
    actions.initBattle([friendly, enemy]);

    expect(window.__TEST_HARNESS__!.getTick()).toBe(0);

    actions.processTick();

    expect(window.__TEST_HARNESS__!.getTick()).toBe(1);
  });

  it("getBattleStatus returns battle status string", () => {
    const actions = useGameStore.getState().actions;

    // Active battle: both factions alive
    const friendly: Character = {
      id: "friendly-1",
      name: "Friendly",
      faction: "friendly",
      slotPosition: 1,
      hp: 100,
      maxHp: 100,
      position: { q: 0, r: 0 },
      skills: [],
      currentAction: null,
    };
    const enemy: Character = {
      id: "enemy-1",
      name: "Enemy",
      faction: "enemy",
      slotPosition: 2,
      hp: 100,
      maxHp: 100,
      position: { q: -5, r: 5 },
      skills: [],
      currentAction: null,
    };

    actions.initBattle([friendly, enemy]);
    expect(window.__TEST_HARNESS__!.getBattleStatus()).toBe("active");

    // Victory: enemy hp=0, process tick to trigger status update
    const friendlyForVictory: Character = {
      id: "friendly-v",
      name: "Friendly",
      faction: "friendly",
      slotPosition: 1,
      hp: 100,
      maxHp: 100,
      position: { q: 0, r: 0 },
      skills: [],
      currentAction: null,
    };
    const deadEnemy: Character = {
      id: "enemy-v",
      name: "Enemy",
      faction: "enemy",
      slotPosition: 2,
      hp: 0,
      maxHp: 100,
      position: { q: -5, r: 5 },
      skills: [],
      currentAction: null,
    };

    actions.initBattle([friendlyForVictory, deadEnemy]);
    actions.processTick();
    expect(window.__TEST_HARNESS__!.getBattleStatus()).toBe("victory");
  });

  it("getSelectedCharacterId returns null when nothing selected, id after selection", () => {
    const actions = useGameStore.getState().actions;
    actions.initBattle([]);
    actions.addCharacter("friendly");

    const charId = useGameStore.getState().gameState.characters[0]!.id;

    // Before selection
    expect(window.__TEST_HARNESS__!.getSelectedCharacterId()).toBeNull();

    // After selection
    actions.selectCharacter(charId);
    expect(window.__TEST_HARNESS__!.getSelectedCharacterId()).toBe(charId);

    // After deselection
    actions.selectCharacter(null);
    expect(window.__TEST_HARNESS__!.getSelectedCharacterId()).toBeNull();
  });

  it("state updates reflect immediately in subsequent calls", () => {
    const actions = useGameStore.getState().actions;
    actions.initBattle([]);
    actions.addCharacter("friendly");
    actions.addCharacter("enemy");

    // Capture initial state snapshot
    const initialSnapshot = window.__TEST_HARNESS__!.getState();
    expect(window.__TEST_HARNESS__!.getTick()).toBe(0);

    // Advance tick
    actions.processTick();
    expect(window.__TEST_HARNESS__!.getTick()).toBe(1);

    // Add another character
    actions.addCharacter("friendly");
    expect(window.__TEST_HARNESS__!.getCharacters().length).toBe(3);

    // The initial snapshot should still show tick 0 (point-in-time snapshot)
    expect(initialSnapshot.tick).toBe(0);
  });

  it("API exposes only read-only methods (no mutation methods)", () => {
    const harness = window.__TEST_HARNESS__!;

    // Must not have mutation methods
    expect(harness).not.toHaveProperty("step");
    expect(harness).not.toHaveProperty("reset");
    expect(harness).not.toHaveProperty("addCharacter");
    expect(harness).not.toHaveProperty("actions");

    // Exactly the expected read-only methods
    const keys = Object.keys(harness).sort();
    expect(keys).toEqual(
      [
        "getState",
        "getCharacters",
        "getTick",
        "getBattleStatus",
        "getSelectedCharacterId",
      ].sort(),
    );
  });
});
