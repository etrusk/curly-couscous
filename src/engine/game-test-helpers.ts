/**
 * Shared test helpers for game engine tests.
 * Consolidates duplicate helper functions across test files.
 */

import { GameState, Character, Skill, Action } from "./types";
import { initRNG } from "./movement";

/**
 * Test helper to create a minimal game state.
 */
export function createGameState(overrides: Partial<GameState> = {}): GameState {
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
export function createCharacter(
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
export function createSkill(overrides: Partial<Skill> & { id: string }): Skill {
  return {
    id: overrides.id,
    name: overrides.name ?? `Skill-${overrides.id}`,
    tickCost: overrides.tickCost ?? 1,
    range: overrides.range ?? 1,
    damage: overrides.damage,
    healing: overrides.healing,
    mode: overrides.mode,
    enabled: overrides.enabled ?? true,
    triggers: overrides.triggers ?? [],
    selectorOverride: overrides.selectorOverride,
  };
}

/**
 * Test helper to create attack actions.
 */
export function createAttackAction(
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
    startedAtTick: resolveTick - tickCost,
    resolvesAtTick: resolveTick,
  };
}

/**
 * Test helper to create move actions.
 */
export function createMoveAction(
  targetCell: { x: number; y: number },
  resolveTick: number,
): Action {
  const tickCost = 1;
  return {
    type: "move",
    skill: createSkill({ id: "test-move", mode: "towards", tickCost }),
    targetCell,
    targetCharacter: null,
    startedAtTick: resolveTick - tickCost,
    resolvesAtTick: resolveTick,
  };
}

/**
 * Test helper to create heal actions.
 */
export function createHealAction(
  targetCell: { x: number; y: number },
  healing: number,
  resolveTick: number,
): Action {
  return {
    type: "heal",
    skill: createSkill({ id: "test-heal", healing, tickCost: 0 }),
    targetCell,
    targetCharacter: null,
    startedAtTick: resolveTick,
    resolvesAtTick: resolveTick,
  };
}

// Re-export initRNG for consistency
export { initRNG };
