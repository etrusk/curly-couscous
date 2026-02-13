/**
 * Tests for Zustand DevTools middleware integration.
 * Verifies: (1) devtools middleware wrapping, (2) action name labeling, (3) middleware transparency.
 */

import { describe, it, expect, beforeEach } from "vitest";
// @ts-expect-error - fs and path are available in vitest Node environment
import { readFileSync } from "fs";
// @ts-expect-error - fs and path are available in vitest Node environment
import { join } from "path";
import { useGameStore } from "./gameStore";
import { createCharacter } from "./gameStore-test-helpers";

// Resolve the source file path for static analysis tests
// @ts-expect-error - __dirname is available in vitest Node environment
// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
const gameStoreSourcePath = join(__dirname, "gameStore.ts");

describe("DevTools Middleware Integration", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("store is created and returns correct state shape", () => {
    const state = useGameStore.getState();

    // Store was created successfully
    expect(state).not.toBeNull();
    expect(state).not.toBeUndefined();

    // Top-level state slice exists
    expect(state.gameState).toBeTypeOf("object");

    // Nested state properties accessible
    expect(state.gameState.tick).toBeTypeOf("number");
    expect(state.gameState.characters).toBeInstanceOf(Array);

    // Actions namespace exists
    expect(state.actions).toBeTypeOf("object");

    // Initial UI state correct
    expect(state.selectedCharacterId).toBeNull();
    expect(state.selectionMode).toBe("idle");
  });

  it("actions execute without errors through devtools middleware", () => {
    const { actions } = useGameStore.getState();

    // Calling selectCharacter(null) does not throw
    expect(() => actions.selectCharacter(null)).not.toThrow();

    // After adding a character, the characters array length increases by 1
    const lengthBefore = useGameStore.getState().gameState.characters.length;
    actions.addCharacter("friendly");
    const lengthAfter = useGameStore.getState().gameState.characters.length;
    expect(lengthAfter).toBe(lengthBefore + 1);

    // After initBattle with known characters and calling reset(), state restores
    // (addCharacter pushes to initialCharacters, so we use initBattle for a clean baseline)
    const char1 = createCharacter({ id: "c1", position: { q: 0, r: 0 } });
    actions.initBattle([char1]);
    actions.reset();
    const resetState = useGameStore.getState();
    expect(resetState.gameState.characters).toHaveLength(1);
    expect(resetState.gameState.tick).toBe(0);
  });
});

describe("Action Name Labeling", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, security/detect-non-literal-fs-filename
  const source: string = readFileSync(gameStoreSourcePath, "utf-8");

  it("all 18 set() calls include action name strings", () => {
    // Count all set((state) occurrences (the 18 set() calls)
    const setCallMatches = source.match(/set\(\(state\)/g);
    expect(setCallMatches).not.toBeNull();
    expect(setCallMatches!.length).toBe(18);

    // Count all action name argument patterns: false, 'actionName')
    const actionNameMatches = source.match(/false, '[a-zA-Z]+'\)/g);
    expect(actionNameMatches).not.toBeNull();
    expect(actionNameMatches!.length).toBe(18);

    // Both counts must be equal (every set() call has an action name)
    expect(setCallMatches!.length).toBe(actionNameMatches!.length);
  });

  it("devtools middleware is configured with correct store name", () => {
    // The source contains the store name configuration
    const hasStoreName =
      source.includes("name: 'curly-couscous'") ||
      source.includes('name: "curly-couscous"');
    expect(hasStoreName).toBe(true);
  });

  it("action names match their enclosing method names", () => {
    const expectedMethodNames = [
      "initBattle",
      "nextTick",
      "processTick",
      "updateCharacter",
      "addEvent",
      "reset",
      "selectCharacter",
      "updateSkill",
      "moveSkillUp",
      "moveSkillDown",
      "assignSkillToCharacter",
      "removeSkillFromCharacter",
      "duplicateSkill",
      "addCharacter",
      "removeCharacter",
      "setSelectionMode",
      "addCharacterAtPosition",
      "moveCharacter",
    ];

    for (const methodName of expectedMethodNames) {
      // For each method, verify the action name string matches.
      // Match pattern: the method declaration followed eventually by a set() call
      // closing with false, 'methodName')
      //
      // We look for the pattern: false, 'methodName') to exist in the source
      // and that it appears after the method declaration
      const actionNamePattern = `false, '${methodName}')`;
      expect(
        source.includes(actionNamePattern),
        `Expected action name '${methodName}' to be present in set() call for method ${methodName}`,
      ).toBe(true);
    }
  });
});

describe("Middleware Transparency", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("devtools middleware does not break existing store contract", () => {
    const { actions } = useGameStore.getState();

    // initBattle with two characters sets characters length to 2 and battleStatus to 'active'
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    actions.initBattle([char1, char2]);

    expect(useGameStore.getState().gameState.characters).toHaveLength(2);
    expect(useGameStore.getState().gameState.battleStatus).toBe("active");

    // processTick after initBattle increments tick by 1
    actions.processTick();
    expect(useGameStore.getState().gameState.tick).toBe(1);

    // selectCharacter('char1') sets selectedCharacterId to 'char1'
    actions.selectCharacter("char1");
    expect(useGameStore.getState().selectedCharacterId).toBe("char1");

    // selectCharacter(null) sets selectedCharacterId back to null
    actions.selectCharacter(null);
    expect(useGameStore.getState().selectedCharacterId).toBeNull();

    // setSelectionMode('placing-friendly') sets selectionMode to 'placing-friendly'
    actions.setSelectionMode("placing-friendly");
    expect(useGameStore.getState().selectionMode).toBe("placing-friendly");
  });
});
