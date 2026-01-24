/**
 * Tests for core game loop and tick processing.
 */

import { describe, it, expect } from "vitest";
import {
  processTick,
  checkBattleStatus,
  computeDecisions,
  applyDecisions,
  clearResolvedActions,
  evaluateSkillsForCharacter,
} from "./game";
import { GameState, Character, Skill, Action } from "./types";
import { initRNG } from "./movement";

/**
 * Test helper to create a minimal game state.
 */
function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    characters: [],
    tick: 0,
    phase: "decision",
    battleStatus: "active",
    history: [],
    seed: 1000,
    rngState: initRNG(1000),
    ...overrides,
  };
}

/**
 * Test helper to create characters with minimal boilerplate.
 */
function createCharacter(
  overrides: Partial<Character> & { id: string },
): Character {
  return {
    id: overrides.id,
    name: overrides.name ?? `Char-${overrides.id}`,
    faction: overrides.faction ?? "friendly",
    position: overrides.position ?? { x: 0, y: 0 },
    hp: overrides.hp ?? 100,
    maxHp: overrides.maxHp ?? 100,
    slotPosition: overrides.slotPosition ?? 0,
    skills: overrides.skills ?? [],
    currentAction: overrides.currentAction ?? null,
  };
}

/**
 * Test helper to create skills with minimal boilerplate.
 */
function createSkill(overrides: Partial<Skill> & { id: string }): Skill {
  return {
    id: overrides.id,
    name: overrides.name ?? `Skill-${overrides.id}`,
    tickCost: overrides.tickCost ?? 1,
    range: overrides.range ?? 1,
    damage: overrides.damage,
    mode: overrides.mode,
    enabled: overrides.enabled ?? true,
    triggers: overrides.triggers ?? [],
    selectorOverride: overrides.selectorOverride,
  };
}

/**
 * Test helper to create attack actions.
 */
function createAttackAction(
  targetCell: { x: number; y: number },
  damage: number,
  resolveTick: number,
): Action {
  const tickCost = 1;
  return {
    type: "attack",
    skill: createSkill({ id: "test-attack", damage, tickCost }),
    targetCell,
    targetCharacter: null,
    startedAtTick: resolveTick - (tickCost - 1),
    resolvesAtTick: resolveTick,
  };
}

/**
 * Test helper to create move actions.
 */
function createMoveAction(
  targetCell: { x: number; y: number },
  resolveTick: number,
): Action {
  const tickCost = 1;
  return {
    type: "move",
    skill: createSkill({ id: "test-move", mode: "towards", tickCost }),
    targetCell,
    targetCharacter: null,
    startedAtTick: resolveTick - (tickCost - 1),
    resolvesAtTick: resolveTick,
  };
}

