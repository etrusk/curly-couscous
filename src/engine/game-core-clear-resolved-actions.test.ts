/**
 * Tests for clearResolvedActions function.
 */

import { describe, it, expect } from "vitest";
import { clearResolvedActions } from "./game-core";
import { createCharacter, createAttackAction } from "./game-test-helpers";

describe("clearResolvedActions", () => {
  it("should clear action when resolvesAtTick equals current tick", () => {
    const character = createCharacter({
      id: "char1",
      position: { x: 5, y: 5 },
      currentAction: createAttackAction({ x: 6, y: 5 }, 10, 3),
    });

    const result = clearResolvedActions([character], 3);

    expect(result[0]!.currentAction).toBeNull();
  });

  it("should preserve action when resolvesAtTick is future tick", () => {
    const action = createAttackAction({ x: 6, y: 5 }, 10, 5);
    const character = createCharacter({
      id: "char1",
      position: { x: 5, y: 5 },
      currentAction: action,
    });

    const result = clearResolvedActions([character], 3);

    expect(result[0]!.currentAction).toEqual(action);
  });

  it("should handle characters with null currentAction", () => {
    const character = createCharacter({
      id: "char1",
      position: { x: 5, y: 5 },
      currentAction: null,
    });

    const result = clearResolvedActions([character], 1);

    expect(result[0]!.currentAction).toBeNull();
  });

  it("should not modify original character array", () => {
    const character = createCharacter({
      id: "char1",
      position: { x: 5, y: 5 },
      currentAction: createAttackAction({ x: 6, y: 5 }, 10, 1),
    });
    const originalCharacters = [character];

    clearResolvedActions(originalCharacters, 1);

    expect(originalCharacters[0]!.currentAction).not.toBeNull();
  });
});
