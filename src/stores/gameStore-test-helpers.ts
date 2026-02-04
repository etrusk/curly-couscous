/**
 * Shared test helpers for gameStore tests.
 * Extracted from gameStore.test.ts to avoid duplication across split test modules.
 */

import type { Character, Skill } from "../engine/types";

/**
 * Helper to create a minimal character for testing.
 */
export const createCharacter = (
  overrides: Partial<Character> & { id: string },
): Character => ({
  id: overrides.id,
  name: overrides.name ?? `Character ${overrides.id}`,
  faction: overrides.faction ?? "friendly",
  slotPosition: overrides.slotPosition ?? 0,
  hp: overrides.hp ?? 100,
  maxHp: overrides.maxHp ?? 100,
  position: overrides.position ?? { q: 0, r: 0 },
  skills: overrides.skills ?? [],
  currentAction: overrides.currentAction ?? null,
});

/**
 * Helper to create skills with minimal boilerplate.
 */
export const createSkill = (
  overrides: Partial<Skill> & { id: string },
): Skill => ({
  id: overrides.id,
  instanceId: overrides.instanceId ?? overrides.id, // Default instanceId to id for backward compatibility
  name: overrides.name ?? `Skill-${overrides.id}`,
  tickCost: overrides.tickCost ?? 1,
  range: overrides.range ?? 1,
  damage: overrides.damage ?? undefined,
  mode: overrides.mode ?? undefined,
  enabled: overrides.enabled ?? true,
  triggers: overrides.triggers ?? [{ type: "always" }],
  selectorOverride: overrides.selectorOverride ?? undefined,
});
