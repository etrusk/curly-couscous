/**
 * Tests for battle status detection functionality of processTick.
 */

import { describe, it, expect } from "vitest";
import { processTick } from "./game-core";
import {
  createGameState,
  createCharacter,
  createAttackAction,
} from "./game-test-helpers";

describe("processTick - battle status detection", () => {
  it("should detect victory when all enemies eliminated", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      currentAction: createAttackAction({ x: 1, y: 0 }, 100, 1),
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 0 },
      hp: 50,
      slotPosition: 1,
    });

    const state = createGameState({
      tick: 1,
      characters: [friendly, enemy],
    });

    const result = processTick(state);

    expect(result.state.battleStatus).toBe("victory");
  });

  it("should detect defeat when all friendlies eliminated", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      hp: 50,
      slotPosition: 0,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ x: 0, y: 0 }, 100, 1),
    });

    const state = createGameState({
      tick: 1,
      characters: [friendly, enemy],
    });

    const result = processTick(state);

    expect(result.state.battleStatus).toBe("defeat");
  });

  it("should detect draw when mutual elimination occurs", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      hp: 10,
      slotPosition: 0,
      currentAction: createAttackAction({ x: 1, y: 0 }, 25, 1),
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 0 },
      hp: 10,
      slotPosition: 1,
      currentAction: createAttackAction({ x: 0, y: 0 }, 25, 1),
    });

    const state = createGameState({
      tick: 1,
      characters: [friendly, enemy],
    });

    const result = processTick(state);

    expect(result.state.battleStatus).toBe("draw");
  });

  it("should remain active when both factions have characters", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
      slotPosition: 1,
    });

    const state = createGameState({
      tick: 1,
      characters: [friendly, enemy],
    });

    const result = processTick(state);

    expect(result.state.battleStatus).toBe("active");
  });
});
