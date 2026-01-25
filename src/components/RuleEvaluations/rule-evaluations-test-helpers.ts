/**
 * Shared test helpers for RuleEvaluations component tests.
 * Consolidates helper functions used across test modules.
 */

import type { Character, Skill, Action } from "../../engine/types";

// Helper to create test character with default skills (Light Punch, Move, Heavy Punch)
export function createCharacter(overrides: Partial<Character> = {}): Character {
  const defaultSkills: Skill[] = [
    {
      id: "light-punch",
      name: "Light Punch",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [{ type: "enemy_in_range", value: 1 }],
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "move",
      name: "Move",
      tickCost: 1,
      range: 0,
      mode: "towards",
      enabled: true,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "heavy-punch",
      name: "Heavy Punch",
      tickCost: 2,
      range: 2,
      damage: 25,
      enabled: false,
      triggers: [{ type: "enemy_in_range", value: 1 }],
      selectorOverride: { type: "nearest_enemy" },
    },
  ];

  return {
    id: "char-1",
    name: "Fighter",
    faction: "friendly",
    slotPosition: 0,
    hp: 100,
    maxHp: 100,
    position: { x: 0, y: 0 },
    skills: defaultSkills,
    currentAction: null,
    ...overrides,
  };
}

// Helper to create target character (enemy)
export function createTarget(): Character {
  return {
    id: "enemy-1",
    name: "Enemy1",
    faction: "enemy",
    slotPosition: 1,
    hp: 100,
    maxHp: 100,
    position: { x: 1, y: 0 },
    skills: [],
    currentAction: null,
  };
}

// Optional: Helper to create attack action (could be used across tests)
export function createAttackAction(
  skillId: string,
  skillName: string,
  targetCell: { x: number; y: number },
  targetCharacter: Character | null,
  startedAtTick: number,
  resolvesAtTick: number,
): Action {
  return {
    type: "attack",
    skill: {
      id: skillId,
      name: skillName,
      tickCost: resolvesAtTick - startedAtTick + 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [],
    },
    targetCell,
    targetCharacter,
    startedAtTick,
    resolvesAtTick,
  };
}

// Optional: Helper to create move action
export function createMoveAction(
  skillId: string,
  skillName: string,
  mode: "towards" | "away" | "hold",
  targetCell: { x: number; y: number },
  startedAtTick: number,
  resolvesAtTick: number,
): Action {
  return {
    type: "move",
    skill: {
      id: skillId,
      name: skillName,
      tickCost: resolvesAtTick - startedAtTick + 1,
      range: 0,
      mode,
      enabled: true,
      triggers: [],
    },
    targetCell,
    targetCharacter: null,
    startedAtTick,
    resolvesAtTick,
  };
}
