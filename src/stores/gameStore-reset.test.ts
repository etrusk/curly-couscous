/**
 * Tests for reset functionality and battle status changes.
 * Extracted from gameStore.test.ts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";

describe("Reset Functionality", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should restore initial HP on reset", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 1,
      skills: [createSkill({ id: "attack", damage: 10, range: 1 })],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 1, r: 0 },
      slotPosition: 2,
      hp: 100,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    // With new formula, tickCost=1 action created at tick 0 resolves at tick 1
    useGameStore.getState().actions.processTick();
    useGameStore.getState().actions.processTick();

    // Verify damage was applied
    const damagedTarget = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "target");
    expect(damagedTarget?.hp).toBe(90);

    useGameStore.getState().actions.reset();

    const restoredTarget = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "target");
    expect(restoredTarget?.hp).toBe(100);
  });

  it("should restore tick to 0 on reset", () => {
    const char1 = createCharacter({ id: "char1" });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.processTick();
    useGameStore.getState().actions.processTick();
    expect(useGameStore.getState().gameState.tick).toBeGreaterThan(0);

    useGameStore.getState().actions.reset();

    expect(useGameStore.getState().gameState.tick).toBe(0);
  });

  it("should clear history on reset", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 1,
      skills: [createSkill({ id: "attack", damage: 10, range: 1 })],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 1, r: 0 },
      slotPosition: 2,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    // With new formula, tickCost=1 action created at tick 0 resolves at tick 1
    useGameStore.getState().actions.processTick();
    useGameStore.getState().actions.processTick();

    expect(useGameStore.getState().gameState.history.length).toBeGreaterThan(0);

    useGameStore.getState().actions.reset();

    expect(useGameStore.getState().gameState.history).toEqual([]);
  });

  it("should restore battleStatus to active on reset", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 1,
      skills: [createSkill({ id: "heavy-punch", damage: 100, range: 1 })],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 1, r: 0 },
      slotPosition: 2,
      hp: 50,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    // With new formula, tickCost=1 action created at tick 0 resolves at tick 1
    useGameStore.getState().actions.processTick();
    useGameStore.getState().actions.processTick();

    expect(useGameStore.getState().gameState.battleStatus).toBe("victory");

    useGameStore.getState().actions.reset();

    expect(useGameStore.getState().gameState.battleStatus).toBe("active");
  });

  it("should restore character positions on reset", () => {
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 5, r: 5 },
      slotPosition: 1,
      skills: [createSkill({ id: "move", behavior: "towards", range: 0 })],
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { q: 7, r: 5 },
      slotPosition: 2,
    });

    useGameStore.getState().actions.initBattle([char1, char2]);
    useGameStore.getState().actions.processTick();

    // Character may have moved (not checked - just testing reset)

    useGameStore.getState().actions.reset();

    const restoredChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(restoredChar?.position).toEqual({ q: 5, r: 5 });
  });

  it("should restore character skills on reset", () => {
    const skill1 = createSkill({ id: "skill1", damage: 10 });
    const skill2 = createSkill({ id: "skill2", damage: 20 });
    const char1 = createCharacter({
      id: "char1",
      skills: [skill1, skill2],
    });

    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.processTick();

    useGameStore.getState().actions.reset();

    const restoredChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(restoredChar?.skills).toHaveLength(2);
    expect(restoredChar?.skills[0]?.id).toBe("skill1");
    expect(restoredChar?.skills[1]?.id).toBe("skill2");
  });

  it("should reset currentAction to null for all characters", () => {
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 1,
      skills: [
        createSkill({ id: "attack", damage: 10, range: 1, tickCost: 2 }),
      ],
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { q: 1, r: 0 },
      slotPosition: 2,
    });

    useGameStore.getState().actions.initBattle([char1, char2]);
    useGameStore.getState().actions.processTick();

    // Character may be mid-action (tickCost: 2) - not checked, just testing reset

    useGameStore.getState().actions.reset();

    const characters = useGameStore.getState().gameState.characters;
    characters.forEach((char) => {
      expect(char.currentAction).toBeNull();
    });
  });

  it("should restore original seed and rngState on reset", () => {
    const char1 = createCharacter({ id: "char1" });
    useGameStore.getState().actions.initBattle([char1]);

    const initialSeed = useGameStore.getState().gameState.seed;
    const initialRngState = useGameStore.getState().gameState.rngState;

    useGameStore.getState().actions.processTick();

    // RNG state may have changed during tick processing

    useGameStore.getState().actions.reset();

    expect(useGameStore.getState().gameState.seed).toBe(initialSeed);
    expect(useGameStore.getState().gameState.rngState).toBe(initialRngState);
  });

  it("should be idempotent when reset called twice", () => {
    const char1 = createCharacter({ id: "char1", hp: 100 });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.reset();
    const stateAfterFirstReset = useGameStore.getState().gameState;

    useGameStore.getState().actions.reset();
    const stateAfterSecondReset = useGameStore.getState().gameState;

    expect(stateAfterSecondReset.tick).toBe(stateAfterFirstReset.tick);
    expect(stateAfterSecondReset.battleStatus).toBe(
      stateAfterFirstReset.battleStatus,
    );
    expect(stateAfterSecondReset.characters).toEqual(
      stateAfterFirstReset.characters,
    );
  });
});
