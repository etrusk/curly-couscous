/**
 * Tests for gameStore actions and selectors.
 * Phase 1: Engine-Store Integration tests for processTick and reset.
 * Phase 4: Damage event filtering tests.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectRecentDamageEvents } from "./gameStore";
import type { Character, DamageEvent, GameEvent, Skill } from "../engine/types";

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Helper to create a minimal character for testing.
 */
const createCharacter = (
  overrides: Partial<Character> & { id: string },
): Character => ({
  id: overrides.id,
  name: overrides.name ?? `Character ${overrides.id}`,
  faction: overrides.faction ?? "friendly",
  slotPosition: overrides.slotPosition ?? 0,
  hp: overrides.hp ?? 100,
  maxHp: overrides.maxHp ?? 100,
  position: overrides.position ?? { x: 0, y: 0 },
  skills: overrides.skills ?? [],
  currentAction: overrides.currentAction ?? null,
});

/**
 * Helper to create skills with minimal boilerplate.
 */
const createSkill = (overrides: Partial<Skill> & { id: string }): Skill => ({
  id: overrides.id,
  name: overrides.name ?? `Skill-${overrides.id}`,
  tickCost: overrides.tickCost ?? 1,
  range: overrides.range ?? 1,
  damage: overrides.damage,
  mode: overrides.mode,
  enabled: overrides.enabled ?? true,
  triggers: overrides.triggers ?? [{ type: "always" }],
  selectorOverride: overrides.selectorOverride,
});

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

describe("Reset Functionality", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should restore initial HP on reset", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      skills: [createSkill({ id: "attack", damage: 10, range: 1 })],
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
      position: { x: 0, y: 0 },
      slotPosition: 0,
      skills: [createSkill({ id: "attack", damage: 10, range: 1 })],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
    });

    useGameStore.getState().actions.initBattle([attacker, target]);
    useGameStore.getState().actions.processTick();

    expect(useGameStore.getState().gameState.history.length).toBeGreaterThan(0);

    useGameStore.getState().actions.reset();

    expect(useGameStore.getState().gameState.history).toEqual([]);
  });

  it("should restore battleStatus to active on reset", () => {
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

    useGameStore.getState().actions.reset();

    expect(useGameStore.getState().gameState.battleStatus).toBe("active");
  });

  it("should restore character positions on reset", () => {
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
      slotPosition: 0,
      skills: [createSkill({ id: "move", mode: "towards", range: 0 })],
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { x: 7, y: 5 },
      slotPosition: 1,
    });

    useGameStore.getState().actions.initBattle([char1, char2]);
    useGameStore.getState().actions.processTick();

    // Character may have moved (not checked - just testing reset)

    useGameStore.getState().actions.reset();

    const restoredChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(restoredChar?.position).toEqual({ x: 5, y: 5 });
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
      position: { x: 0, y: 0 },
      slotPosition: 0,
      skills: [
        createSkill({ id: "attack", damage: 10, range: 1, tickCost: 2 }),
      ],
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { x: 1, y: 0 },
      slotPosition: 1,
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

// ============================================================================
// SkillsPanel Store Integration Tests
// ============================================================================

describe("selectCharacter", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should set selectedCharacterId when given a valid character id", () => {
    const char1 = createCharacter({ id: "char1" });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.selectCharacter("char1");

    expect(useGameStore.getState().selectedCharacterId).toBe("char1");
  });

  it("should clear selectedCharacterId when given null", () => {
    const char1 = createCharacter({ id: "char1" });
    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.selectCharacter("char1");

    useGameStore.getState().actions.selectCharacter(null);

    expect(useGameStore.getState().selectedCharacterId).toBeNull();
  });

  it("should allow selecting a different character", () => {
    const char1 = createCharacter({ id: "char1" });
    const char2 = createCharacter({ id: "char2" });
    useGameStore.getState().actions.initBattle([char1, char2]);

    useGameStore.getState().actions.selectCharacter("char1");
    expect(useGameStore.getState().selectedCharacterId).toBe("char1");

    useGameStore.getState().actions.selectCharacter("char2");
    expect(useGameStore.getState().selectedCharacterId).toBe("char2");
  });
});