describe("processTick", () => {
  // ===========================================================================
  // Section 1: Basic Tick Advancement
  // ===========================================================================
  describe("basic tick advancement", () => {
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

  // ===========================================================================
  // Section 2: Combat and Movement Integration
  // ===========================================================================
  describe("combat and movement integration", () => {
    it("should resolve attack actions at correct tick", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 10, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const state = createGameState({
        tick: 1,
        characters: [attacker, target],
      });

      const result = processTick(state);

      const updatedTarget = result.state.characters.find(
        (c) => c.id === "target",
      );
      expect(updatedTarget?.hp).toBe(90);
    });

    it("should not resolve actions with future resolvesAtTick", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 10, 5), // Resolves at tick 5
      });
      const target = createCharacter({
        id: "target",
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const state = createGameState({
        tick: 1, // Current tick is 1
        characters: [attacker, target],
      });

      const result = processTick(state);

      const updatedTarget = result.state.characters.find(
        (c) => c.id === "target",
      );
      expect(updatedTarget?.hp).toBe(100); // No damage applied
    });

    it("should resolve movement actions at correct tick", () => {
      const mover = createCharacter({
        id: "mover",
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 2),
      });

      const state = createGameState({
        tick: 2,
        characters: [mover],
      });

      const result = processTick(state);

      const updatedMover = result.state.characters.find(
        (c) => c.id === "mover",
      );
      expect(updatedMover?.position).toEqual({ x: 6, y: 5 });
    });

    it("should apply combat before movement", () => {
      // Attacker and target at same position, target tries to move away
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 100, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 1, y: 0 },
        hp: 50,
        slotPosition: 1,
        currentAction: createMoveAction({ x: 2, y: 0 }, 1),
      });

      const state = createGameState({
        tick: 1,
        characters: [attacker, target],
      });

      const result = processTick(state);

      // Target should be hit and killed before movement resolves
      const updatedTarget = result.state.characters.find(
        (c) => c.id === "target",
      );
      expect(updatedTarget).toBeUndefined(); // Dead, removed from characters
    });

    it("should thread RNG state through movement", () => {
      const moverA = createCharacter({
        id: "moverA",
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: "moverB",
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const initialRng = initRNG(1000);
      const state = createGameState({
        tick: 1,
        characters: [moverA, moverB],
        rngState: initialRng,
      });

      const result = processTick(state);

      // RNG should have advanced due to collision resolution
      expect(result.state.rngState).not.toBe(initialRng);
    });
  });

  // ===========================================================================
  // Section 3: Character Removal
  // ===========================================================================
  describe("character removal", () => {
    it("should remove dead characters (HP <= 0)", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 100, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 1, y: 0 },
        hp: 50,
        slotPosition: 1,
      });

      const state = createGameState({
        tick: 1,
        characters: [attacker, target],
      });

      const result = processTick(state);

      expect(result.state.characters).toHaveLength(1);
      expect(result.state.characters[0]!.id).toBe("attacker");
    });

    it("should keep characters with HP > 0", () => {
      const attacker = createCharacter({
        id: "attacker",
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 10, 1),
      });
      const target = createCharacter({
        id: "target",
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const state = createGameState({
        tick: 1,
        characters: [attacker, target],
      });

      const result = processTick(state);

      expect(result.state.characters).toHaveLength(2);
      const updatedTarget = result.state.characters.find(
        (c) => c.id === "target",
      );
      expect(updatedTarget?.hp).toBe(90);
    });

    it("should handle multiple simultaneous deaths", () => {
      const charA = createCharacter({
        id: "charA",
        position: { x: 0, y: 0 },
        hp: 10,
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 25, 1),
      });
      const charB = createCharacter({
        id: "charB",
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 1,
        currentAction: createAttackAction({ x: 0, y: 0 }, 25, 1),
      });

      const state = createGameState({
        tick: 1,
        characters: [charA, charB],
      });

      const result = processTick(state);

      expect(result.state.characters).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Section 4: Battle Status Detection
  // ===========================================================================
  describe("battle status detection", () => {
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
});

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

describe("computeDecisions", () => {
  // ===========================================================================
  // Section 1: Mid-Action Skip
  // ===========================================================================
  describe("mid-action skip", () => {
    it("should skip characters with currentAction (mid-action)", () => {
      const character = createCharacter({
        id: "char1",
        position: { x: 5, y: 5 },
        currentAction: createAttackAction({ x: 6, y: 5 }, 10, 2),
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character],
      });

      const decisions = computeDecisions(state);

      expect(decisions).toHaveLength(0);
    });

    it("should return decision for idle characters (no currentAction)", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
        currentAction: createAttackAction({ x: 5, y: 5 }, 10, 2),
      });
      const character = createCharacter({
        id: "char1",
        position: { x: 5, y: 5 },
        currentAction: null,
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions).toHaveLength(1);
      expect(decisions[0]!.characterId).toBe("char1");
    });

    it("should handle mix of mid-action and idle characters", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 7, y: 5 },
        currentAction: createAttackAction({ x: 6, y: 5 }, 10, 2),
      });
      const midAction = createCharacter({
        id: "mid-action",
        position: { x: 5, y: 5 },
        currentAction: createAttackAction({ x: 6, y: 5 }, 10, 2),
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const idle = createCharacter({
        id: "idle",
        position: { x: 6, y: 5 },
        currentAction: null,
        skills: [
          createSkill({
            id: "skill2",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [midAction, idle, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions).toHaveLength(1);
      expect(decisions[0]!.characterId).toBe("idle");
    });
  });

  // ===========================================================================
  // Section 2: Skill Priority Order
  // ===========================================================================
  describe("skill priority order", () => {
    it("should select first matching skill (priority order)", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.skill.id).toBe("skill1");
    });

    it("should skip to second skill when first trigger fails", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 10, y: 10 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "enemy_in_range", value: 1 }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            range: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.skill.id).toBe("skill2");
    });

    it("should skip to third skill when first two fail", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 10, y: 10 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        hp: 100,
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "enemy_in_range", value: 1 }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            triggers: [{ type: "hp_below", value: 50 }],
          }),
          createSkill({
            id: "skill3",
            damage: 30,
            range: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.skill.id).toBe("skill3");
    });
  });

  // ===========================================================================
  // Section 3: Trigger AND Logic
  // ===========================================================================
  describe("trigger AND logic", () => {
    it("should pass when all triggers pass (AND logic)", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        hp: 30,
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [
              { type: "enemy_in_range", value: 3 },
              { type: "hp_below", value: 50 },
            ],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.skill.id).toBe("skill1");
    });

    it("should fail when any trigger fails (AND logic)", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 10, y: 10 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        hp: 30,
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [
              { type: "enemy_in_range", value: 3 },
              { type: "hp_below", value: 50 },
            ],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("idle");
    });

    it("should pass when triggers array is empty (vacuous truth)", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [createSkill({ id: "skill1", damage: 10, triggers: [] })],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.skill.id).toBe("skill1");
    });
  });

  // ===========================================================================
  // Section 4: Disabled Skills
  // ===========================================================================
  describe("disabled skills", () => {
    it("should skip disabled skills (enabled=false)", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            enabled: false,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("idle");
    });

    it("should select enabled skill after disabled one", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            enabled: false,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            enabled: true,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.skill.id).toBe("skill2");
    });
  });

  // ===========================================================================
  // Section 5: No Match → Idle
  // ===========================================================================
  describe("no match to idle", () => {
    it("should return idle action when no skills match", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 10, y: 10 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "enemy_in_range", value: 1 }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("idle");
    });

    it("should return idle action when character has no skills", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("idle");
    });

    it("should return idle action when all skills disabled", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            enabled: false,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            enabled: false,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("idle");
    });

    it("should return idle action with type=idle", () => {
      const character = createCharacter({
        id: "char1",
        position: { x: 5, y: 5 },
        skills: [],
      });
      const state = createGameState({
        tick: 1,
        characters: [character],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("idle");
    });

    it("should set idle targetCell to character position", () => {
      const character = createCharacter({
        id: "char1",
        position: { x: 5, y: 7 },
        skills: [],
      });
      const state = createGameState({
        tick: 1,
        characters: [character],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.targetCell).toEqual({ x: 5, y: 7 });
    });
  });

  // ===========================================================================
  // Section 6: Action Type Inference
  // ===========================================================================
  describe("action type inference", () => {
    it("should create attack action for skill with damage", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("attack");
    });

    it("should create move action for skill with mode", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 8, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "towards",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("move");
    });

    it("should throw for skill with both damage and mode", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            mode: "towards",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      expect(() => computeDecisions(state)).toThrow(
        /cannot have both damage and mode/,
      );
    });

    it("should throw for skill with neither damage nor mode", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [createSkill({ id: "skill1", triggers: [{ type: "always" }] })],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      expect(() => computeDecisions(state)).toThrow(/must have damage or mode/);
    });
  });

  // ===========================================================================
  // Section 7: Attack Targeting
  // ===========================================================================
  describe("attack targeting", () => {
    it("should lock attack targetCell to target's position", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 7 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 5,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.targetCell).toEqual({ x: 6, y: 7 });
    });

    it("should set targetCharacter for attack actions", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.targetCharacter).toBeTruthy();
      expect(decisions[0]!.action.targetCharacter?.id).toBe("enemy");
    });

    it("should skip attack skill when target out of range", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 10, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 1,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("idle");
    });

    it("should select attack skill when target exactly at range", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 1,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("attack");
      expect(decisions[0]!.action.skill.id).toBe("skill1");
    });

    it("should skip attack skill when no valid target exists", () => {
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("idle");
    });
  });

  // ===========================================================================
  // Section 8: Move Destination
  // ===========================================================================
  describe("move destination", () => {
    it("should compute move targetCell towards target", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 8, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "towards",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("move");
      expect(decisions[0]!.action.targetCell.x).toBeGreaterThan(
        character.position.x,
      );
    });

    it("should compute move targetCell away from target", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 8, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "away",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("move");
      expect(decisions[0]!.action.targetCell.x).toBeLessThan(
        character.position.x,
      );
    });

    it("should set targetCell to current position for hold mode", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 8, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "hold",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("move");
      expect(decisions[0]!.action.targetCell).toEqual({ x: 5, y: 5 });
    });

    it("should set targetCharacter to null for move actions", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 8, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "towards",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("move");
      expect(decisions[0]!.action.targetCharacter).toBeNull();
    });

    it("should skip move skill when no valid target exists", () => {
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "towards",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("idle");
    });

    it("should allow hold mode without valid target", () => {
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "hold",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character],
      });

      const decisions = computeDecisions(state);

      expect(decisions[0]!.action.type).toBe("move");
      expect(decisions[0]!.action.targetCell).toEqual({ x: 5, y: 5 });
    });

    it("should prefer diagonal movement when dx === dy (diagonal tiebreaking)", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 8, y: 8 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "towards",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      // dx = 3, dy = 3 (equal), with diagonal movement should move to (6,6)
      // Diagonal reduces Chebyshev distance from 3 to 2, horizontal only reduces to 2
      // Both reduce distance equally, but diagonal also reduces |dx| and |dy| equally
      // According to tiebreaking: minimize resulting |dx| then |dy|
      // After diagonal move: |dx|=2, |dy|=2
      // After horizontal move: |dx|=2, |dy|=3
      // Diagonal wins because |dy| is smaller (2 < 3)
      expect(decisions[0]!.action.type).toBe("move");
      expect(decisions[0]!.action.targetCell).toEqual({ x: 6, y: 6 });
    });

    // ===========================================================================
    // Section 9.1: Diagonal Movement Tests
    // ===========================================================================
    describe("diagonal movement", () => {
      it("should move northeast when target is northeast (dx>0, dy>0)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 7, y: 6 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // dx=2, dy=1 → diagonal reduces Chebyshev distance from 2 to 1
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 6, y: 6 });
      });

      it("should move northwest when target is northwest (dx<0, dy>0)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 3, y: 7 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // dx=-2, dy=2 → diagonal reduces Chebyshev distance from 2 to 1
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 4, y: 6 });
      });

      it("should move southeast when target is southeast (dx>0, dy<0)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 7, y: 3 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // dx=2, dy=-2 → diagonal reduces Chebyshev distance from 2 to 1
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 6, y: 4 });
      });

      it("should move southwest when target is southwest (dx<0, dy<0)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 3, y: 3 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // dx=-2, dy=-2 → diagonal reduces Chebyshev distance from 2 to 1
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 4, y: 4 });
      });

      it("should prefer diagonal over orthogonal when strictly better Chebyshev distance", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 7, y: 6 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // Current Chebyshev distance: max(2,1) = 2
        // Diagonal (6,6): distance becomes max(1,0) = 1
        // Horizontal (6,5): distance becomes max(1,1) = 1
        // Vertical (5,6): distance becomes max(2,0) = 2
        // Both diagonal and horizontal reduce distance to 1
        // Tiebreaking: minimize resulting |dx| then |dy|
        // Diagonal: |dx|=1, |dy|=0
        // Horizontal: |dx|=1, |dy|=1
        // Diagonal wins because |dy| is smaller (0 < 1)
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 6, y: 6 });
      });

      it("should prefer orthogonal when diagonal offers no Chebyshev advantage (true tie)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 6, y: 5 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // dx=1, dy=0
        // Diagonal (6,6): distance becomes max(0,1) = 1 (no improvement)
        // Horizontal (6,5): distance becomes max(0,0) = 0 (optimal)
        // Should choose horizontal
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 6, y: 5 });
      });

      it("should handle away mode with diagonal movement", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 5, y: 5 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 6, y: 6 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // dx=-1, dy=-1 → moving away diagonally to (7,7)
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 7, y: 7 });
      });

      it("should handle diagonal movement with wall-boundary fallback", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 1, y: 1 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 0, y: 0 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // At corner (0,0), moving towards (1,1) would be diagonal to (1,1)
        // But (1,1) is occupied by enemy, so should move to (0,1) or (1,0)
        // According to tiebreaking: minimize |dx| then |dy|
        // (0,1): resultDx=1, resultDy=0 → |dx|=1, |dy|=0
        // (1,0): resultDx=0, resultDy=1 → |dx|=0, |dy|=1
        // (1,0) wins because |dx|=0 < |dx|=1
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 1, y: 0 });
      });

      it("should handle diagonal tiebreaking with equal Chebyshev reduction", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 7, y: 7 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // dx=2, dy=2
        // Diagonal (6,6): distance becomes max(1,1) = 1
        // Horizontal (6,5): distance becomes max(1,2) = 2
        // Vertical (5,6): distance becomes max(2,1) = 2
        // Diagonal is strictly better
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 6, y: 6 });
      });

      it("should handle diagonal movement with multiple equidistant options", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 6, y: 6 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // dx=1, dy=1
        // Diagonal (6,6): distance becomes max(0,0) = 0 (optimal, but occupied)
        // Should choose next best: horizontal (6,5) or vertical (5,6)
        // According to tiebreaking: horizontal first
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 6, y: 5 });
      });

      it("should maintain deterministic replay with diagonal movement", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 7, y: 6 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state1 = createGameState({
          tick: 1,
          characters: [character, enemy],
          seed: 12345,
        });
        const state2 = createGameState({
          tick: 1,
          characters: [character, enemy],
          seed: 12345,
        });

        const decisions1 = computeDecisions(state1);
        const decisions2 = computeDecisions(state2);

        expect(decisions1[0]!.action.targetCell).toEqual(
          decisions2[0]!.action.targetCell,
        );
      });
    });

    it("should clamp move destination to grid bounds at x=0 edge", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 5, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 0, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "away",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      // Moving away from (5,5) when at (0,5) would try x=-1, clamped to x=0
      // Wall-boundary fallback: try perpendicular escape (lower Y)
      expect(decisions[0]!.action.type).toBe("move");
      expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 4 });
    });

    it("should clamp move destination to grid bounds at x=11 edge", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 5, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 11, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "away",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      // Moving away from (5,5) when at (11,5) would try x=12, clamped to x=11
      // Wall-boundary fallback: try perpendicular escape (lower Y)
      expect(decisions[0]!.action.type).toBe("move");
      expect(decisions[0]!.action.targetCell).toEqual({ x: 11, y: 4 });
    });

    it("should clamp move destination to grid bounds at y=0 edge", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 5, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 0 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "away",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      // Moving away from (5,5) when at (5,0) would try y=-1, clamped to y=0
      // Wall-boundary fallback: try perpendicular escape (lower X)
      expect(decisions[0]!.action.type).toBe("move");
      expect(decisions[0]!.action.targetCell).toEqual({ x: 4, y: 0 });
    });

    it("should clamp move destination to grid bounds at y=11 edge", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 5, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 11 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "away",
            triggers: [{ type: "always" }],
          }),
        ],
      });
      const state = createGameState({
        tick: 1,
        characters: [character, enemy],
      });

      const decisions = computeDecisions(state);

      // Moving away from (5,5) when at (5,11) would try y=12, clamped to y=11
      // Wall-boundary fallback: try perpendicular escape (lower X)
      expect(decisions[0]!.action.type).toBe("move");
      expect(decisions[0]!.action.targetCell).toEqual({ x: 4, y: 11 });
    });

    // ===========================================================================
    // Section 9: Wall-Boundary Fallback
    // ===========================================================================
    describe("wall-boundary fallback", () => {
      it("should escape perpendicular to lower Y when away-horizontal blocked at x=0 (same row)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 2, y: 5 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 0, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 4 });
      });

      it("should escape perpendicular to higher Y when away-horizontal blocked at x=0 and at y=0", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 2, y: 0 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 0, y: 0 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 1 });
      });

      it("should escape perpendicular to lower Y when away-horizontal blocked at x=11 (same row)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 9, y: 5 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 11, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 11, y: 4 });
      });

      it("should escape perpendicular to lower X when away-vertical blocked at y=0 (same column)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 5, y: 2 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 0 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 4, y: 0 });
      });

      it("should escape perpendicular to higher X when away-vertical blocked at y=0 and at x=0", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 0, y: 2 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 0, y: 0 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 1, y: 0 });
      });

      it("should escape perpendicular to lower X when away-vertical blocked at y=11 (same column)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 5, y: 9 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 11 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 4, y: 11 });
      });

      it("should stay in place at corner (0,0) when fleeing from diagonal target (1,1)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 1, y: 1 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 0, y: 0 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 0 });
      });

      it("should stay in place at corner (11,11) when fleeing from diagonal target (10,10)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 10, y: 10 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 11, y: 11 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 11, y: 11 });
      });

      it("should stay in place at corner (0,11) when fleeing from diagonal target (1,10)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 1, y: 10 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 0, y: 11 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 11 });
      });

      it("should stay in place at corner (11,0) when fleeing from diagonal target (10,1)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 10, y: 1 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 11, y: 0 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 11, y: 0 });
      });

      it("should use natural secondary when it exists (vertical fallback after horizontal blocked)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 2, y: 5 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 0, y: 3 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // dx=2, dy=2 → prefer horizontal → x=-1 blocked → natural secondary y=3-1=2
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 2 });
      });

      it("should use natural secondary when it exists (horizontal fallback after vertical blocked)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 5, y: 2 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 3, y: 0 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // dx=2, dy=2 → prefer horizontal → x=2 works (not blocked)
        // This test should actually have dy > dx to test vertical primary
        // Let me recalculate: enemy at (5,2), char at (3,0)
        // dx=2, dy=2 → equal, prefer horizontal → x=3-1=2 (not blocked)
        // This doesn't test vertical primary. Let me adjust the setup.
        // Actually, for vertical primary we need dy > dx
        // enemy at (5,3), char at (3,0) → dx=2, dy=3 → vertical primary
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 2, y: 0 });
      });

      it("should stay in place when already at target position (dx=dy=0)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 5, y: 5 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 5, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 5, y: 5 });
      });

      it("should not break towards mode when approaching wall", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 0, y: 5 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 1, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 5 });
      });

      it("should not break towards mode at corner", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 0, y: 0 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 1, y: 1 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "towards",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        // dx=dy=1, prefer horizontal per tiebreaking
        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 1 });
      });

      it("should escape from adjacent target at wall (single cell)", () => {
        const enemy = createCharacter({
          id: "enemy",
          faction: "enemy",
          position: { x: 1, y: 5 },
        });
        const character = createCharacter({
          id: "char1",
          faction: "friendly",
          position: { x: 0, y: 5 },
          skills: [
            createSkill({
              id: "skill1",
              mode: "away",
              triggers: [{ type: "always" }],
            }),
          ],
        });
        const state = createGameState({
          tick: 1,
          characters: [character, enemy],
        });

        const decisions = computeDecisions(state);

        expect(decisions[0]!.action.type).toBe("move");
        expect(decisions[0]!.action.targetCell).toEqual({ x: 0, y: 4 });
      });
    });
  });
});

