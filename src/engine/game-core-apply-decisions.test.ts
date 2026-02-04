/**
 * Tests for applyDecisions function.
 */

import { describe, it, expect } from "vitest";
import { applyDecisions } from "./game-core";
import { createCharacter, createAttackAction } from "./game-test-helpers";

describe("applyDecisions", () => {
  it("should set currentAction from decision", () => {
    const character = createCharacter({
      id: "char1",
      position: { q: 3, r: 2 },
      currentAction: null,
    });
    const action = createAttackAction({ q: 3, r: -1 }, 10, 1);
    const decisions = [{ characterId: "char1", action }];

    const result = applyDecisions([character], decisions);

    expect(result[0]!.currentAction).toEqual(action);
  });

  it("should preserve characters without decisions", () => {
    const char1 = createCharacter({ id: "char1", position: { q: 3, r: 2 } });
    const char2 = createCharacter({ id: "char2", position: { q: 4, r: 2 } });
    const action = createAttackAction({ q: 3, r: 2 }, 10, 1);
    const decisions = [{ characterId: "char1", action }];

    const result = applyDecisions([char1, char2], decisions);

    expect(result[1]!.currentAction).toBeNull();
    expect(result[1]!.id).toBe("char2");
  });

  it("should handle empty decisions array", () => {
    const character = createCharacter({
      id: "char1",
      position: { q: 3, r: 2 },
    });

    const result = applyDecisions([character], []);

    expect(result).toHaveLength(1);
    expect(result[0]!.currentAction).toBeNull();
  });

  it("should handle empty characters array", () => {
    const action = createAttackAction({ q: 3, r: -1 }, 10, 1);
    const decisions = [{ characterId: "char1", action }];

    const result = applyDecisions([], decisions);

    expect(result).toHaveLength(0);
  });

  it("should not modify original character array", () => {
    const character = createCharacter({
      id: "char1",
      position: { q: 3, r: 2 },
      currentAction: null,
    });
    const originalCharacters = [character];
    const action = createAttackAction({ q: 3, r: -1 }, 10, 1);
    const decisions = [{ characterId: "char1", action }];

    applyDecisions(originalCharacters, decisions);

    expect(originalCharacters[0]!.currentAction).toBeNull();
  });

  it("should skip decisions for non-existent character IDs", () => {
    const character = createCharacter({
      id: "char1",
      position: { q: 3, r: 2 },
    });
    const action1 = createAttackAction({ q: 3, r: -1 }, 10, 1);
    const action2 = createAttackAction({ q: 3, r: 2 }, 15, 1);
    const decisions = [
      { characterId: "nonexistent", action: action1 },
      { characterId: "char1", action: action2 },
    ];

    const result = applyDecisions([character], decisions);

    expect(result).toHaveLength(1);
    expect(result[0]!.currentAction).toEqual(action2);
  });
});