describe("updateSkill", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should update skill enabled property", () => {
    const skill = createSkill({ id: "skill1", enabled: true });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore
      .getState()
      .actions.updateSkill("char1", "skill1", { enabled: false });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    expect(updatedSkill?.enabled).toBe(false);
  });

  it("should update skill triggers", () => {
    const skill = createSkill({ id: "skill1", triggers: [{ type: "always" }] });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    const newTriggers = [{ type: "enemy_in_range" as const, value: 3 }];
    useGameStore
      .getState()
      .actions.updateSkill("char1", "skill1", { triggers: newTriggers });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    expect(updatedSkill?.triggers).toEqual(newTriggers);
  });

  it("should update skill selectorOverride", () => {
    const skill = createSkill({ id: "skill1" });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    const newSelector = { type: "lowest_hp_enemy" as const };
    useGameStore
      .getState()
      .actions.updateSkill("char1", "skill1", {
        selectorOverride: newSelector,
      });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    expect(updatedSkill?.selectorOverride).toEqual(newSelector);
  });

  it("should update skill mode (for Move skill)", () => {
    const skill = createSkill({ id: "move", mode: "towards" });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore
      .getState()
      .actions.updateSkill("char1", "move", { mode: "away" });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "move");
    expect(updatedSkill?.mode).toBe("away");
  });

  it("should not affect other skills on the same character", () => {
    const skill1 = createSkill({ id: "skill1", enabled: true });
    const skill2 = createSkill({ id: "skill2", enabled: true });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore
      .getState()
      .actions.updateSkill("char1", "skill1", { enabled: false });

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill2 = updatedChar?.skills.find((s) => s.id === "skill2");
    expect(updatedSkill2?.enabled).toBe(true);
  });

  it("should not affect other characters", () => {
    const skill = createSkill({ id: "skill1", enabled: true });
    const char1 = createCharacter({ id: "char1", skills: [skill] });
    const char2 = createCharacter({ id: "char2", skills: [skill] });
    useGameStore.getState().actions.initBattle([char1, char2]);

    useGameStore
      .getState()
      .actions.updateSkill("char1", "skill1", { enabled: false });

    const updatedChar2 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char2");
    const char2Skill = updatedChar2?.skills.find((s) => s.id === "skill1");
    expect(char2Skill?.enabled).toBe(true);
  });

  it("should handle updating non-existent skill gracefully", () => {
    const char1 = createCharacter({ id: "char1", skills: [] });
    useGameStore.getState().actions.initBattle([char1]);

    // Should not throw
    expect(() => {
      useGameStore
        .getState()
        .actions.updateSkill("char1", "nonexistent", { enabled: false });
    }).not.toThrow();
  });
});

describe("moveSkillUp", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should move skill from index 1 to index 0", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillUp("char1", 1);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill2");
    expect(updatedChar?.skills[1]?.id).toBe("skill1");
  });

  it("should move skill from middle position", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const skill3 = createSkill({ id: "skill3" });
    const char1 = createCharacter({
      id: "char1",
      skills: [skill1, skill2, skill3],
    });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillUp("char1", 2);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill1");
    expect(updatedChar?.skills[1]?.id).toBe("skill3");
    expect(updatedChar?.skills[2]?.id).toBe("skill2");
  });

  it("should do nothing when skill is already at top (index 0)", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillUp("char1", 0);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill1");
    expect(updatedChar?.skills[1]?.id).toBe("skill2");
  });

  it("should not affect other characters", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    const char2 = createCharacter({ id: "char2", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1, char2]);

    useGameStore.getState().actions.moveSkillUp("char1", 1);

    const updatedChar2 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char2");
    expect(updatedChar2?.skills[0]?.id).toBe("skill1");
    expect(updatedChar2?.skills[1]?.id).toBe("skill2");
  });

  it("should handle out-of-bounds index gracefully", () => {
    const skill1 = createSkill({ id: "skill1" });
    const char1 = createCharacter({ id: "char1", skills: [skill1] });
    useGameStore.getState().actions.initBattle([char1]);

    // Should not throw
    expect(() => {
      useGameStore.getState().actions.moveSkillUp("char1", 5);
    }).not.toThrow();
  });
});

describe("moveSkillDown", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should move skill from index 0 to index 1", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillDown("char1", 0);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill2");
    expect(updatedChar?.skills[1]?.id).toBe("skill1");
  });

  it("should move skill from middle position", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const skill3 = createSkill({ id: "skill3" });
    const char1 = createCharacter({
      id: "char1",
      skills: [skill1, skill2, skill3],
    });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillDown("char1", 1);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill1");
    expect(updatedChar?.skills[1]?.id).toBe("skill3");
    expect(updatedChar?.skills[2]?.id).toBe("skill2");
  });

  it("should do nothing when skill is already at bottom", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.moveSkillDown("char1", 1);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.id).toBe("skill1");
    expect(updatedChar?.skills[1]?.id).toBe("skill2");
  });

  it("should not affect other characters", () => {
    const skill1 = createSkill({ id: "skill1" });
    const skill2 = createSkill({ id: "skill2" });
    const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
    const char2 = createCharacter({ id: "char2", skills: [skill1, skill2] });
    useGameStore.getState().actions.initBattle([char1, char2]);

    useGameStore.getState().actions.moveSkillDown("char1", 0);

    const updatedChar2 = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char2");
    expect(updatedChar2?.skills[0]?.id).toBe("skill1");
    expect(updatedChar2?.skills[1]?.id).toBe("skill2");
  });

  it("should handle out-of-bounds index gracefully", () => {
    const skill1 = createSkill({ id: "skill1" });
    const char1 = createCharacter({ id: "char1", skills: [skill1] });
    useGameStore.getState().actions.initBattle([char1]);

    // Should not throw
    expect(() => {
      useGameStore.getState().actions.moveSkillDown("char1", 5);
    }).not.toThrow();
  });
});