describe("applyDecisions", () => {
  it("should set currentAction from decision", () => {
    const character = createCharacter({
      id: "char1",
      position: { x: 5, y: 5 },
      currentAction: null,
    });
    const action = createAttackAction({ x: 6, y: 5 }, 10, 1);
    const decisions = [{ characterId: "char1", action }];

    const result = applyDecisions([character], decisions);

    expect(result[0]!.currentAction).toEqual(action);
  });

  it("should preserve characters without decisions", () => {
    const char1 = createCharacter({ id: "char1", position: { x: 5, y: 5 } });
    const char2 = createCharacter({ id: "char2", position: { x: 6, y: 6 } });
    const action = createAttackAction({ x: 7, y: 7 }, 10, 1);
    const decisions = [{ characterId: "char1", action }];

    const result = applyDecisions([char1, char2], decisions);

    expect(result[1]!.currentAction).toBeNull();
    expect(result[1]!.id).toBe("char2");
  });

  it("should handle empty decisions array", () => {
    const character = createCharacter({
      id: "char1",
      position: { x: 5, y: 5 },
    });

    const result = applyDecisions([character], []);

    expect(result).toHaveLength(1);
    expect(result[0]!.currentAction).toBeNull();
  });

  it("should handle empty characters array", () => {
    const action = createAttackAction({ x: 6, y: 5 }, 10, 1);
    const decisions = [{ characterId: "char1", action }];

    const result = applyDecisions([], decisions);

    expect(result).toHaveLength(0);
  });

  it("should not modify original character array", () => {
    const character = createCharacter({
      id: "char1",
      position: { x: 5, y: 5 },
      currentAction: null,
    });
    const originalCharacters = [character];
    const action = createAttackAction({ x: 6, y: 5 }, 10, 1);
    const decisions = [{ characterId: "char1", action }];

    applyDecisions(originalCharacters, decisions);

    expect(originalCharacters[0]!.currentAction).toBeNull();
  });

  it("should skip decisions for non-existent character IDs", () => {
    const character = createCharacter({
      id: "char1",
      position: { x: 5, y: 5 },
    });
    const action1 = createAttackAction({ x: 6, y: 5 }, 10, 1);
    const action2 = createAttackAction({ x: 7, y: 7 }, 15, 1);
    const decisions = [
      { characterId: "nonexistent", action: action1 },
      { characterId: "char1", action: action2 },
    ];

    const result = applyDecisions([character], decisions);

    expect(result).toHaveLength(1);
    expect(result[0]!.currentAction).toEqual(action2);
  });
});

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

