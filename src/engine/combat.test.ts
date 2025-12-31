/**
 * Tests for combat resolution.
 * Follows test design document: docs/test-design-combat.md
 */

import { describe, it, expect } from 'vitest';
import { resolveCombat } from './combat';
import { Character, Skill, Action, Position } from './types';

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
 * Test helper to create attack actions with minimal boilerplate.
 */
function createAttackAction(
  targetCell: Position,
  targetCharacter: Character | null = null,
  damage: number | undefined,
  ticksRemaining: number = 1
): Action {
  return {
    type: 'attack',
    skill: createSkill({ id: 'test-attack', damage }),
    targetCell,
    targetCharacter,
    ticksRemaining,
  };
}

/**
 * Test helper to create move actions.
 */
function createMoveAction(
  targetCell: Position,
  ticksRemaining: number = 1
): Action {
  return {
    type: 'move',
    skill: createSkill({ id: 'test-move', mode: 'towards' }),
    targetCell,
    targetCharacter: null,
    ticksRemaining,
  };
}

/**
 * Test helper to create idle actions.
 */
function createIdleAction(): Action {
  return {
    type: 'idle',
    skill: createSkill({ id: 'idle' }),
    targetCell: { x: 0, y: 0 },
    targetCharacter: null,
    ticksRemaining: 1,
  };
}

