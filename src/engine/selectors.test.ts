/**
 * Tests for selector evaluation.
 * Follows test design document: docs/test-design-selector-evaluation-v2.md
 */

import { describe, it, expect } from 'vitest';
import { evaluateSelector } from './selectors';
import { Character, Selector } from './types';

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

describe('evaluateSelector', () => {
  // =========================================================================
  // Section 1: `self` Selector
  // =========================================================================
  describe('self selector', () => {
    it('should return evaluator for self selector', () => {
      const evaluator = createCharacter({
        id: 'eval',
        position: { x: 5, y: 5 },
      });
      const selector: Selector = { type: 'self' };

      const result = evaluateSelector(selector, evaluator, [evaluator]);

      expect(result).toBe(evaluator);
    });

    it('should return evaluator regardless of other characters', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 3, y: 3 },
      });
      const enemy1 = createCharacter({
        id: 'enemy1',
        faction: 'enemy',
        position: { x: 3, y: 4 },
      });
      const enemy2 = createCharacter({
        id: 'enemy2',
        faction: 'enemy',
        position: { x: 4, y: 3 },
      });
      const selector: Selector = { type: 'self' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemy1, enemy2]);

      expect(result).toBe(evaluator);
    });
  });

  // =========================================================================
  // Section 2: `nearest_enemy` Selector
  // =========================================================================
  describe('nearest_enemy selector', () => {
    it('should return closest enemy by Chebyshev distance', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        position: { x: 5, y: 7 }, // dist=2
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        position: { x: 8, y: 5 }, // dist=3
      });
      const selector: Selector = { type: 'nearest_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemyA, enemyB]);

      expect(result).toBe(enemyA);
    });

    it('should ignore allies when selecting nearest enemy', () => {
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
        position: { x: 5, y: 8 }, // dist=3
      });
      const selector: Selector = { type: 'nearest_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, ally, enemy]);

      expect(result).toBe(enemy);
    });

    it('should handle diagonal distances correctly (Chebyshev)', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        position: { x: 7, y: 7 }, // dist=2 (diagonal)
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        position: { x: 5, y: 8 }, // dist=3
      });
      const selector: Selector = { type: 'nearest_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemyA, enemyB]);

      expect(result).toBe(enemyA);
    });

    it('should return null when no enemies exist', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        position: { x: 6, y: 6 },
      });
      const selector: Selector = { type: 'nearest_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, ally]);

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // Section 3: `nearest_ally` Selector
  // =========================================================================
  describe('nearest_ally selector', () => {
    it('should return closest ally by Chebyshev distance', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const allyA = createCharacter({
        id: 'allyA',
        faction: 'friendly',
        position: { x: 5, y: 7 }, // dist=2
      });
      const allyB = createCharacter({
        id: 'allyB',
        faction: 'friendly',
        position: { x: 8, y: 5 }, // dist=3
      });
      const selector: Selector = { type: 'nearest_ally' };

      const result = evaluateSelector(selector, evaluator, [evaluator, allyA, allyB]);

      expect(result).toBe(allyA);
    });

    it('should exclude self from ally selection', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const selector: Selector = { type: 'nearest_ally' };

      const result = evaluateSelector(selector, evaluator, [evaluator]);

      expect(result).toBeNull();
    });

    it('should ignore enemies when selecting nearest ally', () => {
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
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        position: { x: 5, y: 8 }, // dist=3
      });
      const selector: Selector = { type: 'nearest_ally' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemy, ally]);

      expect(result).toBe(ally);
    });

    it('should return null when only evaluator exists (no other allies)', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const selector: Selector = { type: 'nearest_ally' };

      const result = evaluateSelector(selector, evaluator, [evaluator]);

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // Section 4: `lowest_hp_enemy` Selector
  // =========================================================================
  describe('lowest_hp_enemy selector', () => {
    it('should return enemy with lowest current HP', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        hp: 75,
        position: { x: 3, y: 3 },
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        hp: 50,
        position: { x: 4, y: 4 },
      });
      const enemyC = createCharacter({
        id: 'enemyC',
        faction: 'enemy',
        hp: 90,
        position: { x: 6, y: 6 },
      });
      const selector: Selector = { type: 'lowest_hp_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemyA, enemyB, enemyC]);

      expect(result).toBe(enemyB);
    });

    it('should ignore allies when selecting lowest HP enemy', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        hp: 10,
        position: { x: 4, y: 4 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        hp: 50,
        position: { x: 6, y: 6 },
      });
      const selector: Selector = { type: 'lowest_hp_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, ally, enemy]);

      expect(result).toBe(enemy);
    });

    it('should return null when no enemies exist', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        position: { x: 4, y: 4 },
      });
      const selector: Selector = { type: 'lowest_hp_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, ally]);

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // Section 5: `lowest_hp_ally` Selector
  // =========================================================================
  describe('lowest_hp_ally selector', () => {
    it('should return ally with lowest current HP', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const allyA = createCharacter({
        id: 'allyA',
        faction: 'friendly',
        hp: 75,
        position: { x: 3, y: 3 },
      });
      const allyB = createCharacter({
        id: 'allyB',
        faction: 'friendly',
        hp: 50,
        position: { x: 4, y: 4 },
      });
      const allyC = createCharacter({
        id: 'allyC',
        faction: 'friendly',
        hp: 90,
        position: { x: 6, y: 6 },
      });
      const selector: Selector = { type: 'lowest_hp_ally' };

      const result = evaluateSelector(selector, evaluator, [evaluator, allyA, allyB, allyC]);

      expect(result).toBe(allyB);
    });

    it('should exclude self from lowest HP ally selection', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        hp: 10,
        position: { x: 5, y: 5 },
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        hp: 50,
        position: { x: 4, y: 4 },
      });
      const selector: Selector = { type: 'lowest_hp_ally' };

      const result = evaluateSelector(selector, evaluator, [evaluator, ally]);

      expect(result).toBe(ally);
    });

    it('should ignore enemies when selecting lowest HP ally', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy = createCharacter({
        id: 'enemy',
        faction: 'enemy',
        hp: 10,
        position: { x: 6, y: 6 },
      });
      const ally = createCharacter({
        id: 'ally',
        faction: 'friendly',
        hp: 50,
        position: { x: 4, y: 4 },
      });
      const selector: Selector = { type: 'lowest_hp_ally' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemy, ally]);

      expect(result).toBe(ally);
    });
  });

  // =========================================================================
  // Section 6: Tie-Breaking (Section 6.2)
  // =========================================================================
  describe('tie-breaking rules', () => {
    it('nearest_enemy: should prefer lower Y when distances equal', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        position: { x: 6, y: 4 }, // dist=1, Y=4
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        position: { x: 4, y: 6 }, // dist=1, Y=6
      });
      const selector: Selector = { type: 'nearest_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemyA, enemyB]);

      expect(result).toBe(enemyA); // Y=4 < Y=6
    });

    it('nearest_enemy: should prefer lower X when Y and distances equal', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        position: { x: 4, y: 5 }, // dist=1, X=4
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        position: { x: 6, y: 5 }, // dist=1, X=6
      });
      const selector: Selector = { type: 'nearest_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemyA, enemyB]);

      expect(result).toBe(enemyA); // X=4 < X=6
    });

    it('lowest_hp_enemy: should prefer lower Y when HP equal', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        hp: 50,
        position: { x: 3, y: 2 }, // Y=2
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        hp: 50,
        position: { x: 7, y: 4 }, // Y=4
      });
      const selector: Selector = { type: 'lowest_hp_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemyA, enemyB]);

      expect(result).toBe(enemyA); // Y=2 < Y=4
    });

    it('lowest_hp_enemy: should prefer lower X when HP and Y equal', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 0, y: 0 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        hp: 50,
        position: { x: 2, y: 3 }, // X=2
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        hp: 50,
        position: { x: 5, y: 3 }, // X=5
      });
      const selector: Selector = { type: 'lowest_hp_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemyA, enemyB]);

      expect(result).toBe(enemyA); // X=2 < X=5
    });

    it('nearest_enemy: three-way tie resolved correctly', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        position: { x: 5, y: 4 }, // dist=1, Y=4
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        position: { x: 6, y: 5 }, // dist=1, Y=5
      });
      const enemyC = createCharacter({
        id: 'enemyC',
        faction: 'enemy',
        position: { x: 4, y: 5 }, // dist=1, Y=5
      });
      const selector: Selector = { type: 'nearest_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemyA, enemyB, enemyC]);

      expect(result).toBe(enemyA); // Lowest Y=4
    });
  });

  // =========================================================================
  // Section 7: Metric Independence
  // =========================================================================
  describe('metric independence', () => {
    it('nearest_enemy: should select by distance regardless of HP values', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        hp: 100,
        position: { x: 5, y: 6 }, // dist=1
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        hp: 10,
        position: { x: 5, y: 9 }, // dist=4
      });
      const selector: Selector = { type: 'nearest_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemyA, enemyB]);

      expect(result).toBe(enemyA); // Closer, despite higher HP
    });

    it('lowest_hp_enemy: should select by HP regardless of distance', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemyA = createCharacter({
        id: 'enemyA',
        faction: 'enemy',
        hp: 100,
        position: { x: 5, y: 6 }, // dist=1
      });
      const enemyB = createCharacter({
        id: 'enemyB',
        faction: 'enemy',
        hp: 10,
        position: { x: 5, y: 9 }, // dist=4
      });
      const selector: Selector = { type: 'lowest_hp_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemyA, enemyB]);

      expect(result).toBe(enemyB); // Lower HP, despite farther distance
    });
  });

  // =========================================================================
  // Section 8: Edge Cases
  // =========================================================================
  describe('edge cases', () => {
    it('should return null for any selector when allCharacters is empty', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const selector: Selector = { type: 'nearest_enemy' };

      const result = evaluateSelector(selector, evaluator, []);

      expect(result).toBeNull();
    });

    it('should handle evaluator at distance 0 from themselves', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const selector: Selector = { type: 'nearest_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator]);

      expect(result).toBeNull(); // No enemies, not self
    });

    it('should handle all characters at same position as evaluator (distance 0)', () => {
      const evaluator = createCharacter({
        id: 'eval',
        faction: 'friendly',
        position: { x: 5, y: 5 },
      });
      const enemy1 = createCharacter({
        id: 'enemy1',
        faction: 'enemy',
        position: { x: 5, y: 5 }, // Same position
      });
      const enemy2 = createCharacter({
        id: 'enemy2',
        faction: 'enemy',
        position: { x: 5, y: 5 }, // Same position
      });
      const selector: Selector = { type: 'nearest_enemy' };

      const result = evaluateSelector(selector, evaluator, [evaluator, enemy1, enemy2]);

      // Note: This test relies on ES2019+ Array.sort() stability.
      // In ES2019+, sort() is guaranteed stable, so equal elements maintain
      // their original order. This ensures deterministic tie-breaking.
      // Should return one of them via tie-break (both at same position, so Y and X equal)
      // Both enemies have same position, so first one in array order
      expect(result).toBe(enemy1);
    });
  });
});
