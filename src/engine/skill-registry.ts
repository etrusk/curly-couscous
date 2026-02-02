/**
 * Centralized skill registry - single source of truth for all skill definitions.
 * This is the ONLY file that needs to be edited to add/remove/modify skills.
 */

import type { Skill } from "./types";

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
  mode?: "towards" | "away";
  innate: boolean;
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
  },
  {
    id: "heavy-punch",
    name: "Heavy Punch",
    tickCost: 2,
    range: 2,
    damage: 25,
    innate: false,
  },
  {
    id: "move-towards",
    name: "Move",
    tickCost: 1,
    range: 1,
    mode: "towards",
    innate: true,
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
    name: def.mode ? `${def.name} Towards` : def.name, // Move -> "Move Towards"
    tickCost: def.tickCost,
    range: def.range,
    ...(def.damage !== undefined ? { damage: def.damage } : {}),
    ...(def.mode !== undefined ? { mode: def.mode } : {}),
    enabled: true,
    triggers: [{ type: "always" as const }],
    selectorOverride: { type: "nearest_enemy" as const },
  }));
}

/**
 * Create a Skill instance from a SkillDefinition with default behavioral config.
 * Used when assigning skills from inventory to characters.
 */
export function createSkillFromDefinition(def: SkillDefinition): Skill {
  return {
    id: def.id,
    name: def.mode ? `${def.name} Towards` : def.name,
    tickCost: def.tickCost,
    range: def.range,
    ...(def.damage !== undefined ? { damage: def.damage } : {}),
    ...(def.mode !== undefined ? { mode: def.mode } : {}),
    enabled: true,
    triggers: [{ type: "always" as const }],
    selectorOverride: { type: "nearest_enemy" as const },
  };
}
