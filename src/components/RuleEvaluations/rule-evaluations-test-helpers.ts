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
      instanceId: "light-punch",
      name: "Light Punch",
      actionType: "attack",
      tickCost: 1,
      range: 1,
      damage: 10,
      behavior: "",
      enabled: true,
      triggers: [{ type: "enemy_in_range", value: 1 }],
      target: "enemy",
      criterion: "nearest",
    },
    {
      id: "move",
      instanceId: "move",
      name: "Move",
      actionType: "move",
      tickCost: 1,
      range: 0,
      behavior: "towards",
      enabled: true,
      triggers: [{ type: "always" }],
      target: "enemy",
      criterion: "nearest",
    },
    {
      id: "heavy-punch",
      instanceId: "heavy-punch",
      name: "Heavy Punch",
      actionType: "attack",
      tickCost: 2,
      range: 2,
      damage: 25,
      behavior: "",
      enabled: false,
      triggers: [{ type: "enemy_in_range", value: 1 }],
      target: "enemy",
      criterion: "nearest",
    },
  ];

  return {
    id: "char-1",
    name: "Fighter",
    faction: "friendly",
    slotPosition: 2,
    hp: 100,
    maxHp: 100,
    position: { q: 0, r: 0 },
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
    slotPosition: 2,
    hp: 100,
    maxHp: 100,
    position: { q: 1, r: 0 },
    skills: [],
    currentAction: null,
  };
}

// Optional: Helper to create attack action (could be used across tests)
export function createAttackAction(
  skillId: string,
  skillName: string,
  targetCell: { q: number; r: number },
  targetCharacter: Character | null,
  startedAtTick: number,
  resolvesAtTick: number,
): Action {
  return {
    type: "attack",
    skill: {
      id: skillId,
      instanceId: skillId,
      name: skillName,
      actionType: "attack",
      tickCost: resolvesAtTick - startedAtTick,
      range: 1,
      damage: 10,
      behavior: "",
      enabled: true,
      triggers: [],
      target: "enemy",
      criterion: "nearest",
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
  behavior: "towards" | "away",
  targetCell: { q: number; r: number },
  startedAtTick: number,
  resolvesAtTick: number,
): Action {
  return {
    type: "move",
    skill: {
      id: skillId,
      instanceId: skillId,
      name: skillName,
      actionType: "move",
      tickCost: resolvesAtTick - startedAtTick,
      range: 0,
      behavior,
      enabled: true,
      triggers: [],
      target: "enemy",
      criterion: "nearest",
    },
    targetCell,
    targetCharacter: null,
    startedAtTick,
    resolvesAtTick,
  };
}

// Helper to create idle action
export function createIdleAction(): Action {
  return {
    type: "idle",
    skill: {
      id: "idle",
      instanceId: "idle",
      name: "Idle",
      actionType: "attack",
      tickCost: 1,
      range: 0,
      behavior: "",
      enabled: true,
      triggers: [],
      target: "enemy",
      criterion: "nearest",
    },
    targetCell: { q: 0, r: 0 },
    targetCharacter: null,
    startedAtTick: 0,
    resolvesAtTick: 1,
  };
}