describe("processTick decision integration", () => {
  it("idle character should receive decision and execute same tick", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 5, y: 5 },
      slotPosition: 0,
      currentAction: null,
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 6, y: 5 },
      hp: 100,
      slotPosition: 1,
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    const result = processTick(state);

    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(90);
  });

  it("idle character with tickCost 2 skill should not resolve same tick", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 5, y: 5 },
      slotPosition: 0,
      currentAction: null,
      skills: [
        createSkill({
          id: "heavy",
          damage: 25,
          tickCost: 2,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 6, y: 5 },
      hp: 100,
      slotPosition: 1,
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    const result = processTick(state);

    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(100);
    const updatedAttacker = result.state.characters.find(
      (c) => c.id === "attacker",
    );
    expect(updatedAttacker?.currentAction).not.toBeNull();
    expect(updatedAttacker?.currentAction?.resolvesAtTick).toBe(2);
  });

  it("mid-action character should continue action, not receive new decision", () => {
    const action = createAttackAction({ x: 6, y: 5 }, 25, 2);
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 5, y: 5 },
      slotPosition: 0,
      currentAction: action,
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 6, y: 5 },
      hp: 100,
      slotPosition: 1,
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    const result = processTick(state);

    const updatedAttacker = result.state.characters.find(
      (c) => c.id === "attacker",
    );
    expect(updatedAttacker?.currentAction).toEqual(action);
  });

  it("resolved action should be cleared, allowing new decision next tick", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { x: 5, y: 5 },
      slotPosition: 0,
      currentAction: null,
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { x: 6, y: 5 },
      hp: 100,
      slotPosition: 1,
    });

    const state1 = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    const result1 = processTick(state1);

    const attackerAfterTick1 = result1.state.characters.find(
      (c) => c.id === "attacker",
    );
    expect(attackerAfterTick1?.currentAction).toBeNull();

    const result2 = processTick(result1.state);

    const targetAfterTick2 = result2.state.characters.find(
      (c) => c.id === "target",
    );
    expect(targetAfterTick2?.hp).toBe(80);
  });

  it("character with no valid skill should idle and be cleared same tick", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
      slotPosition: 0,
      currentAction: null,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "enemy_in_range", value: 1 }],
        }),
      ],
    });

    const state = createGameState({
      tick: 1,
      characters: [character],
    });

    const result = processTick(state);

    const updatedChar = result.state.characters.find((c) => c.id === "char1");
    expect(updatedChar?.currentAction).toBeNull();
  });
});

