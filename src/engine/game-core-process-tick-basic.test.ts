/**
 * Tests for basic tick advancement functionality of processTick.
 */

import { describe, it, expect } from "vitest";
import { processTick } from "./game-core";
import { createGameState, createCharacter } from "./game-test-helpers";

describe("processTick - basic tick advancement", () => {
  it("should increment tick by 1", () => {
    const state = createGameState({
      tick: 5,
      characters: [createCharacter({ id: "char1" })],
    });

    const result = processTick(state);

    expect(result.state.tick).toBe(6);
  });

  it("should generate tick event", () => {
    const state = createGameState({
      tick: 3,
      characters: [createCharacter({ id: "char1" })],
    });

    const result = processTick(state);

    const tickEvent = result.events.find((e) => e.type === "tick");
    expect(tickEvent).toBeDefined();
    expect(tickEvent).toMatchObject({
      type: "tick",
      tick: 3,
      phase: "resolution",
    });
  });

  it("should append events to history", () => {
    const state = createGameState({
      tick: 0,
      characters: [createCharacter({ id: "char1" })],
      history: [],
    });

    const result = processTick(state);

    expect(result.state.history.length).toBeGreaterThan(0);
    expect(result.state.history[0]!.type).toBe("tick");
  });
});
