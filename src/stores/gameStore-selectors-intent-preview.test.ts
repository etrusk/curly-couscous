/* eslint-disable max-lines */
import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectIntentData } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";

describe("selectIntentData - preview intent lines", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should show preview attack intent at tick 0 when character has no currentAction", () => {
    const lightPunchSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [lightPunchSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent?.action.type).toBe("attack");
    expect(friendlyIntent?.action.targetCell).toEqual({ q: 1, r: 0 });
    expect(friendlyIntent?.action.skill.damage).toBe(10);
    expect(friendlyIntent?.ticksRemaining).toBe(1);
  });

  it("should show preview movement intent at tick 0 when character has no currentAction", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      behavior: "towards",
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [moveSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent).toBeDefined();
    expect(friendlyIntent?.action.type).toBe("move");
    expect(friendlyIntent?.action.targetCell).toBeDefined();
    expect(friendlyIntent?.ticksRemaining).toBe(1);
  });

  it("should filter out preview idle actions (no intent line for idle)", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent).toBeUndefined();
  });

  it("should show preview after action resolves (currentAction cleared)", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      behavior: "towards",
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [moveSkill],
      currentAction: null, // Action resolved, character is idle again
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
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
    expect(friendlyIntent?.ticksRemaining).toBe(1);
  });

  it("should show both committed and preview intents simultaneously", () => {
    const attackSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      behavior: "towards",
    });

    // Friendly has committed action
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [attackSkill],
      currentAction: {
        type: "attack",
        skill: attackSkill,
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    });

    // Enemy is idle (will preview)
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      skills: [moveSkill],
      currentAction: null,
    });

    // Third character for enemy to target
    const friendly2 = createCharacter({
      id: "friendly2",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [],
    });

    useGameStore.getState().actions.initBattle([friendly, enemy, friendly2]);

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(2);

    // One from committed action
    const committedIntent = result.find((r) => r.characterId === "friendly");
    expect(committedIntent).toBeDefined();
    expect(committedIntent?.action.type).toBe("attack");
    expect(committedIntent?.ticksRemaining).toBe(1);

    const previewIntent = result.find((r) => r.characterId === "enemy");
    expect(previewIntent).toBeDefined();
    expect(previewIntent?.action.type).toBe("move");
    expect(previewIntent?.ticksRemaining).toBe(1);
  });

  it("should calculate preview ticksRemaining correctly for tickCost=1 skill", () => {
    const lightPunchSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [lightPunchSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent?.ticksRemaining).toBe(1);
  });

  it("should calculate preview ticksRemaining correctly for tickCost=2 skill", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [heavyPunchSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 }, // Within range
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent?.ticksRemaining).toBe(2);
  });

  it("should include correct characterPosition in preview intent data", () => {
    const attackSkill = createSkill({
      id: "attack",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 3, r: -1 }, // Specific position
      skills: [attackSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: -1 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent?.characterPosition).toEqual({ q: 3, r: -1 });
    expect(friendlyIntent?.action.targetCell).not.toEqual(
      friendlyIntent?.characterPosition,
    );
  });

  it("should not compute previews when all characters have currentAction", () => {
    const skill = createSkill({
      id: "attack",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [skill],
      currentAction: {
        type: "attack",
        skill,
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { q: 2, r: 0 },
      skills: [skill],
      currentAction: {
        type: "attack",
        skill,
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    });
    useGameStore.getState().actions.initBattle([char1, char2]);

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(2);
    expect(result.every((r) => r.ticksRemaining > 0)).toBe(true);
  });

  it("should show preview for all idle characters, not just one", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      behavior: "towards",
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [moveSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: -5, r: 5 },
      skills: [moveSkill],
      currentAction: null,
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

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
    const disabledAttack = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: false,
    });
    const enabledMove = createSkill({
      id: "move-towards",
      tickCost: 1,
      behavior: "towards",
      enabled: true,
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [disabledAttack, enabledMove],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent?.action.type).toBe("move");
  });

  it("should respect trigger conditions in preview decisions", () => {
    const attackSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
      trigger: { scope: "enemy", condition: "in_range", conditionValue: 1 },
    });
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      behavior: "towards",
      trigger: { scope: "enemy", condition: "always" },
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [attackSkill, moveSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      skills: [],
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent?.action.type).toBe("move");
  });

  it("should exclude dead characters from preview intent lines", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      behavior: "towards",
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [moveSkill],
      currentAction: null,
      hp: 0,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 3 },
      skills: [],
      hp: 100,
    });
    useGameStore.getState().actions.initBattle([friendly, enemy]);

    const result = selectIntentData(useGameStore.getState());

    // Dead character should NOT produce intent line
    const friendlyIntent = result.find((r) => r.characterId === "friendly");
    expect(friendlyIntent).toBeUndefined();
  });

  // NEW TESTS FOR INSTANT ATTACKS
  describe("Instant Attacks (tickCost 0)", () => {
    it("should show preview with ticksRemaining=0 for instant attack (tickCost=0)", () => {
      const instantAttack = createSkill({
        id: "light-punch",
        tickCost: 0,
        range: 1,
        damage: 10,
      });
      const friendly = createCharacter({
        id: "friendly",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [instantAttack],
        currentAction: null,
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 1, r: 0 },
        skills: [],
      });
      useGameStore.getState().actions.initBattle([friendly, enemy]);

      const result = selectIntentData(useGameStore.getState());

      const friendlyIntent = result.find((r) => r.characterId === "friendly");
      expect(friendlyIntent).toBeDefined();
      expect(friendlyIntent?.action.type).toBe("attack");
      expect(friendlyIntent?.ticksRemaining).toBe(0);
    });

    it("should show preview instant attack alongside committed wind-up action", () => {
      const heavySkill = createSkill({
        id: "heavy-punch",
        tickCost: 2,
        range: 2,
        damage: 25,
      });
      const instantSkill = createSkill({
        id: "light-punch",
        tickCost: 0,
        range: 1,
        damage: 10,
      });
      const charWithAction = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [heavySkill],
        currentAction: {
          type: "attack",
          skill: heavySkill,
          targetCell: { q: 2, r: 0 },
          targetCharacter: null,
          startedAtTick: 0,
          resolvesAtTick: 2,
        },
      });
      const idleChar = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { q: 3, r: 0 },
        skills: [instantSkill],
        currentAction: null,
      });
      const target = createCharacter({
        id: "target",
        faction: "friendly",
        position: { q: 4, r: 0 },
        skills: [],
      });
      useGameStore
        .getState()
        .actions.initBattle([charWithAction, idleChar, target]);

      const result = selectIntentData(useGameStore.getState());

      expect(result).toHaveLength(2);
      const committed = result.find((r) => r.characterId === "char1");
      const preview = result.find((r) => r.characterId === "char2");
      expect(committed?.ticksRemaining).toBe(2);
      expect(preview?.ticksRemaining).toBe(0);
    });
  });
});