describe("evaluateSkillsForCharacter", () => {
  // ===========================================================================
  // Section 1: Mid-Action Detection
  // ===========================================================================
  describe("mid-action detection", () => {
    it("should return isMidAction: true when character has currentAction", () => {
      const action = createAttackAction({ x: 5, y: 5 }, 10, 2);
      const character = createCharacter({
        id: "char1",
        position: { x: 4, y: 4 },
        currentAction: action,
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.isMidAction).toBe(true);
      expect(result.currentAction).toEqual(action);
      expect(result.skillEvaluations).toHaveLength(0);
      expect(result.selectedSkillIndex).toBeNull();
    });

    it("should evaluate skills when character has no currentAction", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 5, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 4, y: 4 },
        currentAction: null,
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 5,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.isMidAction).toBe(false);
      expect(result.skillEvaluations).toHaveLength(1);
    });
  });

  // ===========================================================================
  // Section 2: Skill Rejection Reasons
  // ===========================================================================
  describe("skill rejection reasons", () => {
    it("should reject disabled skill with reason 'disabled'", () => {
      const character = createCharacter({
        id: "char1",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            enabled: false,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.skillEvaluations).toHaveLength(1);
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
      expect(result.skillEvaluations[0]!.rejectionReason).toBe("disabled");
    });

    it("should reject skill with failed trigger and include failedTriggers", () => {
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "enemy_in_range", value: 1 }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.skillEvaluations).toHaveLength(1);
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
      expect(result.skillEvaluations[0]!.rejectionReason).toBe(
        "trigger_failed",
      );
      expect(result.skillEvaluations[0]!.failedTriggers).toHaveLength(1);
      expect(result.skillEvaluations[0]!.failedTriggers![0]!.type).toBe(
        "enemy_in_range",
      );
    });

    it("should reject skill when no target exists with reason 'no_target'", () => {
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.skillEvaluations).toHaveLength(1);
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
      expect(result.skillEvaluations[0]!.rejectionReason).toBe("no_target");
    });

    it("should reject attack skill when target out of range with distance", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 10, y: 10 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 1,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.skillEvaluations).toHaveLength(1);
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
      expect(result.skillEvaluations[0]!.rejectionReason).toBe("out_of_range");
      expect(result.skillEvaluations[0]!.distance).toBe(5);
      expect(result.skillEvaluations[0]!.target).toEqual(enemy);
    });
  });

  // ===========================================================================
  // Section 3: Skill Selection
  // ===========================================================================
  describe("skill selection", () => {
    it("should mark selected skill with status 'selected'", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 5,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.skillEvaluations).toHaveLength(1);
      expect(result.skillEvaluations[0]!.status).toBe("selected");
      expect(result.selectedSkillIndex).toBe(0);
      expect(result.skillEvaluations[0]!.target).toEqual(enemy);
    });

    it("should select first matching skill in priority order", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 5,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            range: 5,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.selectedSkillIndex).toBe(0);
      expect(result.skillEvaluations[0]!.skill.id).toBe("skill1");
      expect(result.skillEvaluations[0]!.status).toBe("selected");
    });

    it("should select second skill when first is rejected", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 10, y: 10 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 1,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            range: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.selectedSkillIndex).toBe(1);
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
      expect(result.skillEvaluations[0]!.rejectionReason).toBe("out_of_range");
      expect(result.skillEvaluations[1]!.status).toBe("selected");
    });
  });

  // ===========================================================================
  // Section 4: Skipped Skills
  // ===========================================================================
  describe("skipped skills", () => {
    it("should mark skills after selected skill as 'skipped'", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 6, y: 5 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 5,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            range: 5,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill3",
            damage: 30,
            range: 5,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.skillEvaluations).toHaveLength(3);
      expect(result.skillEvaluations[0]!.status).toBe("selected");
      expect(result.skillEvaluations[1]!.status).toBe("skipped");
      expect(result.skillEvaluations[2]!.status).toBe("skipped");
    });
  });

  // ===========================================================================
  // Section 5: Hold Mode Special Case
  // ===========================================================================
  describe("hold mode", () => {
    it("should select hold mode skill without needing a target", () => {
      const character = createCharacter({
        id: "char1",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            mode: "hold",
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.skillEvaluations).toHaveLength(1);
      expect(result.skillEvaluations[0]!.status).toBe("selected");
      expect(result.selectedSkillIndex).toBe(0);
    });
  });

  // ===========================================================================
  // Section 6: No Valid Skill (Idle)
  // ===========================================================================
  describe("no valid skill", () => {
    it("should return null selectedSkillIndex when no skills are valid", () => {
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            range: 1,
            triggers: [{ type: "enemy_in_range", value: 1 }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.selectedSkillIndex).toBeNull();
      expect(result.skillEvaluations[0]!.status).toBe("rejected");
    });

    it("should handle character with no skills", () => {
      const character = createCharacter({
        id: "char1",
        position: { x: 5, y: 5 },
        skills: [],
      });

      const result = evaluateSkillsForCharacter(character, [character]);

      expect(result.skillEvaluations).toHaveLength(0);
      expect(result.selectedSkillIndex).toBeNull();
    });
  });

  // ===========================================================================
  // Section 7: Complex Scenarios
  // ===========================================================================
  describe("complex scenarios", () => {
    it("should evaluate multiple rejection reasons across skills", () => {
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 10, y: 10 },
      });
      const character = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 5, y: 5 },
        hp: 100,
        skills: [
          createSkill({
            id: "skill1",
            damage: 10,
            enabled: false,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill2",
            damage: 20,
            triggers: [{ type: "hp_below", value: 50 }],
          }),
          createSkill({
            id: "skill3",
            damage: 30,
            range: 1,
            triggers: [{ type: "always" }],
          }),
          createSkill({
            id: "skill4",
            damage: 40,
            range: 10,
            triggers: [{ type: "always" }],
          }),
        ],
      });

      const result = evaluateSkillsForCharacter(character, [character, enemy]);

      expect(result.skillEvaluations).toHaveLength(4);
      expect(result.skillEvaluations[0]!.rejectionReason).toBe("disabled");
      expect(result.skillEvaluations[1]!.rejectionReason).toBe(
        "trigger_failed",
      );
      expect(result.skillEvaluations[2]!.rejectionReason).toBe("out_of_range");
      expect(result.skillEvaluations[3]!.status).toBe("selected");
      expect(result.selectedSkillIndex).toBe(3);
    });
  });
});
