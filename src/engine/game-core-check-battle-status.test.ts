/**
 * Tests for checkBattleStatus function.
 */

import { describe, it, expect } from "vitest";
import { checkBattleStatus } from "./game-core";
import { createCharacter } from "./game-test-helpers";

describe("checkBattleStatus", () => {
  it("should return victory when only friendlies remain", () => {
    const characters = [
      createCharacter({ id: "friendly1", faction: "friendly" }),
      createCharacter({ id: "friendly2", faction: "friendly" }),
    ];

    expect(checkBattleStatus(characters)).toBe("victory");
  });

  it("should return defeat when only enemies remain", () => {
    const characters = [
      createCharacter({ id: "enemy1", faction: "enemy" }),
      createCharacter({ id: "enemy2", faction: "enemy" }),
    ];

    expect(checkBattleStatus(characters)).toBe("defeat");
  });

  it("should return draw when no characters remain", () => {
    expect(checkBattleStatus([])).toBe("draw");
  });

  it("should return active when both factions present", () => {
    const characters = [
      createCharacter({ id: "friendly1", faction: "friendly" }),
      createCharacter({ id: "enemy1", faction: "enemy" }),
    ];

    expect(checkBattleStatus(characters)).toBe("active");
  });
});
