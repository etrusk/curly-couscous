/**
 * Tests for selectIntentData selector - preview intent lines.
 *
 * Tests verify that selectIntentData correctly includes preview decisions
 * for idle characters (those without currentAction). This enables intent
 * lines at tick 0 and when a character's action resolves.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectIntentData } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";

describe("selectIntentData - preview intent lines", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should show preview attack intent at tick 0 when character has no currentAction", () => {
    // Setup: friendly with Light Punch skill, enemy within range
    const lightPunchSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [lightPunchSkill],
      currentAction: null, // Idle - no action yet
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 0 }, // Within range
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    // Should have at least 1 entry for friendly character's preview
    expect(result.length).toBeGreaterThanOrEqual(1);
    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent).toBeDefined();
    expect(friendlyIntent?.action.type).toBe("attack");
    expect(friendlyIntent?.action.targetCell).toEqual({ x: 1, y: 0 });
    expect(friendlyIntent?.action.skill.damage).toBe(10); // Confirms Light Punch
    expect(friendlyIntent?.ticksRemaining).toBe(1); // resolvesAtTick=1, currentTick=0
  });

  it("should show preview movement intent at tick 0 when character has no currentAction", () => {
    // Setup: friendly with Move Towards skill, enemy far away
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [moveSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent).toBeDefined();
    expect(friendlyIntent?.action.type).toBe("move");
    // Movement should be towards enemy (adjacent cell)
    expect(friendlyIntent?.action.targetCell).toBeDefined();
    expect(friendlyIntent?.ticksRemaining).toBe(1);
  });

  it("should filter out preview idle actions (no intent line for idle)", () => {
    // Setup: character with no skills will preview idle action
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [], // No skills = will preview idle
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    // Should NOT include idle character
    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent).toBeUndefined();
  });

  it("should show preview after action resolves (currentAction cleared)", () => {
    // Setup: character with Move Towards skill, simulate action resolved
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [moveSkill],
      currentAction: null, // Action resolved, character is idle again
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);
    // Simulate mid-battle: tick > 0
    useGameStore.setState((state) => {
      state.gameState.tick = 2;
    });

    const result = selectIntentData(useGameStore.getState());

    // Preview should show for idle friendly character
    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent).toBeDefined();
    expect(friendlyIntent?.action.type).toBe("move");
    // ticksRemaining should equal skill's tickCost (action starts at current tick)
    expect(friendlyIntent?.ticksRemaining).toBe(1);
  });

  it("should show both committed and preview intents simultaneously", () => {
    // Setup: one character with committed action, one idle with preview
    const attackSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });

    // Friendly has committed action
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [attackSkill],
      currentAction: {
        type: "attack",
        skill: attackSkill,
        targetCell: { x: 1, y: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    });

    // Enemy is idle (will preview)
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
      skills: [moveSkill],
      currentAction: null,
    });

    // Third character for enemy to target
    const friendly2 = createCharacter({
      id: "friendly2",
      faction: "friendly",
      position: { x: 6, y: 6 },
      skills: [],
    });

    useGameStore.getState().actions.initBattle([friendly, enemy, friendly2]);

    const result = selectIntentData(useGameStore.getState());

    // Should return 2 entries
    expect(result).toHaveLength(2);

    // One from committed action
    const committedIntent = result.find((r) => r.characterId === "friendly");
    expect(committedIntent).toBeDefined();
    expect(committedIntent?.action.type).toBe("attack");
    expect(committedIntent?.ticksRemaining).toBe(1); // Based on resolvesAtTick

    // One from preview
    const previewIntent = result.find((r) => r.characterId === "enemy");
    expect(previewIntent).toBeDefined();
    expect(previewIntent?.action.type).toBe("move");
    expect(previewIntent?.ticksRemaining).toBe(1); // Based on tickCost
  });

  it("should calculate preview ticksRemaining correctly for tickCost=1 skill", () => {
    // Setup: character with tickCost=1 skill at tick 0
    const lightPunchSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [lightPunchSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 0 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent?.ticksRemaining).toBe(1);
    // Maps to "1-tick remaining" visual style
  });

  it("should calculate preview ticksRemaining correctly for tickCost=2 skill", () => {
    // Setup: character with tickCost=2 skill at tick 0
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [heavyPunchSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 2, y: 0 }, // Within range
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent?.ticksRemaining).toBe(2);
    // Maps to "2+ tick remaining" visual style (thicker stroke)
  });

  it("should include correct characterPosition in preview intent data", () => {
    // Setup: character at specific position
    const attackSkill = createSkill({
      id: "attack",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 3, y: 7 }, // Specific position
      skills: [attackSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 4, y: 7 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent?.characterPosition).toEqual({ x: 3, y: 7 });
    // characterPosition is independent of targetCell
    expect(friendlyIntent?.action.targetCell).not.toEqual(
      friendlyIntent?.characterPosition,
    );
  });

  it("should not compute previews when all characters have currentAction", () => {
    // Setup: all characters have committed actions
    const skill = createSkill({
      id: "attack",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [skill],
      currentAction: {
        type: "attack",
        skill,
        targetCell: { x: 1, y: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { x: 2, y: 0 },
      skills: [skill],
      currentAction: {
        type: "attack",
        skill,
        targetCell: { x: 1, y: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    });
    useGameStore.getState().actions.initBattle([char1, char2]);

    const result = selectIntentData(useGameStore.getState());

    // Should return 2 entries (both committed)
    expect(result).toHaveLength(2);
    // Both should be from committed actions (not previews)
    expect(result.every((r) => r.ticksRemaining > 0)).toBe(true);
  });

  it("should show preview for all idle characters, not just one", () => {
    // Setup: multiple idle characters
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [moveSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 11, y: 11 },
      skills: [moveSkill],
      currentAction: null,
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    // Should return 2 entries (both previews)
    expect(result).toHaveLength(2);

    // Friendly shows movement toward enemy
    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent).toBeDefined();
    expect(friendlyIntent?.action.type).toBe("move");

    // Enemy shows movement toward friendly
    const enemyIntent = result.find((r) => r.characterId === "enemy");
    expect(enemyIntent).toBeDefined();
    expect(enemyIntent?.action.type).toBe("move");
  });

  it("should respect disabled skills in preview decisions", () => {
    // Setup: first skill disabled, second enabled
    const disabledAttack = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: false, // Disabled
    });
    const enabledMove = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
      enabled: true,
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [disabledAttack, enabledMove], // First disabled, second enabled
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 1, y: 0 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    // Should show movement (second skill), not attack (disabled)
    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent?.action.type).toBe("move");
  });

  it("should respect trigger conditions in preview decisions", () => {
    // Setup: attack with trigger requiring enemy in range, fallback move
    const attackSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
      triggers: [{ type: "enemy_in_range", value: 1 }],
    });
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
      triggers: [{ type: "always" }],
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [attackSkill, moveSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 }, // Out of trigger range for attack
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    // Should NOT show attack (trigger fails), should show movement
    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent?.action.type).toBe("move");
  });

  it("should exclude dead characters from preview intent lines", () => {
    // Setup: dead character (hp <= 0)
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { x: 0, y: 0 },
      skills: [moveSkill],
      currentAction: null,
      hp: 0, // Dead
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 5, y: 5 },
      skills: [],
      hp: 100, // Alive
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    // Dead character should NOT produce intent line
    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent).toBeUndefined();
  });
});