describe('resolveCombat', () => {
  // =========================================================================
  // Section 1: Basic Attack Hit
  // =========================================================================
  describe('basic attack hit', () => {
    it('should hit target when target is in locked cell', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      const updatedTarget = result.updatedCharacters.find(c => c.id === 'target');
      expect(updatedTarget?.hp).toBe(90);
    });

    it('should apply correct damage from skill', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      const updatedTarget = result.updatedCharacters.find(c => c.id === 'target');
      expect(updatedTarget?.hp).toBe(90);
    });

    it('should generate DamageEvent on hit', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      const damageEvent = result.events.find(e => e.type === 'damage');
      expect(damageEvent).toBeDefined();
      expect(damageEvent).toMatchObject({
        type: 'damage',
        sourceId: 'attacker',
        targetId: 'target',
        damage: 10,
        resultingHp: 90,
      });
    });

    it('should include correct tick in DamageEvent', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 5);

      const damageEvent = result.events.find(e => e.type === 'damage');
      expect(damageEvent).toBeDefined();
      expect(damageEvent?.tick).toBe(5);
    });

    it('should handle Heavy Punch damage correctly', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      const updatedTarget = result.updatedCharacters.find(c => c.id === 'target');
      expect(updatedTarget?.hp).toBe(75);
    });
  });

  // =========================================================================
  // Section 2: Attack Miss
  // =========================================================================
  describe('attack miss', () => {
    it('should miss when no character in target cell', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 2, y: 0 }, // Not in target cell
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      const updatedTarget = result.updatedCharacters.find(c => c.id === 'target');
      expect(updatedTarget?.hp).toBe(100); // No damage
    });

    it('should not generate DamageEvent on miss', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });

      const result = resolveCombat([attacker], 1);

      const damageEvents = result.events.filter(e => e.type === 'damage');
      expect(damageEvents).toHaveLength(0);
    });

    it('should not modify any HP on miss', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        hp: 50,
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const bystander = createCharacter({
        id: 'bystander',
        position: { x: 3, y: 3 },
        hp: 75,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, bystander], 1);

      expect(result.updatedCharacters.find(c => c.id === 'attacker')?.hp).toBe(50);
      expect(result.updatedCharacters.find(c => c.id === 'bystander')?.hp).toBe(75);
    });
  });

  // =========================================================================
  // Section 3: Bodyblocking (Cell-Only Targeting)
  // =========================================================================
  describe('bodyblocking (cell-only targeting)', () => {
    it('should hit different character who moved into target cell', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const originalTarget = createCharacter({
        id: 'originalTarget',
        position: { x: 2, y: 0 }, // Moved away from (1,0)
        hp: 100,
        slotPosition: 1,
      });
      const bodyBlocker = createCharacter({
        id: 'bodyBlocker',
        position: { x: 1, y: 0 }, // Now in target cell
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attacker, originalTarget, bodyBlocker], 1);

      expect(result.updatedCharacters.find(c => c.id === 'originalTarget')?.hp).toBe(100);
      expect(result.updatedCharacters.find(c => c.id === 'bodyBlocker')?.hp).toBe(90);
    });

    it('should allow ally to bodyblock for teammate', () => {
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 5, y: 5 }, null, 10, 1),
      });
      const woundedAlly = createCharacter({
        id: 'woundedAlly',
        faction: 'friendly',
        position: { x: 6, y: 5 }, // Moved away from (5,5)
        hp: 5,
        slotPosition: 1,
      });
      const heroicAlly = createCharacter({
        id: 'heroicAlly',
        faction: 'friendly',
        position: { x: 5, y: 5 }, // Bodyblocking at (5,5)
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([enemy, woundedAlly, heroicAlly], 1);

      expect(result.updatedCharacters.find(c => c.id === 'woundedAlly')?.hp).toBe(5);
      expect(result.updatedCharacters.find(c => c.id === 'heroicAlly')?.hp).toBe(90);
    });

    it('should generate DamageEvent with actual target hit', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const actualTarget = createCharacter({
        id: 'actualTarget',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, actualTarget], 1);

      const damageEvent = result.events.find(e => e.type === 'damage');
      expect(damageEvent).toBeDefined();
      expect(damageEvent).toMatchObject({
        targetId: 'actualTarget',
      });
    });

    it('should hit self if attacker moves into own target cell', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 3, y: 3 }, // Now at target cell
        slotPosition: 0,
        hp: 100,
        currentAction: createAttackAction({ x: 3, y: 3 }, null, 10, 1),
      });

      const result = resolveCombat([attacker], 1);

      expect(result.updatedCharacters.find(c => c.id === 'attacker')?.hp).toBe(90);
    });
  });

  // =========================================================================
  // Section 4: Multiple Attacks Same Target
  // =========================================================================
  describe('multiple attacks same target', () => {
    it('should apply damage from multiple attackers to same target', () => {
      const attackerA = createCharacter({
        id: 'attackerA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 10, 1),
      });
      const attackerB = createCharacter({
        id: 'attackerB',
        position: { x: 1, y: 1 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 25, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 2, y: 2 },
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attackerA, attackerB, target], 1);

      expect(result.updatedCharacters.find(c => c.id === 'target')?.hp).toBe(65); // 100 - 10 - 25
    });

    it('should generate separate DamageEvents for each attacker', () => {
      const attackerA = createCharacter({
        id: 'attackerA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 10, 1),
      });
      const attackerB = createCharacter({
        id: 'attackerB',
        position: { x: 1, y: 1 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 25, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 2, y: 2 },
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attackerA, attackerB, target], 1);

      const damageEvents = result.events.filter(e => e.type === 'damage');
      expect(damageEvents).toHaveLength(2);
    });

    it('should show cumulative HP in sequential DamageEvents', () => {
      const attackerA = createCharacter({
        id: 'attackerA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 10, 1),
      });
      const attackerB = createCharacter({
        id: 'attackerB',
        position: { x: 1, y: 1 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 2, y: 2 }, null, 25, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 2, y: 2 },
        hp: 100,
        slotPosition: 2,
      });

      const result = resolveCombat([attackerA, attackerB, target], 1);

      const damageEvents = result.events.filter(e => e.type === 'damage');
      expect(damageEvents[0]).toMatchObject({ damage: 10, resultingHp: 90 });
      expect(damageEvents[1]).toMatchObject({ damage: 25, resultingHp: 65 });
    });

    it('should handle three attackers on same target', () => {
      const attackerA = createCharacter({
        id: 'attackerA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 3, y: 3 }, null, 10, 1),
      });
      const attackerB = createCharacter({
        id: 'attackerB',
        position: { x: 1, y: 1 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 3, y: 3 }, null, 10, 1),
      });
      const attackerC = createCharacter({
        id: 'attackerC',
        position: { x: 2, y: 2 },
        slotPosition: 2,
        currentAction: createAttackAction({ x: 3, y: 3 }, null, 25, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 3, y: 3 },
        hp: 100,
        slotPosition: 3,
      });

      const result = resolveCombat([attackerA, attackerB, attackerC, target], 1);

      expect(result.updatedCharacters.find(c => c.id === 'target')?.hp).toBe(55); // 100 - 10 - 10 - 25
    });
  });

  // =========================================================================
  // Section 5: Death Detection
  // =========================================================================
  describe('death detection', () => {
    it('should generate DeathEvent when HP reaches exactly 0', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      const deathEvent = result.events.find(e => e.type === 'death');
      expect(deathEvent).toBeDefined();
      expect(deathEvent).toMatchObject({
        type: 'death',
        characterId: 'target',
      });
    });

    it('should generate DeathEvent when HP goes negative', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find(c => c.id === 'target')?.hp).toBe(-15);
      const deathEvent = result.events.find(e => e.type === 'death');
      expect(deathEvent).toBeDefined();
    });

    it('should include correct characterId in DeathEvent', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 100, 1),
      });
      const target = createCharacter({
        id: 'char-1',
        position: { x: 1, y: 0 },
        hp: 50,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      const deathEvent = result.events.find(e => e.type === 'death');
      expect(deathEvent).toMatchObject({
        characterId: 'char-1',
      });
    });

    it('should include correct tick in DeathEvent', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 100, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 50,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 3);

      const deathEvent = result.events.find(e => e.type === 'death');
      expect(deathEvent?.tick).toBe(3);
    });

    it('should not generate DeathEvent when HP remains positive', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find(c => c.id === 'target')?.hp).toBe(75);
      const deathEvents = result.events.filter(e => e.type === 'death');
      expect(deathEvents).toHaveLength(0);
    });

    it('should generate DeathEvent after DamageEvent in events array', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 100, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 50,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      const damageEventIndex = result.events.findIndex(e => e.type === 'damage');
      const deathEventIndex = result.events.findIndex(e => e.type === 'death');
      expect(damageEventIndex).toBeGreaterThanOrEqual(0);
      expect(deathEventIndex).toBeGreaterThan(damageEventIndex);
    });

    it('should keep dead characters in returned array', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 100, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 50,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters).toHaveLength(2);
      const deadChar = result.updatedCharacters.find(c => c.id === 'target');
      expect(deadChar).toBeDefined();
      expect(deadChar!.hp).toBeLessThanOrEqual(0);
    });
  });

  // =========================================================================
  // Section 6: Simultaneous Kills (Mutual Elimination)
  // =========================================================================
  describe('simultaneous kills (mutual elimination)', () => {
    it('should allow both characters to die on same tick', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        hp: 10,
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const charB = createCharacter({
        id: 'charB',
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 1,
        currentAction: createAttackAction({ x: 0, y: 0 }, null, 25, 1),
      });

      const result = resolveCombat([charA, charB], 1);

      expect(result.updatedCharacters.find(c => c.id === 'charA')?.hp).toBeLessThanOrEqual(0);
      expect(result.updatedCharacters.find(c => c.id === 'charB')?.hp).toBeLessThanOrEqual(0);
    });

    it('should generate DeathEvents for both characters', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        hp: 10,
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const charB = createCharacter({
        id: 'charB',
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 1,
        currentAction: createAttackAction({ x: 0, y: 0 }, null, 25, 1),
      });

      const result = resolveCombat([charA, charB], 1);

      const deathEvents = result.events.filter(e => e.type === 'death');
      expect(deathEvents).toHaveLength(2);
    });

    it('should apply damage from dying character', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        hp: 10,
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const charB = createCharacter({
        id: 'charB',
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 1,
        currentAction: createAttackAction({ x: 0, y: 0 }, null, 25, 1),
      });

      const result = resolveCombat([charA, charB], 1);

      // Both should have taken damage
      expect(result.updatedCharacters.find(c => c.id === 'charA')?.hp).toBe(-15);
      expect(result.updatedCharacters.find(c => c.id === 'charB')?.hp).toBe(-15);
    });

    it('should handle three-way mutual kill', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        hp: 10,
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const charB = createCharacter({
        id: 'charB',
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 1,
        currentAction: createAttackAction({ x: 2, y: 0 }, null, 25, 1),
      });
      const charC = createCharacter({
        id: 'charC',
        position: { x: 2, y: 0 },
        hp: 10,
        slotPosition: 2,
        currentAction: createAttackAction({ x: 0, y: 0 }, null, 25, 1),
      });

      const result = resolveCombat([charA, charB, charC], 1);

      expect(result.updatedCharacters.find(c => c.id === 'charA')?.hp).toBeLessThanOrEqual(0);
      expect(result.updatedCharacters.find(c => c.id === 'charB')?.hp).toBeLessThanOrEqual(0);
      expect(result.updatedCharacters.find(c => c.id === 'charC')?.hp).toBeLessThanOrEqual(0);
      const deathEvents = result.events.filter(e => e.type === 'death');
      expect(deathEvents).toHaveLength(3);
    });
  });

  // =========================================================================
  // Section 7: Multiple Independent Attacks
  // =========================================================================
  describe('multiple independent attacks', () => {
    it('should resolve multiple independent attack pairs', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const charB = createCharacter({
        id: 'charB',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });
      const charC = createCharacter({
        id: 'charC',
        position: { x: 5, y: 5 },
        slotPosition: 2,
        currentAction: createAttackAction({ x: 6, y: 5 }, null, 25, 1),
      });
      const charD = createCharacter({
        id: 'charD',
        position: { x: 6, y: 5 },
        hp: 100,
        slotPosition: 3,
      });

      const result = resolveCombat([charA, charB, charC, charD], 1);

      expect(result.updatedCharacters.find(c => c.id === 'charB')?.hp).toBe(90);
      expect(result.updatedCharacters.find(c => c.id === 'charD')?.hp).toBe(75);
    });

    it('should handle mix of hits and misses', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const charB = createCharacter({
        id: 'charB',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });
      const charC = createCharacter({
        id: 'charC',
        position: { x: 5, y: 5 },
        slotPosition: 2,
        currentAction: createAttackAction({ x: 6, y: 5 }, null, 25, 1),
      });
      const charD = createCharacter({
        id: 'charD',
        position: { x: 7, y: 7 }, // Not at target cell
        hp: 100,
        slotPosition: 3,
      });

      const result = resolveCombat([charA, charB, charC, charD], 1);

      expect(result.updatedCharacters.find(c => c.id === 'charB')?.hp).toBe(90); // Hit
      expect(result.updatedCharacters.find(c => c.id === 'charD')?.hp).toBe(100); // Miss
    });

    it('should handle attacker with no action', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const charB = createCharacter({
        id: 'charB',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
        currentAction: null, // No action
      });

      const result = resolveCombat([charA, charB], 1);

      expect(result.updatedCharacters.find(c => c.id === 'charB')?.hp).toBe(90);
      const damageEvents = result.events.filter(e => e.type === 'damage');
      expect(damageEvents).toHaveLength(1); // Only charA's attack
    });
  });

  // =========================================================================
  // Section 8: Action Filtering
  // =========================================================================
  describe('action filtering', () => {
    it('should only resolve actions with ticksRemaining === 1', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1), // Resolves
      });
      const charB = createCharacter({
        id: 'charB',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });
      const charC = createCharacter({
        id: 'charC',
        position: { x: 5, y: 5 },
        slotPosition: 2,
        currentAction: createAttackAction({ x: 6, y: 6 }, null, 25, 2), // Doesn't resolve
      });
      const charD = createCharacter({
        id: 'charD',
        position: { x: 6, y: 6 },
        hp: 100,
        slotPosition: 3,
      });

      const result = resolveCombat([charA, charB, charC, charD], 1);

      expect(result.updatedCharacters.find(c => c.id === 'charB')?.hp).toBe(90); // Hit
      expect(result.updatedCharacters.find(c => c.id === 'charD')?.hp).toBe(100); // Not hit (action not ready)
    });

    it('should ignore move actions', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 1, y: 0 }, 1),
      });

      const result = resolveCombat([charA], 1);

      const damageEvents = result.events.filter(e => e.type === 'damage');
      expect(damageEvents).toHaveLength(0);
    });

    it('should ignore idle actions', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createIdleAction(),
      });

      const result = resolveCombat([charA], 1);

      const damageEvents = result.events.filter(e => e.type === 'damage');
      expect(damageEvents).toHaveLength(0);
    });

    it('should handle character with null currentAction', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: null,
      });

      const result = resolveCombat([charA], 1);

      const damageEvents = result.events.filter(e => e.type === 'damage');
      expect(damageEvents).toHaveLength(0);
    });
  });

  // =========================================================================
  // Section 9: Edge Cases
  // =========================================================================
  describe('edge cases', () => {
    it('should return empty events when no attacks resolve', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 1, y: 0 }, 1),
      });
      const charB = createCharacter({
        id: 'charB',
        position: { x: 1, y: 0 },
        slotPosition: 1,
        currentAction: null,
      });

      const result = resolveCombat([charA, charB], 1);

      expect(result.events).toHaveLength(0);
    });

    it('should return unchanged characters when no attacks resolve', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 0, y: 0 },
        hp: 50,
        slotPosition: 0,
        currentAction: createMoveAction({ x: 1, y: 0 }, 1),
      });
      const charB = createCharacter({
        id: 'charB',
        position: { x: 1, y: 0 },
        hp: 75,
        slotPosition: 1,
        currentAction: null,
      });

      const result = resolveCombat([charA, charB], 1);

      expect(result.updatedCharacters.find(c => c.id === 'charA')?.hp).toBe(50);
      expect(result.updatedCharacters.find(c => c.id === 'charB')?.hp).toBe(75);
    });

    it('should handle empty characters array', () => {
      const result = resolveCombat([], 1);

      expect(result.updatedCharacters).toHaveLength(0);
      expect(result.events).toHaveLength(0);
    });

    it('should handle attack when targetCharacter not in array', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const actualTarget = createCharacter({
        id: 'actualTarget',
        position: { x: 1, y: 0 }, // At target cell
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, actualTarget], 1);

      // Should hit based on cell, not targetCharacter reference
      expect(result.updatedCharacters.find(c => c.id === 'actualTarget')?.hp).toBe(90);
    });

    it('should preserve non-HP character properties', () => {
      const attacker = createCharacter({
        id: 'attacker',
        name: 'Attacker',
        faction: 'friendly',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: 'target',
        name: 'Target',
        faction: 'enemy',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      const updatedTarget = result.updatedCharacters.find(c => c.id === 'target');
      expect(updatedTarget?.id).toBe('target');
      expect(updatedTarget?.name).toBe('Target');
      expect(updatedTarget?.faction).toBe('enemy');
      expect(updatedTarget?.position).toEqual({ x: 1, y: 0 });
    });
  });

  // =========================================================================
  // Section 10: HP Boundary Cases
  // =========================================================================
  describe('HP boundary cases', () => {
    it('should handle target at 1 HP surviving', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, undefined, 1), // undefined damage
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 1,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find(c => c.id === 'target')?.hp).toBe(1);
      const deathEvents = result.events.filter(e => e.type === 'death');
      expect(deathEvents).toHaveLength(0);
    });

    it('should handle exactly lethal damage', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 25, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 25,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find(c => c.id === 'target')?.hp).toBe(0);
      const deathEvents = result.events.filter(e => e.type === 'death');
      expect(deathEvents).toHaveLength(1);
    });

    it('should handle massive overkill without clamping', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 100, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 10,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find(c => c.id === 'target')?.hp).toBe(-90);
      const deathEvents = result.events.filter(e => e.type === 'death');
      expect(deathEvents).toHaveLength(1); // Only one death event
    });

    it('should handle target at maxHP taking damage', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 100,
        maxHp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find(c => c.id === 'target')?.hp).toBe(90);
      expect(result.updatedCharacters.find(c => c.id === 'target')?.maxHp).toBe(100);
    });
  });

  // =========================================================================
  // Section 11: Undefined Damage and Event Ordering
  // =========================================================================
  describe('undefined damage and event ordering', () => {
    it('should treat undefined skill.damage as 0', () => {
      const attacker = createCharacter({
        id: 'attacker',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 1, y: 0 }, null, undefined, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 1, y: 0 },
        hp: 100,
        slotPosition: 1,
      });

      const result = resolveCombat([attacker, target], 1);

      expect(result.updatedCharacters.find(c => c.id === 'target')?.hp).toBe(100);
      const damageEvent = result.events.find(e => e.type === 'damage');
      expect(damageEvent).toMatchObject({
        damage: 0,
      });
    });

    it('should order events by attacker slotPosition', () => {
      const attackerB = createCharacter({
        id: 'attackerB',
        position: { x: 2, y: 0 },
        slotPosition: 2,
        currentAction: createAttackAction({ x: 0, y: 0 }, null, 10, 1),
      });
      const attackerA = createCharacter({
        id: 'attackerA',
        position: { x: 1, y: 0 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 0, y: 0 }, null, 10, 1),
      });
      const target = createCharacter({
        id: 'target',
        position: { x: 0, y: 0 },
        hp: 100,
        slotPosition: 0,
      });

      const result = resolveCombat([target, attackerA, attackerB], 1);

      const damageEvents = result.events.filter(e => e.type === 'damage');
      expect(damageEvents[0].sourceId).toBe('attackerA'); // slotPosition 1
      expect(damageEvents[1].sourceId).toBe('attackerB'); // slotPosition 2
    });

    it('should order all DamageEvents before DeathEvents', () => {
      const attackerA = createCharacter({
        id: 'attackerA',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 2, y: 0 }, null, 100, 1),
      });
      const attackerB = createCharacter({
        id: 'attackerB',
        position: { x: 1, y: 1 },
        slotPosition: 1,
        currentAction: createAttackAction({ x: 3, y: 3 }, null, 100, 1),
      });
      const targetA = createCharacter({
        id: 'targetA',
        position: { x: 2, y: 0 },
        hp: 50,
        slotPosition: 2,
      });
      const targetB = createCharacter({
        id: 'targetB',
        position: { x: 3, y: 3 },
        hp: 50,
        slotPosition: 3,
      });

      const result = resolveCombat([attackerA, attackerB, targetA, targetB], 1);

      const damageEvents = result.events.filter(e => e.type === 'damage');
      const deathEvents = result.events.filter(e => e.type === 'death');
      const lastDamageIndex = result.events.lastIndexOf(damageEvents[damageEvents.length - 1]);
      const firstDeathIndex = result.events.indexOf(deathEvents[0]);
      expect(lastDamageIndex).toBeLessThan(firstDeathIndex);
    });
  });
});
