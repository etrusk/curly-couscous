/**
 * Tests for trigger evaluation.
 * Follows test design document: docs/test-design-trigger-evaluation.md
 */

import { describe, it, expect } from 'vitest';
import { evaluateTrigger } from './triggers';
import { Character, Trigger, Skill, Action } from './types';

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
 * Test helper to create actions with minimal boilerplate.
 */
function createAction(overrides: Partial<Action>): Action {
  return {
    type: overrides.type ?? 'attack',
    skill: overrides.skill ?? createSkill({ id: 'test-skill' }),
    targetCell: overrides.targetCell ?? { x: 0, y: 0 },
    targetCharacter: overrides.targetCharacter ?? null,
    startedAtTick: overrides.startedAtTick ?? 0,
    resolvesAtTick: overrides.resolvesAtTick ?? 1,
  };
}

describe('evaluateTrigger', () => {
  // =========================================================================
  // Section 1: `always` Trigger (Unconditional)
  // =========================================================================
  describe('always trigger', () => {
    it('should return true for always trigger type', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
      });
      const trigger: Trigger = { type: 'always' };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(true);
    });

    it('should return true for always trigger regardless of evaluator state', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
        hp: 10, // Low HP
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 6 }, // dist=1
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        position: { x: 5, y: 7 }, // dist=2
      });
      const trigger: Trigger = { type: 'always' };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy, ally]);

      expect(result).toBe(true);
    });
  });

  // =========================================================================
  // Section 2: `enemy_in_range` Trigger
  // =========================================================================
  describe('enemy_in_range trigger', () => {
    it('should return true when enemy is within range', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 7 }, // dist=2
      });
      const trigger: Trigger = { type: 'enemy_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(true);
    });

    it('should return false when enemy is outside range', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 9 }, // dist=4
      });
      const trigger: Trigger = { type: 'enemy_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(false);
    });

    it('should return true when enemy is exactly at range boundary', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 8 }, // dist=3
      });
      const trigger: Trigger = { type: 'enemy_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(true);
    });

    it('should use Chebyshev distance (diagonal counts as 1)', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 7, y: 7 }, // dist=2 (diagonal)
      });
      const trigger: Trigger = { type: 'enemy_in_range', value: 2 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(true);
    });

    it('should return true if any enemy is in range', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        position: { x: 10, y: 10 }, // dist=5
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        position: { x: 5, y: 6 }, // dist=1
      });
      const trigger: Trigger = { type: 'enemy_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemyA, enemyB]);

      expect(result).toBe(true);
    });

    it('should return false when no enemies exist', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        position: { x: 5, y: 6 },
      });
      const trigger: Trigger = { type: 'enemy_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

      expect(result).toBe(false);
    });

    it('should ignore allies when checking enemy range', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        position: { x: 5, y: 6 }, // dist=1
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 10, y: 10 }, // dist=5
      });
      const trigger: Trigger = { type: 'enemy_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, ally, enemy]);

      expect(result).toBe(false);
    });

    it('should handle maximum grid distance', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 0, y: 0 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 11, y: 11 }, // dist=11
      });
      const trigger: Trigger = { type: 'enemy_in_range', value: 11 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(true);
    });

    it('should return false at maximum grid distance when range insufficient', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 0, y: 0 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 11, y: 11 }, // dist=11
      });
      const trigger: Trigger = { type: 'enemy_in_range', value: 10 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // Section 3: `ally_in_range` Trigger
  // =========================================================================
  describe('ally_in_range trigger', () => {
    it('should return true when ally is within range', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        position: { x: 5, y: 7 }, // dist=2
      });
      const trigger: Trigger = { type: 'ally_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

      expect(result).toBe(true);
    });

    it('should return false when ally is outside range', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        position: { x: 5, y: 9 }, // dist=4
      });
      const trigger: Trigger = { type: 'ally_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

      expect(result).toBe(false);
    });

    it('should return true when ally is exactly at range boundary', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        position: { x: 5, y: 8 }, // dist=3
      });
      const trigger: Trigger = { type: 'ally_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

      expect(result).toBe(true);
    });

    it('should exclude self from ally range check', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const trigger: Trigger = { type: 'ally_in_range', value: 0 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(false);
    });

    it('should return true if any ally (not self) is in range', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const allyA = createCharacter({
        id: 'allyA',
        faction: 'friendly',
        position: { x: 10, y: 10 }, // dist=5
      });
      const allyB = createCharacter({
        id: 'allyB',
        faction: 'friendly',
        position: { x: 5, y: 6 }, // dist=1
      });
      const trigger: Trigger = { type: 'ally_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, allyA, allyB]);

      expect(result).toBe(true);
    });

    it('should return false when no allies except self exist', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 6 },
      });
      const trigger: Trigger = { type: 'ally_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(false);
    });

    it('should ignore enemies when checking ally range', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 6 }, // dist=1
      });
      const trigger: Trigger = { type: 'ally_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // Section 4: `hp_below` Trigger
  // =========================================================================
  describe('hp_below trigger', () => {
    it('should return true when HP percentage is below threshold', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
        hp: 30,
        maxHp: 100, // 30%
      });
      const trigger: Trigger = { type: 'hp_below', value: 50 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(true);
    });

    it('should return false when HP percentage is above threshold', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
        hp: 70,
        maxHp: 100, // 70%
      });
      const trigger: Trigger = { type: 'hp_below', value: 50 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(false);
    });

    it('should return false when HP percentage equals threshold exactly', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
        hp: 50,
        maxHp: 100, // 50%
      });
      const trigger: Trigger = { type: 'hp_below', value: 50 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(false);
    });

    it('should return true when HP is 1 below threshold', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
        hp: 49,
        maxHp: 100, // 49%
      });
      const trigger: Trigger = { type: 'hp_below', value: 50 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(true);
    });

    it('should handle threshold of 100% correctly', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
        hp: 99,
        maxHp: 100, // 99%
      });
      const trigger: Trigger = { type: 'hp_below', value: 100 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(true);
    });

    it('should return false for threshold 100% at full HP', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
        hp: 100,
        maxHp: 100, // 100%
      });
      const trigger: Trigger = { type: 'hp_below', value: 100 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(false);
    });

    it('should handle near-death HP correctly', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
        hp: 1,
        maxHp: 100, // 1%
      });
      const trigger: Trigger = { type: 'hp_below', value: 2 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(true);
    });

    it('should handle non-standard maxHP values', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
        hp: 25,
        maxHp: 50, // 50%
      });
      const trigger: Trigger = { type: 'hp_below', value: 60 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(true);
    });

    it('should handle fractional HP percentages', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
        hp: 33,
        maxHp: 100, // 33%
      });
      const trigger: Trigger = { type: 'hp_below', value: 34 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(true);
    });

    it('should return false for hp_below 0 threshold', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
        hp: 1,
        maxHp: 100, // 1%
      });
      const trigger: Trigger = { type: 'hp_below', value: 0 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // Section 5: `my_cell_targeted_by_enemy` Trigger
  // =========================================================================
  describe('my_cell_targeted_by_enemy trigger', () => {
    it('should return true when enemy has locked-in action on evaluator cell', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 6 },
        currentAction: createAction({
          type: 'attack',
          targetCell: { x: 5, y: 5 },
          resolvesAtTick: 1,
        }),
      });
      const trigger: Trigger = { type: 'my_cell_targeted_by_enemy' };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(true);
    });

    it('should return false when no actions target evaluator cell', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 6 },
        currentAction: createAction({
          type: 'attack',
          targetCell: { x: 6, y: 6 },
          resolvesAtTick: 1,
        }),
      });
      const trigger: Trigger = { type: 'my_cell_targeted_by_enemy' };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(false);
    });

    it('should return false when no characters have current actions', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 6 },
        currentAction: null,
      });
      const trigger: Trigger = { type: 'my_cell_targeted_by_enemy' };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(false);
    });

    it('should ignore allied actions targeting evaluator cell', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        position: { x: 5, y: 6 },
        currentAction: createAction({
          type: 'attack',
          targetCell: { x: 5, y: 5 },
          resolvesAtTick: 1,
        }),
      });
      const trigger: Trigger = { type: 'my_cell_targeted_by_enemy' };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, ally]);

      expect(result).toBe(false);
    });

    it('should return true if any enemy targets the cell', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        position: { x: 5, y: 6 },
        currentAction: createAction({
          type: 'attack',
          targetCell: { x: 6, y: 6 },
          resolvesAtTick: 1,
        }),
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        position: { x: 5, y: 7 },
        currentAction: createAction({
          type: 'attack',
          targetCell: { x: 5, y: 5 },
          resolvesAtTick: 1,
        }),
      });
      const trigger: Trigger = { type: 'my_cell_targeted_by_enemy' };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemyA, enemyB]);

      expect(result).toBe(true);
    });

    it('should detect multi-tick action with ticksRemaining=1 (last chance to dodge)', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 6 },
        currentAction: createAction({
          type: 'attack',
          skill: createSkill({ id: 'heavy-punch', tickCost: 2 }),
          targetCell: { x: 5, y: 5 },
          resolvesAtTick: 1,
        }),
      });
      const trigger: Trigger = { type: 'my_cell_targeted_by_enemy' };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(true);
    });

    it('should detect multi-tick action with ticksRemaining > 1', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        position: { x: 5, y: 6 },
        currentAction: createAction({
          type: 'attack',
          skill: createSkill({ id: 'heavy-punch', tickCost: 2 }),
          targetCell: { x: 5, y: 5 },
          resolvesAtTick: 2,
        }),
      });
      const trigger: Trigger = { type: 'my_cell_targeted_by_enemy' };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemy]);

      expect(result).toBe(true);
    });

    it('should return true when multiple enemies target evaluator cell', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        position: { x: 5, y: 6 },
        currentAction: createAction({
          type: 'attack',
          targetCell: { x: 5, y: 5 },
          resolvesAtTick: 1,
        }),
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        position: { x: 6, y: 5 },
        currentAction: createAction({
          type: 'attack',
          targetCell: { x: 5, y: 5 },
          resolvesAtTick: 1,
        }),
      });
      const trigger: Trigger = { type: 'my_cell_targeted_by_enemy' };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, enemyA, enemyB]);

      expect(result).toBe(true);
    });
  });

  // =========================================================================
  // Section 6: Edge Cases
  // =========================================================================
  describe('edge cases', () => {
    it('should handle empty allCharacters array for range triggers', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const trigger: Trigger = { type: 'enemy_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, []);

      expect(result).toBe(false);
    });

    it('should handle evaluator as only character', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });

      const enemyRangeTrigger: Trigger = { type: 'enemy_in_range', value: 5 };
      const allyRangeTrigger: Trigger = { type: 'ally_in_range', value: 5 };

      const enemyResult = evaluateTrigger(enemyRangeTrigger, evaluator, [evaluator]);
      const allyResult = evaluateTrigger(allyRangeTrigger, evaluator, [evaluator]);

      expect(enemyResult).toBe(false);
      expect(allyResult).toBe(false);
    });

    it('should handle evaluator as only character with hp_below', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
        hp: 30,
        maxHp: 100,
      });
      const trigger: Trigger = { type: 'hp_below', value: 50 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator]);

      expect(result).toBe(true);
    });
  });

  // =========================================================================
  // Section 7: Dead Character Handling
  // =========================================================================
  describe('dead character handling', () => {
    it('should ignore dead enemies in range calculations', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const deadEnemy = createCharacter({
        id: 'deadEnemy',
        faction: 'enemy',
        position: { x: 5, y: 6 }, // dist=1
        hp: 0,
      });
      const liveEnemy = createCharacter({
        id: 'liveEnemy',
        faction: 'enemy',
        position: { x: 10, y: 10 }, // dist=5
        hp: 50,
      });
      const trigger: Trigger = { type: 'enemy_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, deadEnemy, liveEnemy]);

      expect(result).toBe(false);
    });

    it('should ignore dead allies in range calculations', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const deadAlly = createCharacter({
        id: 'deadAlly',
        faction: 'friendly',
        position: { x: 5, y: 6 }, // dist=1
        hp: 0,
      });
      const trigger: Trigger = { type: 'ally_in_range', value: 3 };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, deadAlly]);

      expect(result).toBe(false);
    });

    it('should ignore actions from dead enemies', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const deadEnemy = createCharacter({
        id: 'deadEnemy',
        faction: 'enemy',
        position: { x: 5, y: 6 },
        hp: 0,
        currentAction: createAction({
          type: 'attack',
          targetCell: { x: 5, y: 5 },
          resolvesAtTick: 1,
        }),
      });
      const trigger: Trigger = { type: 'my_cell_targeted_by_enemy' };

      const result = evaluateTrigger(trigger, evaluator, [evaluator, deadEnemy]);

      expect(result).toBe(false);
    });
  });
});
