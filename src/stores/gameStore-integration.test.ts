/**
 * Tests for engine-store integration (processTick, damage event filtering, initial state storage).
 * Phase 1: Engine-Store Integration tests for processTick and reset.
 * Phase 4: Damage event filtering tests.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  useGameStore,
  selectRecentDamageEvents,
  selectIntentData,
} from "./gameStore";
import type { DamageEvent, GameEvent } from "../engine/types";
import { createCharacter, createSkill } from "./gameStore-test-helpers";

// ============================================================================
// Phase 4: Damage Event Filtering Tests
// ============================================================================

describe("selectRecentDamageEvents", () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.getState().actions.reset();
  });

  it("returns empty array when no damage events", () => {
    const char1 = createCharacter({ id: "char1" });
    useGameStore.getState().actions.initBattle([char1]);

    const result = selectRecentDamageEvents(useGameStore.getState());

    expect(result).toEqual([]);
  });

  it("filters damage events by current tick", () => {
    const char1 = createCharacter({ id: "char1" });
    const char2 = createCharacter({ id: "char2" });
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Advance to tick 1
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Add damage event at tick 1
    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 1,
      sourceId: "char1",
      targetId: "char2",
      damage: 10,
      resultingHp: 90,
    };
    useGameStore.getState().actions.addEvent(damageEvent);

    const result = selectRecentDamageEvents(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(damageEvent);
  });

  it("excludes damage from previous ticks", () => {
    const char1 = createCharacter({ id: "char1" });
    const char2 = createCharacter({ id: "char2" });
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Add damage event at tick 0
    const oldDamageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char2",
      damage: 10,
      resultingHp: 90,
    };
    useGameStore.getState().actions.addEvent(oldDamageEvent);

    // Advance to tick 1
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    // Add damage event at tick 1
    const currentDamageEvent: DamageEvent = {
      type: "damage",
      tick: 1,
      sourceId: "char2",
      targetId: "char1",
      damage: 25,
      resultingHp: 75,
    };
    useGameStore.getState().actions.addEvent(currentDamageEvent);

    const result = selectRecentDamageEvents(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(currentDamageEvent);
    expect(result[0]!.tick).toBe(1);
  });

  it("excludes non-damage events", () => {
    const char1 = createCharacter({ id: "char1" });
    useGameStore.getState().actions.initBattle([char1]);

    // Add various event types at tick 0
    const movementEvent: GameEvent = {
      type: "movement",
      tick: 0,
      characterId: "char1",
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 },
      collided: false,
    };
    const deathEvent: GameEvent = {
      type: "death",
      tick: 0,
      characterId: "char1",
    };
    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char1",
      damage: 50,
      resultingHp: 50,
    };

    useGameStore.getState().actions.addEvent(movementEvent);
    useGameStore.getState().actions.addEvent(deathEvent);
    useGameStore.getState().actions.addEvent(damageEvent);

    const result = selectRecentDamageEvents(useGameStore.getState());

    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("damage");
    expect(result[0]).toEqual(damageEvent);
  });
});

// ============================================================================
// Phase 1: Engine-Store Integration Tests
// ============================================================================

describe("processTick Integration", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should call engine processTick and update gameState including tick", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      skills: [createSkill({ id: "light-punch", damage: 10, range: 1 })],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
      hp: 100,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    const initialTick = useGameStore.getState().gameState.tick;

    useGameStore.getState().actions.processTick();

    const state = useGameStore.getState().gameState;
    expect(state.tick).toBe(initialTick + 1);
    // Verify target took damage (proves engine was called)
    const updatedTarget = state.characters.find((c) => c.id === "target");
    expect(updatedTarget?.hp).toBeLessThan(100);
  });

  it("should append damage events to history after combat", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      skills: [createSkill({ id: "light-punch", damage: 10, range: 1 })],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    useGameStore.getState().actions.processTick();

    const history = useGameStore.getState().gameState.history;
    const damageEvents = history.filter((e) => e.type === "damage");

    expect(damageEvents.length).toBeGreaterThan(0);
    expect(damageEvents[0]).toMatchObject({
      type: "damage",
      sourceId: "attacker",
      targetId: "target",
    });
  });

  it("should apply damage to characters", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      skills: [createSkill({ id: "light-punch", damage: 10, range: 1 })],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
      hp: 100,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    useGameStore.getState().actions.processTick();

    const updatedTarget = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "target");
    expect(updatedTarget?.hp).toBe(90);
  });

  it("should remove dead characters (HP <= 0)", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      skills: [createSkill({ id: "heavy-punch", damage: 100, range: 1 })],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
      hp: 50,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    useGameStore.getState().actions.processTick();

    const characters = useGameStore.getState().gameState.characters;
    expect(characters).toHaveLength(1);
    expect(characters[0]?.id).toBe("attacker");
  });

  it("should update battleStatus to victory when all enemies eliminated", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      skills: [createSkill({ id: "heavy-punch", damage: 100, range: 1 })],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
      hp: 50,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    useGameStore.getState().actions.processTick();

    expect(useGameStore.getState().gameState.battleStatus).toBe("victory");
  });

  it("should update battleStatus to defeat when all friendlies eliminated", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "enemy",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      skills: [createSkill({ id: "heavy-punch", damage: 100, range: 1 })],
    });
    const target = createCharacter({
      id: "target",
      faction: "friendly",
      position: { x: 1, y: 0 },
      slotPosition: 1,
      hp: 50,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    useGameStore.getState().actions.processTick();

    expect(useGameStore.getState().gameState.battleStatus).toBe("defeat");
  });

  it("should update battleStatus to draw on mutual elimination", () => {
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      hp: 10,
      skills: [createSkill({ id: "attack", damage: 25, range: 1 })],
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
      hp: 10,
      skills: [createSkill({ id: "attack", damage: 25, range: 1 })],
    });

    useGameStore.getState().actions.initBattle([char1, char2]);
    useGameStore.getState().actions.processTick();

    expect(useGameStore.getState().gameState.battleStatus).toBe("draw");
  });

  it("should not process tick when battleStatus is 'victory'", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      skills: [createSkill({ id: "heavy-punch", damage: 100, range: 1 })],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
      hp: 50,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    useGameStore.getState().actions.processTick(); // First tick -> victory

    const tickBeforeSecondCall = useGameStore.getState().gameState.tick;
    useGameStore.getState().actions.processTick(); // Should be no-op

    // Guard covers all terminal states (!== 'active')
    expect(useGameStore.getState().gameState.tick).toBe(tickBeforeSecondCall);
    expect(useGameStore.getState().gameState.battleStatus).toBe("victory");
  });
});

describe("Intent Data Integration", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should produce non-empty intent data BEFORE processTick for Heavy Punch (tickCost 2)", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      damage: 25,
      tickCost: 2,
      range: 2,
    });
    const action = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { x: 2, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1, // 0 + 2 - 1 = 1
    };
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      currentAction: action,
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 2, y: 0 },
      slotPosition: 1,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    // At tick 0, action has resolvesAtTick=1, ticksRemaining=1

    const intentData = selectIntentData(useGameStore.getState());
    expect(intentData).toHaveLength(1);
    expect(intentData[0]?.characterId).toBe("attacker");
    expect(intentData[0]?.ticksRemaining).toBe(1);
  });

  it("should produce empty intent data after processTick for Light Punch (tickCost 1)", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      skills: [
        createSkill({ id: "light-punch", damage: 10, tickCost: 1, range: 1 }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    // At tick 0, computeDecisions produces an action with resolvesAtTick = 0 (tickCost 1)
    // processTick applies decisions, then clearResolvedActions removes it because resolvesAtTick <= tick after processing.
    // After processTick, tick becomes 1, so any action with resolvesAtTick = 0 has ticksRemaining = -1 (negative)
    // and is filtered out by selectIntentData (ticksRemaining > 0 filter).
    // This test verifies intent lines are not shown for already-resolved actions.
    useGameStore.getState().actions.processTick();

    const intentData = selectIntentData(useGameStore.getState());
    expect(intentData).toHaveLength(0);
  });
});

describe("Initial State Storage", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should store initial characters independent from active (modifications don't affect reset)", () => {
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      hp: 100,
      skills: [createSkill({ id: "attack", damage: 10, range: 1 })],
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
      hp: 100,
    });

    useGameStore.getState().actions.initBattle([char1, char2]);

    // Damage active character
    useGameStore.getState().actions.processTick();
    const damagedHp = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char2")?.hp;
    expect(damagedHp).toBeLessThan(100);

    // Reset should restore original HP
    useGameStore.getState().actions.reset();
    const restoredChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char2");
    expect(restoredChar?.hp).toBe(100);
  });

  it("should overwrite initialCharacters when initBattle called twice", () => {
    const char1 = createCharacter({ id: "char1", hp: 50 });
    useGameStore.getState().actions.initBattle([char1]);

    const char2 = createCharacter({ id: "char2", hp: 75 });
    useGameStore.getState().actions.initBattle([char2]);

    useGameStore.getState().actions.reset();

    const characters = useGameStore.getState().gameState.characters;
    expect(characters).toHaveLength(1);
    expect(characters[0]?.id).toBe("char2");
    expect(characters[0]?.hp).toBe(75);
  });

  it("should handle initBattle with empty character array", () => {
    useGameStore.getState().actions.initBattle([]);

    // Empty battle is a draw per engine's checkBattleStatus([])
    expect(useGameStore.getState().gameState.battleStatus).toBe("draw");
    expect(useGameStore.getState().gameState.characters).toHaveLength(0);
  });
});
