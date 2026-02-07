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
  actionType:
    overrides.actionType ??
    (overrides.damage !== undefined
      ? "attack"
      : overrides.healing !== undefined
        ? "heal"
        : overrides.behavior
          ? "move"
          : "attack"),
  tickCost: overrides.tickCost ?? 1,
  range: overrides.range ?? 1,
  damage: overrides.damage ?? undefined,
  behavior: overrides.behavior ?? "",
  enabled: overrides.enabled ?? true,
  trigger: overrides.trigger ?? {
    scope: "enemy" as const,
    condition: "always" as const,
  },
  target: overrides.target ?? "enemy",
  criterion: overrides.criterion ?? "nearest",
});
