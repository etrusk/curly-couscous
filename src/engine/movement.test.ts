/**
 * Tests for movement collision resolution.
 * Follows test design document: docs/design-movement-collision.md
 *
 * Total: 46 tests across 10 sections
 */

import { describe, it, expect } from 'vitest';
import { Character, Action, Position } from './types';
import { nextRandom, initRNG, resolveMovement } from './movement';

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
 * Test helper to create move actions.
 */
function createMoveAction(
  targetCell: Position,
  ticksRemaining: number = 1
): Action {
  return {
    type: 'move',
    skill: {
      id: 'test-move',
      name: 'Move',
      tickCost: 1,
      range: 1,
      mode: 'towards',
      enabled: true,
      triggers: [],
    },
    targetCell,
    targetCharacter: null,
    ticksRemaining,
  };
}

/**
 * Test helper to create attack actions.
 */
function createAttackAction(
  targetCell: Position,
  ticksRemaining: number = 1
): Action {
  return {
    type: 'attack',
    skill: {
      id: 'test-attack',
      name: 'Attack',
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [],
    },
    targetCell,
    targetCharacter: null,
    ticksRemaining,
  };
}

describe('Movement Collision System', () => {
  // ===========================================================================
  // Section 1: RNG Determinism (3 tests)
  // ===========================================================================
  describe('RNG determinism', () => {
    it('should produce same sequence from same seed', () => {
      const seed = 12345;
      const state1 = initRNG(seed);
      const state2 = initRNG(seed);

      const result1 = nextRandom(state1);
      const result2 = nextRandom(state2);

      expect(result1.value).toBe(result2.value);
      expect(result1.nextState).toBe(result2.nextState);
    });

    it('should produce different sequences from different seeds', () => {
      const state1 = initRNG(12345);
      const state2 = initRNG(67890);

      const result1 = nextRandom(state1);
      const result2 = nextRandom(state2);

      expect(result1.value).not.toBe(result2.value);
    });

    it('should produce values in range [0, 1)', () => {
      let state = initRNG(42);
      
      for (let i = 0; i < 1000; i++) {
        const result = nextRandom(state);
        expect(result.value).toBeGreaterThanOrEqual(0);
        expect(result.value).toBeLessThan(1);
        state = result.nextState;
      }
    });
  });

  // ===========================================================================
  // Section 2: Basic Movement (6 tests)
  // ===========================================================================
  describe('basic movement', () => {
    it('should move character to unobstructed target cell', () => {
      const mover = createCharacter({
        id: 'mover',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 1),
      });

      const result = resolveMovement([mover], 1, initRNG(1000));

      const updated = result.updatedCharacters.find(c => c.id === 'mover');
      expect(updated?.position).toEqual({ x: 6, y: 5 });
    });

    it('should generate MovementEvent with correct fields', () => {
      const mover = createCharacter({
        id: 'mover',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 1),
      });

      const result = resolveMovement([mover], 3, initRNG(1000));

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toMatchObject({
        type: 'movement',
        tick: 3,
        characterId: 'mover',
        from: { x: 5, y: 5 },
        to: { x: 6, y: 5 },
        collided: false,
      });
    });

    it('should set collided=false for successful move', () => {
      const mover = createCharacter({
        id: 'mover',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 1),
      });

      const result = resolveMovement([mover], 1, initRNG(1000));

      expect(result.events[0].collided).toBe(false);
    });

    it('should not move character with ticksRemaining > 1', () => {
      const mover = createCharacter({
        id: 'mover',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 2),
      });

      const result = resolveMovement([mover], 1, initRNG(1000));

      const updated = result.updatedCharacters.find(c => c.id === 'mover');
      expect(updated?.position).toEqual({ x: 5, y: 5 }); // Unchanged
      expect(result.events).toHaveLength(0); // No event
    });

    it('should not move character with null action', () => {
      const char = createCharacter({
        id: 'char',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: null,
      });

      const result = resolveMovement([char], 1, initRNG(1000));

      expect(result.updatedCharacters.find(c => c.id === 'char')?.position).toEqual({ x: 5, y: 5 });
      expect(result.events).toHaveLength(0);
    });

    it('should not move character with non-move action', () => {
      const char = createCharacter({
        id: 'char',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 6, y: 5 }, 1),
      });

      const result = resolveMovement([char], 1, initRNG(1000));

      expect(result.updatedCharacters.find(c => c.id === 'char')?.position).toEqual({ x: 5, y: 5 });
      expect(result.events).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Section 3: Blocker Always Wins (8 tests)
  // ===========================================================================
  describe('blocker always wins', () => {
    it('should block mover when stationary character occupies target cell', () => {
      const blocker = createCharacter({
        id: 'blocker',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: null, // Stationary
      });
      const mover = createCharacter({
        id: 'mover',
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      expect(result.updatedCharacters.find(c => c.id === 'mover')?.position).toEqual({ x: 4, y: 5 });
    });

    it('should set collided=true when blocked', () => {
      const blocker = createCharacter({
        id: 'blocker',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: null,
      });
      const mover = createCharacter({
        id: 'mover',
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      const event = result.events.find(e => e.characterId === 'mover');
      expect(event?.collided).toBe(true);
    });

    it('should keep mover in original position when blocked', () => {
      const blocker = createCharacter({
        id: 'blocker',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: null,
      });
      const mover = createCharacter({
        id: 'mover',
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      const event = result.events.find(e => e.characterId === 'mover');
      expect(event?.from).toEqual({ x: 4, y: 5 });
      expect(event?.to).toEqual({ x: 4, y: 5 }); // Stayed in place
    });

    it('should not move blocker', () => {
      const blocker = createCharacter({
        id: 'blocker',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: null,
      });
      const mover = createCharacter({
        id: 'mover',
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      expect(result.updatedCharacters.find(c => c.id === 'blocker')?.position).toEqual({ x: 5, y: 5 });
    });

    it('should block all movers when multiple target same blocker', () => {
      const blocker = createCharacter({
        id: 'blocker',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: null,
      });
      const moverA = createCharacter({
        id: 'moverA',
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: 'moverB',
        position: { x: 5, y: 4 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([blocker, moverA, moverB], 1, initRNG(1000));

      expect(result.updatedCharacters.find(c => c.id === 'moverA')?.position).toEqual({ x: 4, y: 5 });
      expect(result.updatedCharacters.find(c => c.id === 'moverB')?.position).toEqual({ x: 5, y: 4 });
      expect(result.events.filter(e => e.collided === true)).toHaveLength(2);
    });

    it('should treat character with attack action as blocker', () => {
      const blocker = createCharacter({
        id: 'blocker',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createAttackAction({ x: 6, y: 5 }, 1), // Attacking but stationary
      });
      const mover = createCharacter({
        id: 'mover',
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      expect(result.updatedCharacters.find(c => c.id === 'mover')?.position).toEqual({ x: 4, y: 5 });
      expect(result.events[0].collided).toBe(true);
    });

    it('should treat hold action (move to current cell) as blocker', () => {
      const blocker = createCharacter({
        id: 'blocker',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1), // Hold
      });
      const mover = createCharacter({
        id: 'mover',
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([blocker, mover], 1, initRNG(1000));

      expect(result.updatedCharacters.find(c => c.id === 'mover')?.position).toEqual({ x: 4, y: 5 });
      expect(result.events.find(e => e.characterId === 'mover')?.collided).toBe(true);
    });

    it('should allow independent resolution of multiple groups', () => {
      // Group 1: blocker at (5,5), mover blocked
      const blockerA = createCharacter({
        id: 'blockerA',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: null,
      });
      const moverA = createCharacter({
        id: 'moverA',
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      // Group 2: unobstructed move to (8,8)
      const moverB = createCharacter({
        id: 'moverB',
        position: { x: 7, y: 8 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 8, y: 8 }, 1),
      });

      const result = resolveMovement([blockerA, moverA, moverB], 1, initRNG(1000));

      expect(result.updatedCharacters.find(c => c.id === 'moverA')?.position).toEqual({ x: 4, y: 5 }); // Blocked
      expect(result.updatedCharacters.find(c => c.id === 'moverB')?.position).toEqual({ x: 8, y: 8 }); // Success
      expect(result.events.find(e => e.characterId === 'moverA')?.collided).toBe(true);
      expect(result.events.find(e => e.characterId === 'moverB')?.collided).toBe(false);
    });
  });

  // ===========================================================================
  // Section 4: Two-Way Collision (6 tests)
  // ===========================================================================
  describe('two-way collision', () => {
    it('should select exactly one winner from two movers', () => {
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

      const result = resolveMovement([moverA, moverB], 1, initRNG(1000));

      const movedCount = result.updatedCharacters.filter(c => 
        c.position.x === 5 && c.position.y === 5
      ).length;
      expect(movedCount).toBe(1);
    });

    it('should keep loser in original position', () => {
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

      const result = resolveMovement([moverA, moverB], 1, initRNG(1000));

      const loserEvent = result.events.find(e => e.collided === true);
      expect(loserEvent?.from).toEqual(loserEvent?.to); // Stayed in place
    });

    it('should set correct collided flags (winner=false, loser=true)', () => {
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

      const result = resolveMovement([moverA, moverB], 1, initRNG(1000));

      const winnerEvent = result.events.find(e => e.collided === false);
      const loserEvent = result.events.find(e => e.collided === true);
      expect(winnerEvent).toBeDefined();
      expect(loserEvent).toBeDefined();
    });

    it('should generate events for both movers', () => {
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

      const result = resolveMovement([moverA, moverB], 1, initRNG(1000));

      expect(result.events).toHaveLength(2);
      expect(result.events.map(e => e.characterId).sort()).toEqual(['moverA', 'moverB']);
    });

    it('should produce same winner with same rngState', () => {
      const seed = 42;
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

      const result1 = resolveMovement([moverA, moverB], 1, initRNG(seed));
      const result2 = resolveMovement([moverA, moverB], 1, initRNG(seed));

      const winner1 = result1.events.find(e => e.collided === false)?.characterId;
      const winner2 = result2.events.find(e => e.collided === false)?.characterId;
      expect(winner1).toBe(winner2);
    });

    it('should potentially produce different winner with different rngState', () => {
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

      // Try different seeds until we get different outcomes
      const results: string[] = [];
      for (let seed = 0; seed < 100; seed++) {
        const result = resolveMovement([moverA, moverB], 1, initRNG(seed));
        const winner = result.events.find(e => e.collided === false)?.characterId;
        if (winner) results.push(winner);
      }

      // Should have both winners appear at least once
      const uniqueWinners = new Set(results);
      expect(uniqueWinners.size).toBe(2);
    });
  });

  // ===========================================================================
  // Section 5: Multi-Way Collision (4 tests)
  // ===========================================================================
  describe('multi-way collision', () => {
    it('should select exactly one winner from 3-way collision', () => {
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
      const moverC = createCharacter({
        id: 'moverC',
        position: { x: 6, y: 5 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([moverA, moverB, moverC], 1, initRNG(1000));

      const winnersCount = result.events.filter(e => e.collided === false).length;
      expect(winnersCount).toBe(1);
    });

    it('should keep all losers in original positions', () => {
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
      const moverC = createCharacter({
        id: 'moverC',
        position: { x: 6, y: 5 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([moverA, moverB, moverC], 1, initRNG(1000));

      const loserEvents = result.events.filter(e => e.collided === true);
      expect(loserEvents).toHaveLength(2);
      loserEvents.forEach(event => {
        expect(event.from).toEqual(event.to); // Each loser stayed in place
      });
    });

    it('should handle 4-way collision', () => {
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
      const moverC = createCharacter({
        id: 'moverC',
        position: { x: 6, y: 5 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverD = createCharacter({
        id: 'moverD',
        position: { x: 5, y: 6 },
        slotPosition: 3,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result = resolveMovement([moverA, moverB, moverC, moverD], 1, initRNG(1000));

      expect(result.events.filter(e => e.collided === false)).toHaveLength(1);
      expect(result.events.filter(e => e.collided === true)).toHaveLength(3);
    });

    it('should distribute wins uniformly over many trials (3-way)', () => {
      const trials = 10000;
      const wins: Record<string, number> = { moverA: 0, moverB: 0, moverC: 0 };

      for (let i = 0; i < trials; i++) {
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
        const moverC = createCharacter({
          id: 'moverC',
          position: { x: 6, y: 5 },
          slotPosition: 2,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });

        const result = resolveMovement([moverA, moverB, moverC], 1, initRNG(i));
        const winner = result.events.find(e => e.collided === false)?.characterId;
        if (winner) wins[winner]++;
      }

      // For n=10000, p=0.333: σ ≈ 47, 3σ bounds: 3050-3650
      expect(wins.moverA).toBeGreaterThan(3050);
      expect(wins.moverA).toBeLessThan(3650);
      expect(wins.moverB).toBeGreaterThan(3050);
      expect(wins.moverB).toBeLessThan(3650);
      expect(wins.moverC).toBeGreaterThan(3050);
      expect(wins.moverC).toBeLessThan(3650);
    });
  });

  // ===========================================================================
  // Section 6: Fairness Testing (3 tests)
  // ===========================================================================
  describe('fairness testing', () => {
    it('should give each contestant ~50% win rate over 10000 trials', () => {
      const trials = 10000;
      const wins: Record<string, number> = { moverA: 0, moverB: 0 };

      for (let i = 0; i < trials; i++) {
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

        const result = resolveMovement([moverA, moverB], 1, initRNG(i));
        const winner = result.events.find(e => e.collided === false)?.characterId;
        if (winner) wins[winner]++;
      }

      // For n=10000, p=0.5: σ = 50, 3σ bounds: 4850-5150
      expect(wins.moverA).toBeGreaterThan(4850);
      expect(wins.moverA).toBeLessThan(5150);
      expect(wins.moverB).toBeGreaterThan(4850);
      expect(wins.moverB).toBeLessThan(5150);
    });

    it('should be fair regardless of slotPosition', () => {
      const trials = 10000;
      const wins: Record<string, number> = { moverA: 0, moverB: 0 };

      for (let i = 0; i < trials; i++) {
        const moverA = createCharacter({
          id: 'moverA',
          position: { x: 4, y: 5 },
          slotPosition: 99, // High slot position
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });
        const moverB = createCharacter({
          id: 'moverB',
          position: { x: 5, y: 4 },
          slotPosition: 0, // Low slot position
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });

        const result = resolveMovement([moverA, moverB], 1, initRNG(i));
        const winner = result.events.find(e => e.collided === false)?.characterId;
        if (winner) wins[winner]++;
      }

      expect(wins.moverA).toBeGreaterThan(4850);
      expect(wins.moverA).toBeLessThan(5150);
      expect(wins.moverB).toBeGreaterThan(4850);
      expect(wins.moverB).toBeLessThan(5150);
    });

    it('should be fair regardless of faction', () => {
      const trials = 10000;
      const wins: Record<string, number> = { friendly: 0, enemy: 0 };

      for (let i = 0; i < trials; i++) {
        const moverA = createCharacter({
          id: 'moverA',
          faction: 'friendly',
          position: { x: 4, y: 5 },
          slotPosition: 0,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });
        const moverB = createCharacter({
          id: 'moverB',
          faction: 'enemy',
          position: { x: 5, y: 4 },
          slotPosition: 1,
          currentAction: createMoveAction({ x: 5, y: 5 }, 1),
        });

        const result = resolveMovement([moverA, moverB], 1, initRNG(i));
        const winner = result.events.find(e => e.collided === false)?.characterId;
        if (winner === 'moverA') wins.friendly++;
        if (winner === 'moverB') wins.enemy++;
      }

      expect(wins.friendly).toBeGreaterThan(4850);
      expect(wins.friendly).toBeLessThan(5150);
      expect(wins.enemy).toBeGreaterThan(4850);
      expect(wins.enemy).toBeLessThan(5150);
    });
  });

  // ===========================================================================
  // Section 7: Edge Cases (7 tests)
  // ===========================================================================
  describe('edge cases', () => {
    it('should handle empty characters array', () => {
      const result = resolveMovement([], 1, initRNG(1000));

      expect(result.updatedCharacters).toHaveLength(0);
      expect(result.events).toHaveLength(0);
    });

    it('should not consume RNG when no collisions occur', () => {
      const mover = createCharacter({
        id: 'mover',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 1),
      });

      const initialState = initRNG(1000);
      const result = resolveMovement([mover], 1, initialState);

      expect(result.rngState).toBe(initialState); // Unchanged
    });

    it('should advance RNG when collision occurs', () => {
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

      const initialState = initRNG(1000);
      const result = resolveMovement([moverA, moverB], 1, initialState);

      expect(result.rngState).not.toBe(initialState); // Advanced
    });

    it('should block mover targeting cell occupied by outgoing mover (snapshot-based)', () => {
      const outgoingMover = createCharacter({
        id: 'outgoingMover',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 1), // Moving away
      });
      const incomingMover = createCharacter({
        id: 'incomingMover',
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1), // Moving into vacating cell
      });

      const result = resolveMovement([outgoingMover, incomingMover], 1, initRNG(1000));

      // Outgoing mover should succeed
      expect(result.updatedCharacters.find(c => c.id === 'outgoingMover')?.position).toEqual({ x: 6, y: 5 });
      // Incoming mover should be blocked (snapshot-based)
      expect(result.updatedCharacters.find(c => c.id === 'incomingMover')?.position).toEqual({ x: 4, y: 5 });
      expect(result.events.find(e => e.characterId === 'incomingMover')?.collided).toBe(true);
    });

    it('should prevent chain movement through vacating cells', () => {
      const charA = createCharacter({
        id: 'charA',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 6, y: 5 }, 1),
      });
      const charB = createCharacter({
        id: 'charB',
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const charC = createCharacter({
        id: 'charC',
        position: { x: 3, y: 5 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 4, y: 5 }, 1),
      });

      const result = resolveMovement([charA, charB, charC], 1, initRNG(1000));

      // A should move (unobstructed at start)
      expect(result.updatedCharacters.find(c => c.id === 'charA')?.position).toEqual({ x: 6, y: 5 });
      // B should be blocked by A's start position
      expect(result.updatedCharacters.find(c => c.id === 'charB')?.position).toEqual({ x: 4, y: 5 });
      // C should move (B didn't vacate)
      expect(result.updatedCharacters.find(c => c.id === 'charC')?.position).toEqual({ x: 3, y: 5 });
    });

    it('should preserve all character properties except position', () => {
      const mover = createCharacter({
        id: 'mover',
        name: 'TestMover',
        faction: 'friendly',
        position: { x: 5, y: 5 },
        hp: 75,
        maxHp: 100,
        slotPosition: 42,
        skills: [{ id: 'skill1', name: 'Skill', tickCost: 1, range: 1, enabled: true, triggers: [] }],
        currentAction: createMoveAction({ x: 6, y: 5 }, 1),
      });

      const result = resolveMovement([mover], 1, initRNG(1000));

      const updated = result.updatedCharacters.find(c => c.id === 'mover');
      expect(updated?.name).toBe('TestMover');
      expect(updated?.faction).toBe('friendly');
      expect(updated?.hp).toBe(75);
      expect(updated?.maxHp).toBe(100);
      expect(updated?.slotPosition).toBe(42);
      expect(updated?.skills).toHaveLength(1);
    });

    it('should handle hold action correctly (move to current cell)', () => {
      const holder = createCharacter({
        id: 'holder',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1), // Hold
      });

      const result = resolveMovement([holder], 1, initRNG(1000));

      expect(result.updatedCharacters.find(c => c.id === 'holder')?.position).toEqual({ x: 5, y: 5 });
      // Hold doesn't generate an event (acts as blocker, doesn't move)
      expect(result.events).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Section 8: Multiple Collision Groups (3 tests)
  // ===========================================================================
  describe('multiple collision groups', () => {
    it('should resolve independent collision groups separately', () => {
      // Group 1: Two movers to (5,5)
      const mover1A = createCharacter({
        id: 'mover1A',
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const mover1B = createCharacter({
        id: 'mover1B',
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      // Group 2: Two movers to (8,8)
      const mover2A = createCharacter({
        id: 'mover2A',
        position: { x: 7, y: 8 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 8, y: 8 }, 1),
      });
      const mover2B = createCharacter({
        id: 'mover2B',
        position: { x: 8, y: 7 },
        slotPosition: 3,
        currentAction: createMoveAction({ x: 8, y: 8 }, 1),
      });

      const result = resolveMovement([mover1A, mover1B, mover2A, mover2B], 1, initRNG(1000));

      // Each group should have exactly 1 winner
      const group1Events = result.events.filter(e => 
        e.characterId === 'mover1A' || e.characterId === 'mover1B'
      );
      const group2Events = result.events.filter(e => 
        e.characterId === 'mover2A' || e.characterId === 'mover2B'
      );
      expect(group1Events.filter(e => e.collided === false)).toHaveLength(1);
      expect(group2Events.filter(e => e.collided === false)).toHaveLength(1);
    });

    it('should consume RNG once per collision group', () => {
      // Two collision groups should advance RNG twice
      const mover1A = createCharacter({
        id: 'mover1A',
        position: { x: 4, y: 5 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const mover1B = createCharacter({
        id: 'mover1B',
        position: { x: 5, y: 4 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const mover2A = createCharacter({
        id: 'mover2A',
        position: { x: 7, y: 8 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 8, y: 8 }, 1),
      });
      const mover2B = createCharacter({
        id: 'mover2B',
        position: { x: 8, y: 7 },
        slotPosition: 3,
        currentAction: createMoveAction({ x: 8, y: 8 }, 1),
      });

      const initialState = initRNG(1000);
      const result = resolveMovement([mover1A, mover1B, mover2A, mover2B], 1, initialState);

      // Manually advance RNG twice to verify
      const afterOne = nextRandom(initialState);
      const afterTwo = nextRandom(afterOne.nextState);

      expect(result.rngState).toBe(afterTwo.nextState);
    });

    it('should process collision groups in deterministic order', () => {
      // Create collision groups at different target cells
      const moverA1 = createCharacter({
        id: 'moverA1',
        position: { x: 0, y: 0 },
        slotPosition: 0,
        currentAction: createMoveAction({ x: 2, y: 3 }, 1), // Target Y=3, X=2
      });
      const moverA2 = createCharacter({
        id: 'moverA2',
        position: { x: 1, y: 2 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 2, y: 3 }, 1),
      });
      const moverB1 = createCharacter({
        id: 'moverB1',
        position: { x: 4, y: 4 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1), // Target Y=5, X=5
      });
      const moverB2 = createCharacter({
        id: 'moverB2',
        position: { x: 5, y: 4 },
        slotPosition: 3,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const result1 = resolveMovement([moverA1, moverA2, moverB1, moverB2], 1, initRNG(1000));
      const result2 = resolveMovement([moverB1, moverB2, moverA1, moverA2], 1, initRNG(1000)); // Different order

      // Results should be identical regardless of input order
      expect(result1.rngState).toBe(result2.rngState);
    });
  });

  // ===========================================================================
  // Section 9: RNG State Management (6 tests)
  // ===========================================================================
  describe('RNG state management', () => {
    it('should return updated rngState in result', () => {
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

      const result = resolveMovement([moverA, moverB], 1, initRNG(1000));

      expect(result.rngState).toBeDefined();
      expect(typeof result.rngState).toBe('number');
    });

    it('should allow chaining rngState across multiple ticks', () => {
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

      const tick1Result = resolveMovement([moverA, moverB], 1, initRNG(1000));
      const tick2Result = resolveMovement([moverA, moverB], 2, tick1Result.rngState);

      expect(tick2Result.rngState).not.toBe(tick1Result.rngState);
    });

    it('should consume exactly one RNG call per two-way collision', () => {
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

      const initialState = initRNG(1000);
      const result = resolveMovement([moverA, moverB], 1, initialState);

      const expectedState = nextRandom(initialState).nextState;
      expect(result.rngState).toBe(expectedState);
    });

    it('should consume exactly one RNG call for N-way collision', () => {
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
      const moverC = createCharacter({
        id: 'moverC',
        position: { x: 6, y: 5 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const initialState = initRNG(1000);
      const result = resolveMovement([moverA, moverB, moverC], 1, initialState);

      const expectedState = nextRandom(initialState).nextState;
      expect(result.rngState).toBe(expectedState);
    });

    it('should not consume RNG when blocker prevents collision', () => {
      const blocker = createCharacter({
        id: 'blocker',
        position: { x: 5, y: 5 },
        slotPosition: 0,
        currentAction: null,
      });
      const moverA = createCharacter({
        id: 'moverA',
        position: { x: 4, y: 5 },
        slotPosition: 1,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });
      const moverB = createCharacter({
        id: 'moverB',
        position: { x: 5, y: 4 },
        slotPosition: 2,
        currentAction: createMoveAction({ x: 5, y: 5 }, 1),
      });

      const initialState = initRNG(1000);
      const result = resolveMovement([blocker, moverA, moverB], 1, initialState);

      expect(result.rngState).toBe(initialState); // Unchanged
    });

    it('should handle edge RNG values correctly (0.0 and 0.999...)', () => {
      // This test verifies that extreme RNG values select valid array indices
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

      // Try many seeds to potentially hit edge cases
      for (let seed = 0; seed < 1000; seed++) {
        const result = resolveMovement([moverA, moverB], 1, initRNG(seed));
        const winner = result.events.find(e => e.collided === false);
        expect(winner).toBeDefined();
        expect(['moverA', 'moverB']).toContain(winner?.characterId);
      }
    });
  });

  // ===========================================================================
  // Section 10: Stress Tests (1 test)
  // ===========================================================================
  describe('stress tests', () => {
    it('should handle 8-way collision', () => {
      const movers = [
        createCharacter({ id: 'mover0', position: { x: 4, y: 4 }, slotPosition: 0, currentAction: createMoveAction({ x: 5, y: 5 }, 1) }),
        createCharacter({ id: 'mover1', position: { x: 5, y: 4 }, slotPosition: 1, currentAction: createMoveAction({ x: 5, y: 5 }, 1) }),
        createCharacter({ id: 'mover2', position: { x: 6, y: 4 }, slotPosition: 2, currentAction: createMoveAction({ x: 5, y: 5 }, 1) }),
        createCharacter({ id: 'mover3', position: { x: 4, y: 5 }, slotPosition: 3, currentAction: createMoveAction({ x: 5, y: 5 }, 1) }),
        createCharacter({ id: 'mover4', position: { x: 6, y: 5 }, slotPosition: 4, currentAction: createMoveAction({ x: 5, y: 5 }, 1) }),
        createCharacter({ id: 'mover5', position: { x: 4, y: 6 }, slotPosition: 5, currentAction: createMoveAction({ x: 5, y: 5 }, 1) }),
        createCharacter({ id: 'mover6', position: { x: 5, y: 6 }, slotPosition: 6, currentAction: createMoveAction({ x: 5, y: 5 }, 1) }),
        createCharacter({ id: 'mover7', position: { x: 6, y: 6 }, slotPosition: 7, currentAction: createMoveAction({ x: 5, y: 5 }, 1) }),
      ];

      const result = resolveMovement(movers, 1, initRNG(1000));

      // Exactly 1 winner, 7 losers
      expect(result.events.filter(e => e.collided === false)).toHaveLength(1);
      expect(result.events.filter(e => e.collided === true)).toHaveLength(7);
      
      // Exactly 1 character at (5,5)
      const atTarget = result.updatedCharacters.filter(c => c.position.x === 5 && c.position.y === 5);
      expect(atTarget).toHaveLength(1);
    });
  });
});
