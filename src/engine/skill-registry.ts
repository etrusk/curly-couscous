/**
 * Centralized skill registry - single source of truth for all skill definitions.
 * This is the ONLY file that needs to be edited to add/remove/modify skills.
 */

import type { Skill, Selector } from "./types";

/**
 * Module-level counter for generating unique instance IDs.
 * Monotonically increasing to prevent collisions across all skill instances.
 */
let instanceIdCounter = 0;

/**
 * Generate a unique instance ID for a skill.
 * Pattern: `${registryId}-${counter++}` (e.g., "move-towards-1", "move-towards-2")
 */
export function generateInstanceId(registryId: string): string {
  return `${registryId}-${++instanceIdCounter}`;
}

/**
 * Intrinsic properties of a skill -- the identity and stats.
 * This is the source of truth. Other representations derive from this.
 */
export interface SkillDefinition {
  id: string;
  name: string;
  tickCost: number;
  range: number;
  damage?: number;
  healing?: number;
  mode?: "towards" | "away";
  innate: boolean;
  defaultSelector?: Selector;
}

/**
 * All skills available in the game.
 * Add or remove skills HERE -- this is the only place to change.
 */
export const SKILL_REGISTRY: readonly SkillDefinition[] = [
  {
    id: "light-punch",
    name: "Light Punch",
    tickCost: 0,
    range: 1,
    damage: 10,
    innate: false,
    defaultSelector: { type: "nearest_enemy" },
  },
  {
    id: "heavy-punch",
    name: "Heavy Punch",
    tickCost: 2,
    range: 2,
    damage: 25,
    innate: false,
    defaultSelector: { type: "nearest_enemy" },
  },
  {
    id: "move-towards",
    name: "Move",
    tickCost: 1,
    range: 1,
    mode: "towards",
    innate: true,
    defaultSelector: { type: "nearest_enemy" },
  },
  {
    id: "heal",
    name: "Heal",
    tickCost: 2,
    range: 5,
    healing: 25,
    innate: false,
    defaultSelector: { type: "lowest_hp_ally" },
  },
];

/**
 * Default configuration applied when creating a Skill from a SkillDefinition.
 * This adds the "behavioral" fields (enabled, triggers, selectorOverride)
 * that are not intrinsic to the skill itself.
 *
 * IMPORTANT: Only returns innate skills. Non-innate skills must be assigned
 * from the inventory.
 */
export function getDefaultSkills(): Skill[] {
  return SKILL_REGISTRY.filter((def) => def.innate).map((def) => ({
    id: def.id,
    instanceId: generateInstanceId(def.id),
    name: def.name, // Use registry name directly ("Move", not "Move Towards")
    tickCost: def.tickCost,
    range: def.range,
    ...(def.damage !== undefined ? { damage: def.damage } : {}),
    ...(def.healing !== undefined ? { healing: def.healing } : {}),
    ...(def.mode !== undefined ? { mode: def.mode } : {}),
    enabled: true,
    triggers: [{ type: "always" as const }],
    selectorOverride: def.defaultSelector ?? { type: "nearest_enemy" as const },
  }));
}

/**
 * Create a Skill instance from a SkillDefinition with default behavioral config.
 * Used when assigning skills from inventory to characters.
 */
export function createSkillFromDefinition(def: SkillDefinition): Skill {
  return {
    id: def.id,
    instanceId: generateInstanceId(def.id),
    name: def.name, // Use registry name directly
    tickCost: def.tickCost,
    range: def.range,
    ...(def.damage !== undefined ? { damage: def.damage } : {}),
    ...(def.healing !== undefined ? { healing: def.healing } : {}),
    ...(def.mode !== undefined ? { mode: def.mode } : {}),
    enabled: true,
    triggers: [{ type: "always" as const }],
    selectorOverride: def.defaultSelector ?? { type: "nearest_enemy" as const },
  };
}
