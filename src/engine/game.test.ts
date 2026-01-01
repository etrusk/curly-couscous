/**
 * Tests for core game loop and tick processing.
 */

import { describe, it, expect } from 'vitest';
import { processTick, checkBattleStatus } from './game';
import { GameState, Character, Skill, Action } from './types';
import { initRNG } from './movement';

/**
 * Test helper to create a minimal game state.
 */
function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    characters: [],
    tick: 0,
    phase: 'decision',
    battleStatus: 'active',
    history: [],
    seed: 1000,
    rngState: initRNG(1000),
    ...overrides,
  };
}

/**
 * Test helper to create characters with minimal boilerplate.
 */
function createCharacter(overrides: Partial<Character> & { id: string }): Character {
  return {
    id: overrides.id,
    name: overrides.name ?? `Char-${overrides.id}`,
    faction: overrides.faction ?? 'friendly',
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
  resolveTick: number
): Action {
  const tickCost = 1;
  return {
    type: 'attack',
    skill: createSkill({ id: 'test-attack', damage, tickCost }),
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
  resolveTick: number
): Action {
  const tickCost = 1;
  return {
    type: 'move',
    skill: createSkill({ id: 'test-move', mode: 'towards', tickCost }),
    targetCell,
    targetCharacter: null,
    startedAtTick: resolveTick - (tickCost - 1),
    resolvesAtTick: resolveTick,
  };
}

describe('processTick', () => {
  // ===========================================================================
  // Section 1: Basic Tick Advancement
  // ===========================================================================
  describe('basic tick advancement', () => {
    it('should increment tick by 1', () => {
      const state = createGameState({
        tick: 5,
        characters: [createCharacter({ id: 'char1' })],
      });

      const result = processTick(state);

      expect(result.state.tick).toBe(6);
    });

    it('should generate tick event', () => {
      const state = createGameState({
        tick: 3,
        characters: [createCharacter({ id: 'char1' })],
      });

      const result = processTick(state);

      const tickEvent = result.events.find(e => e.type === 'tick');
      expect(tickEvent).toBeDefined();
      expect(tickEvent).toMatchObject({
        type: 'tick',
        tick: 3,
        phase: 'resolution',
      });
    });

    it('should append events to history', () => {
      const state = createGameState({
        tick: 0,
        characters: [createCharacter({ id: 'char1' })],
        history: [],
      });

      const result = processTick(state);

      expect(result.state.history.length).toBeGreaterThan(0);
      expect(result.state.history[0].type).toBe('tick');
    });
  });

  // ===========================================================================
  // Section 2: Combat and Movement Integration
  // ===========================================================================
  describe('combat and movement integration', () => {
    it('should resolve attack actions at correct tick', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 10, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const state = createGameState({
        tick: 1,
        characters: [attacker, target],
      });

      const result = processTick(state);

      const updatedTarget = result.state.characters.find(c => c.id === 'target');
      expect(updatedTarget?.hp).toBe(90);
    });

    it('should not resolve actions with future resolvesAtTick', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 10, 5), // Resolves at tick 5
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const state = createGameState({
        tick: 1, // Current tick is 1
        characters: [attacker, target],
      });

      const result = processTick(state);

      const updatedTarget = result.state.characters.find(c => c.id === 'target');
      expect(updatedTarget?.hp).toBe(100); // No damage applied
    });

    it('should resolve movement actions at correct tick', () => {
      const mover = createCharacter({
        id: 'mover',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 2),
      });

      const state = createGameState({
        tick: 2,
        characters: [mover],
      });

      const result = processTick(state);

      const updatedMover = result.state.characters.find(c => c.id === 'mover');
      expect(updatedMover?.position).toEqual({ x: 6, y: 5 });
    });

    it('should apply combat before movement', () => {
      // Attacker and target at same position, target tries to move away
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 100, 1),
      });
      const target = createCharacter({
        id: 'target',
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
      const updatedTarget = result.state.characters.find(c => c.id === 'target');
      expect(updatedTarget).toBeUndefined(); // Dead, removed from characters
    });

    it('should thread RNG state through movement', () => {
      const moverA = createCharacter({
        id: 'moverA',
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: 'moverB',
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
  describe('character removal', () => {
    it('should remove dead characters (HP <= 0)', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 100, 1),
      });
      const target = createCharacter({
        id: 'target',
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
      expect(result.state.characters[0].id).toBe('attacker');
    });

    it('should keep characters with HP > 0', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 10, 1),
      });
      const target = createCharacter({
        id: 'target',
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
      const updatedTarget = result.state.characters.find(c => c.id === 'target');
      expect(updatedTarget?.hp).toBe(90);
    });

    it('should handle multiple simultaneous deaths', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        hp: 10,
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 25, 1),
      });
      const charB = createCharacter({
        id: 'charB',
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
  describe('battle status detection', () => {
    it('should detect victory when all enemies eliminated', () => {
      const friendly = createCharacter({
        id: 'friendly',
        faction: 'friendly',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 100, 1),
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 1, y: 0 },
        hp: 50,
        slotPosition: 1,
      });

      const state = createGameState({
        tick: 1,
        characters: [friendly, enemy],
      });

      const result = processTick(state);

      expect(result.state.battleStatus).toBe('victory');
    });

    it('should detect defeat when all friendlies eliminated', () => {
      const friendly = createCharacter({
        id: 'friendly',
        faction: 'friendly',
        position: { x: 0, y: 0 },
        hp: 50,
        slotPosition: 0,
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 1, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 0, y: 0 }, 100, 1),
      });

      const state = createGameState({
        tick: 1,
        characters: [friendly, enemy],
      });

      const result = processTick(state);

      expect(result.state.battleStatus).toBe('defeat');
    });

    it('should detect draw when mutual elimination occurs', () => {
      const friendly = createCharacter({
        id: 'friendly',
        faction: 'friendly',
        position: { x: 0, y: 0 },
        hp: 10,
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, 25, 1),
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
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

      expect(result.state.battleStatus).toBe('draw');
    });

    it('should remain active when both factions have characters', () => {
      const friendly = createCharacter({
        id: 'friendly',
        faction: 'friendly',
        position: { x: 0, y: 0 },
        slotPosition: 0,
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 5 },
        slotPosition: 1,
      });

      const state = createGameState({
        tick: 1,
        characters: [friendly, enemy],
      });

      const result = processTick(state);

      expect(result.state.battleStatus).toBe('active');
    });
  });
});

describe('checkBattleStatus', () => {
  it('should return victory when only friendlies remain', () => {
    const characters = [
      createCharacter({ id: 'friendly1', faction: 'friendly' }),
      createCharacter({ id: 'friendly2', faction: 'friendly' }),
    ];

    expect(checkBattleStatus(characters)).toBe('victory');
  });

  it('should return defeat when only enemies remain', () => {
    const characters = [
      createCharacter({ id: 'enemy1', faction: 'enemy' }),
      createCharacter({ id: 'enemy2', faction: 'enemy' }),
    ];

    expect(checkBattleStatus(characters)).toBe('defeat');
  });

  it('should return draw when no characters remain', () => {
    expect(checkBattleStatus([])).toBe('draw');
  });

  it('should return active when both factions present', () => {
    const characters = [
      createCharacter({ id: 'friendly1', faction: 'friendly' }),
      createCharacter({ id: 'enemy1', faction: 'enemy' }),
    ];

    expect(checkBattleStatus(characters)).toBe('active');
  });
});
