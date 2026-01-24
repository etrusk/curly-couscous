/**
 * Tests for gameStore actions and selectors.
 * Phase 1: Engine-Store Integration tests for processTick and reset.
 * Phase 4: Damage event filtering tests.
 * Phase 6: Character add/remove tests (pre-battle editor).
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  useGameStore,
  selectRecentDamageEvents,
  selectClickableCells,
} from "./gameStore";
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
    useGameStore.getState().actions.updateSkill("char1", "skill1", {
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

  // ============================================================================
  // Character Add/Remove Tests (Pre-Battle Editor)
  // ============================================================================

  describe("addCharacter", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
    });

    it("should add a friendly character to empty battle", () => {
      useGameStore.getState().actions.initBattle([]);

      useGameStore.getState().actions.addCharacter("friendly");

      const characters = useGameStore.getState().gameState.characters;
      expect(characters).toHaveLength(1);
      expect(characters[0]?.faction).toBe("friendly");
    });

    it("should add an enemy character to empty battle", () => {
      useGameStore.getState().actions.initBattle([]);

      useGameStore.getState().actions.addCharacter("enemy");

      const characters = useGameStore.getState().gameState.characters;
      expect(characters).toHaveLength(1);
      expect(characters[0]?.faction).toBe("enemy");
    });

    it("should assign unique IDs across multiple adds", () => {
      useGameStore.getState().actions.initBattle([]);

      useGameStore.getState().actions.addCharacter("friendly");
      useGameStore.getState().actions.addCharacter("friendly");
      useGameStore.getState().actions.addCharacter("enemy");
      useGameStore.getState().actions.addCharacter("enemy");
      useGameStore.getState().actions.addCharacter("friendly");

      const characters = useGameStore.getState().gameState.characters;
      const ids = characters.map((c) => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(5);
      expect(ids).toHaveLength(5);
    });

    it("should not collide with existing character IDs from initBattle", () => {
      const char1 = createCharacter({ id: "char-1" });
      useGameStore.getState().actions.initBattle([char1]);

      useGameStore.getState().actions.addCharacter("friendly");

      const characters = useGameStore.getState().gameState.characters;
      const ids = characters.map((c) => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(2);
      expect(ids.includes("char-1")).toBe(true);
    });

    it("should assign valid position within 12x12 grid (0-11)", () => {
      useGameStore.getState().actions.initBattle([]);

      useGameStore.getState().actions.addCharacter("friendly");

      const character = useGameStore.getState().gameState.characters[0];
      expect(character?.position.x).toBeGreaterThanOrEqual(0);
      expect(character?.position.x).toBeLessThanOrEqual(11);
      expect(character?.position.y).toBeGreaterThanOrEqual(0);
      expect(character?.position.y).toBeLessThanOrEqual(11);
    });

    it("should not place character on occupied cell", () => {
      useGameStore.getState().actions.initBattle([]);

      useGameStore.getState().actions.addCharacter("friendly");
      useGameStore.getState().actions.addCharacter("enemy");

      const characters = useGameStore.getState().gameState.characters;
      const pos1 = characters[0]!.position;
      const pos2 = characters[1]!.position;

      const samePosition = pos1.x === pos2.x && pos1.y === pos2.y;
      expect(samePosition).toBe(false);
    });

    it("should assign default skills (3 skills with expected structure)", () => {
      useGameStore.getState().actions.initBattle([]);

      useGameStore.getState().actions.addCharacter("friendly");

      const character = useGameStore.getState().gameState.characters[0];
      expect(character?.skills).toHaveLength(3);

      character?.skills.forEach((skill) => {
        expect(skill).toHaveProperty("id");
        expect(skill).toHaveProperty("name");
        expect(skill).toHaveProperty("tickCost");
        expect(skill).toHaveProperty("range");
        expect(skill).toHaveProperty("enabled");
        expect(skill).toHaveProperty("triggers");
      });
    });

    it("should set HP and maxHP to 100", () => {
      useGameStore.getState().actions.initBattle([]);

      useGameStore.getState().actions.addCharacter("friendly");

      const character = useGameStore.getState().gameState.characters[0];
      expect(character?.hp).toBe(100);
      expect(character?.maxHp).toBe(100);
    });

    it("should set currentAction to null", () => {
      useGameStore.getState().actions.initBattle([]);

      useGameStore.getState().actions.addCharacter("friendly");

      const character = useGameStore.getState().gameState.characters[0];
      expect(character?.currentAction).toBeNull();
    });

    it("should assign sequential slotPosition based on add order", () => {
      useGameStore.getState().actions.initBattle([]);

      useGameStore.getState().actions.addCharacter("friendly");
      useGameStore.getState().actions.addCharacter("enemy");
      useGameStore.getState().actions.addCharacter("friendly");

      const characters = useGameStore.getState().gameState.characters;
      expect(characters[0]?.slotPosition).toBe(0);
      expect(characters[1]?.slotPosition).toBe(1);
      expect(characters[2]?.slotPosition).toBe(2);
    });

    it("should recalculate battleStatus to active when opposing factions exist", () => {
      useGameStore.getState().actions.initBattle([]);
      expect(useGameStore.getState().gameState.battleStatus).toBe("draw");

      useGameStore.getState().actions.addCharacter("friendly");
      expect(useGameStore.getState().gameState.battleStatus).toBe("draw");

      useGameStore.getState().actions.addCharacter("enemy");
      expect(useGameStore.getState().gameState.battleStatus).toBe("active");
    });

    it("should update initialCharacters so reset includes added character", () => {
      useGameStore.getState().actions.initBattle([]);

      useGameStore.getState().actions.addCharacter("friendly");
      const addedId = useGameStore.getState().gameState.characters[0]!.id;

      // Modify HP
      useGameStore.getState().actions.updateCharacter(addedId, { hp: 50 });
      expect(useGameStore.getState().gameState.characters[0]?.hp).toBe(50);

      // Reset should restore to 100
      useGameStore.getState().actions.reset();
      const restoredChar = useGameStore.getState().gameState.characters[0];
      expect(restoredChar?.hp).toBe(100);
    });

    it("should return true when character added successfully", () => {
      useGameStore.getState().actions.initBattle([]);

      const result = useGameStore.getState().actions.addCharacter("friendly");

      expect(result).toBe(true);
    });

    it("should return false when grid is completely full (144 characters)", () => {
      useGameStore.getState().actions.initBattle([]);

      // Fill the grid with 144 characters (12x12)
      for (let i = 0; i < 144; i++) {
        useGameStore
          .getState()
          .actions.addCharacter(i % 2 === 0 ? "friendly" : "enemy");
      }

      const result = useGameStore.getState().actions.addCharacter("friendly");

      expect(result).toBe(false);
    });

    it("should not add character when grid is full", () => {
      useGameStore.getState().actions.initBattle([]);

      // Fill the grid with 144 characters
      for (let i = 0; i < 144; i++) {
        useGameStore
          .getState()
          .actions.addCharacter(i % 2 === 0 ? "friendly" : "enemy");
      }

      const beforeCount = useGameStore.getState().gameState.characters.length;
      useGameStore.getState().actions.addCharacter("friendly");
      const afterCount = useGameStore.getState().gameState.characters.length;

      expect(afterCount).toBe(beforeCount);
      expect(afterCount).toBe(144);
    });
  });

  describe("removeCharacter", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
    });

    it("should remove character by ID", () => {
      useGameStore.getState().actions.initBattle([]);
      useGameStore.getState().actions.addCharacter("friendly");
      const charId = useGameStore.getState().gameState.characters[0]!.id;

      useGameStore.getState().actions.removeCharacter(charId);

      const characters = useGameStore.getState().gameState.characters;
      expect(characters).toHaveLength(0);
    });

    it("should clear selectedCharacterId if removed character was selected", () => {
      useGameStore.getState().actions.initBattle([]);
      useGameStore.getState().actions.addCharacter("friendly");
      const charId = useGameStore.getState().gameState.characters[0]!.id;

      useGameStore.getState().actions.selectCharacter(charId);
      expect(useGameStore.getState().selectedCharacterId).toBe(charId);

      useGameStore.getState().actions.removeCharacter(charId);
      expect(useGameStore.getState().selectedCharacterId).toBeNull();
    });

    it("should not affect other characters when removing one", () => {
      useGameStore.getState().actions.initBattle([]);
      useGameStore.getState().actions.addCharacter("friendly");
      useGameStore.getState().actions.addCharacter("enemy");
      useGameStore.getState().actions.addCharacter("friendly");

      const char1 = useGameStore.getState().gameState.characters[0]!;
      const char2 = useGameStore.getState().gameState.characters[1]!;
      const char3 = useGameStore.getState().gameState.characters[2]!;

      useGameStore.getState().actions.removeCharacter(char2.id);

      const remaining = useGameStore.getState().gameState.characters;
      expect(remaining).toHaveLength(2);
      expect(remaining.find((c) => c.id === char1.id)).toBeDefined();
      expect(remaining.find((c) => c.id === char3.id)).toBeDefined();
    });

    it("should handle removing non-existent ID gracefully (no error)", () => {
      useGameStore.getState().actions.initBattle([]);
      useGameStore.getState().actions.addCharacter("friendly");

      expect(() => {
        useGameStore.getState().actions.removeCharacter("non-existent-id");
      }).not.toThrow();
    });

    it("should recalculate battleStatus to victory when last enemy removed", () => {
      useGameStore.getState().actions.initBattle([]);
      useGameStore.getState().actions.addCharacter("friendly");
      useGameStore.getState().actions.addCharacter("enemy");

      expect(useGameStore.getState().gameState.battleStatus).toBe("active");

      const enemyId = useGameStore
        .getState()
        .gameState.characters.find((c) => c.faction === "enemy")!.id;

      useGameStore.getState().actions.removeCharacter(enemyId);
      expect(useGameStore.getState().gameState.battleStatus).toBe("victory");
    });

    it("should recalculate battleStatus to defeat when last friendly removed", () => {
      useGameStore.getState().actions.initBattle([]);
      useGameStore.getState().actions.addCharacter("friendly");
      useGameStore.getState().actions.addCharacter("enemy");

      expect(useGameStore.getState().gameState.battleStatus).toBe("active");

      const friendlyId = useGameStore
        .getState()
        .gameState.characters.find((c) => c.faction === "friendly")!.id;

      useGameStore.getState().actions.removeCharacter(friendlyId);
      expect(useGameStore.getState().gameState.battleStatus).toBe("defeat");
    });

    it("should recalculate battleStatus to draw when all characters removed", () => {
      useGameStore.getState().actions.initBattle([]);
      useGameStore.getState().actions.addCharacter("friendly");
      useGameStore.getState().actions.addCharacter("enemy");

      const chars = useGameStore.getState().gameState.characters;
      useGameStore.getState().actions.removeCharacter(chars[0]!.id);
      useGameStore.getState().actions.removeCharacter(chars[1]!.id);

      expect(useGameStore.getState().gameState.battleStatus).toBe("draw");
    });

    it("should update initialCharacters so reset excludes removed character", () => {
      useGameStore.getState().actions.initBattle([]);
      useGameStore.getState().actions.addCharacter("friendly");
      useGameStore.getState().actions.addCharacter("enemy");

      const charToRemove = useGameStore.getState().gameState.characters[0]!.id;
      useGameStore.getState().actions.removeCharacter(charToRemove);

      useGameStore.getState().actions.reset();

      const characters = useGameStore.getState().gameState.characters;
      expect(characters).toHaveLength(1);
      expect(characters.find((c) => c.id === charToRemove)).toBeUndefined();
    });

    it("should handle removing character with active currentAction", () => {
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 0, y: 0 },
        skills: [createSkill({ id: "skill1", damage: 10, range: 1 })],
        currentAction: {
          type: "attack",
          skill: createSkill({ id: "skill1" }),
          targetCell: { x: 1, y: 0 },
          targetCharacter: null,
          startedAtTick: 0,
          resolvesAtTick: 1,
        },
      });

      useGameStore.getState().actions.initBattle([char1]);

      expect(() => {
        useGameStore.getState().actions.removeCharacter("char1");
      }).not.toThrow();

      expect(useGameStore.getState().gameState.characters).toHaveLength(0);
    });
  });

  describe("selectIsGridFull", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
    });

    it("should return false when grid has space", () => {
      const char1 = createCharacter({ id: "char1" });
      const char2 = createCharacter({ id: "char2" });
      const char3 = createCharacter({ id: "char3" });
      useGameStore.getState().actions.initBattle([char1, char2, char3]);

      const isFull = useGameStore.getState().selectIsGridFull?.() ?? false;

      expect(isFull).toBe(false);
    });

    it("should return true when grid has 144 characters", () => {
      useGameStore.getState().actions.initBattle([]);

      // Fill the grid with 144 characters
      for (let i = 0; i < 144; i++) {
        useGameStore
          .getState()
          .actions.addCharacter(i % 2 === 0 ? "friendly" : "enemy");
      }

      const isFull = useGameStore.getState().selectIsGridFull?.() ?? false;

      expect(isFull).toBe(true);
    });
  });

  // ============================================================================
  // Click-to-Place Feature Tests (Debug UI)
  // ============================================================================

  describe("Selection Mode", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
    });

    it("selectionMode should default to 'idle'", () => {
      const { selectionMode } = useGameStore.getState();
      expect(selectionMode).toBe("idle");
    });

    it("setSelectionMode should update selectionMode state", () => {
      useGameStore.getState().actions.setSelectionMode("placing-friendly");
      expect(useGameStore.getState().selectionMode).toBe("placing-friendly");

      useGameStore.getState().actions.setSelectionMode("placing-enemy");
      expect(useGameStore.getState().selectionMode).toBe("placing-enemy");

      useGameStore.getState().actions.setSelectionMode("moving");
      expect(useGameStore.getState().selectionMode).toBe("moving");

      useGameStore.getState().actions.setSelectionMode("idle");
      expect(useGameStore.getState().selectionMode).toBe("idle");
    });
  });

  describe("addCharacterAtPosition", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
      useGameStore.getState().actions.initBattle([]);
    });

    it("addCharacterAtPosition should place character at specified position", () => {
      const result = useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 5, y: 7 });

      expect(result).toBe(true);

      const characters = useGameStore.getState().gameState.characters;
      expect(characters).toHaveLength(1);
      expect(characters[0]?.position).toEqual({ x: 5, y: 7 });
      expect(characters[0]?.faction).toBe("friendly");
    });

    it("addCharacterAtPosition should return false if position is occupied", () => {
      // Place first character
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 3, y: 4 });

      // Try to place second character at same position
      const result = useGameStore
        .getState()
        .actions.addCharacterAtPosition("enemy", { x: 3, y: 4 });

      expect(result).toBe(false);
      expect(useGameStore.getState().gameState.characters).toHaveLength(1);
    });

    it("addCharacterAtPosition should return false if position is out of bounds", () => {
      const outOfBoundsPositions = [
        { x: -1, y: 5 },
        { x: 5, y: -1 },
        { x: 12, y: 5 },
        { x: 5, y: 12 },
        { x: 15, y: 15 },
      ];

      outOfBoundsPositions.forEach((position) => {
        const result = useGameStore
          .getState()
          .actions.addCharacterAtPosition("friendly", position);

        expect(result).toBe(false);
      });

      expect(useGameStore.getState().gameState.characters).toHaveLength(0);
    });

    it("addCharacterAtPosition should update initialCharacters for reset support", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 2, y: 3 });

      const charId = useGameStore.getState().gameState.characters[0]!.id;

      // Modify HP
      useGameStore.getState().actions.updateCharacter(charId, { hp: 50 });
      expect(useGameStore.getState().gameState.characters[0]?.hp).toBe(50);

      // Reset should restore to 100
      useGameStore.getState().actions.reset();
      const restoredChar = useGameStore.getState().gameState.characters[0];
      expect(restoredChar?.hp).toBe(100);
      expect(restoredChar?.position).toEqual({ x: 2, y: 3 });
    });

    it("addCharacterAtPosition should assign correct slotPosition", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 0, y: 0 });
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("enemy", { x: 1, y: 1 });
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 2, y: 2 });

      const characters = useGameStore.getState().gameState.characters;
      expect(characters[0]?.slotPosition).toBe(0);
      expect(characters[1]?.slotPosition).toBe(1);
      expect(characters[2]?.slotPosition).toBe(2);
    });

    it("addCharacterAtPosition should create character with default skills", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 5, y: 5 });

      const character = useGameStore.getState().gameState.characters[0];
      expect(character?.skills).toHaveLength(3);

      character?.skills.forEach((skill) => {
        expect(skill).toHaveProperty("id");
        expect(skill).toHaveProperty("name");
        expect(skill).toHaveProperty("tickCost");
        expect(skill).toHaveProperty("range");
        expect(skill).toHaveProperty("enabled");
        expect(skill).toHaveProperty("triggers");
      });
    });

    it("addCharacterAtPosition should create character with 100 HP", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 6, y: 8 });

      const character = useGameStore.getState().gameState.characters[0];
      expect(character?.hp).toBe(100);
      expect(character?.maxHp).toBe(100);
    });
  });

  describe("moveCharacter", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
      useGameStore.getState().actions.initBattle([]);
    });

    it("moveCharacter should relocate character to new position", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 2, y: 3 });
      const charId = useGameStore.getState().gameState.characters[0]!.id;

      const result = useGameStore
        .getState()
        .actions.moveCharacter(charId, { x: 7, y: 8 });

      expect(result).toBe(true);

      const character = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === charId);
      expect(character?.position).toEqual({ x: 7, y: 8 });
    });

    it("moveCharacter should return false if target position is occupied", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 2, y: 3 });
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("enemy", { x: 5, y: 5 });

      const charId = useGameStore.getState().gameState.characters[0]!.id;

      // Try to move to occupied position
      const result = useGameStore
        .getState()
        .actions.moveCharacter(charId, { x: 5, y: 5 });

      expect(result).toBe(false);

      const character = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === charId);
      expect(character?.position).toEqual({ x: 2, y: 3 }); // Should not have moved
    });

    it("moveCharacter should return false if character not found", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 2, y: 3 });

      const result = useGameStore
        .getState()
        .actions.moveCharacter("non-existent-id", { x: 5, y: 5 });

      expect(result).toBe(false);
    });

    it("moveCharacter should return false if position is out of bounds", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 2, y: 3 });
      const charId = useGameStore.getState().gameState.characters[0]!.id;

      const outOfBoundsPositions = [
        { x: -1, y: 5 },
        { x: 5, y: -1 },
        { x: 12, y: 5 },
        { x: 5, y: 12 },
      ];

      outOfBoundsPositions.forEach((position) => {
        const result = useGameStore
          .getState()
          .actions.moveCharacter(charId, position);

        expect(result).toBe(false);
      });

      const character = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === charId);
      expect(character?.position).toEqual({ x: 2, y: 3 }); // Should not have moved
    });

    it("moveCharacter should update both gameState and initialCharacters", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 2, y: 3 });
      const charId = useGameStore.getState().gameState.characters[0]!.id;

      useGameStore.getState().actions.moveCharacter(charId, { x: 7, y: 8 });

      // Reset should restore to new moved position
      useGameStore.getState().actions.reset();

      const character = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === charId);
      expect(character?.position).toEqual({ x: 7, y: 8 });
    });

    it("moveCharacter should preserve all other character properties", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 2, y: 3 });
      const charId = useGameStore.getState().gameState.characters[0]!.id;
      const originalChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === charId)!;

      useGameStore.getState().actions.moveCharacter(charId, { x: 7, y: 8 });

      const movedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === charId)!;

      expect(movedChar.id).toBe(originalChar.id);
      expect(movedChar.name).toBe(originalChar.name);
      expect(movedChar.faction).toBe(originalChar.faction);
      expect(movedChar.hp).toBe(originalChar.hp);
      expect(movedChar.maxHp).toBe(originalChar.maxHp);
      expect(movedChar.slotPosition).toBe(originalChar.slotPosition);
      expect(movedChar.skills).toEqual(originalChar.skills);
      expect(movedChar.currentAction).toBe(originalChar.currentAction);
    });
  });

  describe("selectClickableCells", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
      useGameStore.getState().actions.initBattle([]);
    });

    it("selectClickableCells should return empty Set in idle mode", () => {
      useGameStore.getState().actions.setSelectionMode("idle");

      const clickableCells = selectClickableCells(useGameStore.getState());

      expect(clickableCells).toBeInstanceOf(Set);
      expect(clickableCells.size).toBe(0);
    });

    it("selectClickableCells should return all empty cells in placing-friendly mode", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 5, y: 5 });
      useGameStore.getState().actions.setSelectionMode("placing-friendly");

      const clickableCells = selectClickableCells(useGameStore.getState());

      // Should have 143 empty cells (144 - 1 occupied)
      expect(clickableCells.size).toBe(143);
      expect(clickableCells.has("5-5")).toBe(false); // Occupied cell not clickable
      expect(clickableCells.has("0-0")).toBe(true); // Empty cell clickable
      expect(clickableCells.has("11-11")).toBe(true); // Empty cell clickable
    });

    it("selectClickableCells should return all empty cells in moving mode", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 3, y: 4 });
      useGameStore.getState().actions.setSelectionMode("moving");

      const clickableCells = selectClickableCells(useGameStore.getState());

      // Should have 143 empty cells
      expect(clickableCells.size).toBe(143);
      expect(clickableCells.has("3-4")).toBe(false); // Occupied cell not clickable
      expect(clickableCells.has("2-2")).toBe(true); // Empty cell clickable
    });

    it("selectClickableCells should exclude occupied positions", () => {
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 0, y: 0 });
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("enemy", { x: 5, y: 5 });
      useGameStore
        .getState()
        .actions.addCharacterAtPosition("friendly", { x: 11, y: 11 });

      useGameStore.getState().actions.setSelectionMode("placing-friendly");

      const clickableCells = selectClickableCells(useGameStore.getState());

      // Should have 141 empty cells (144 - 3 occupied)
      expect(clickableCells.size).toBe(141);
      expect(clickableCells.has("0-0")).toBe(false);
      expect(clickableCells.has("5-5")).toBe(false);
      expect(clickableCells.has("11-11")).toBe(false);
      expect(clickableCells.has("6-6")).toBe(true); // Empty cell clickable
    });
  });
});
