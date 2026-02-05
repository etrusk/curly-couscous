/**
 * Centralized skill registry - single source of truth for all skill definitions.
 * This is the ONLY file that needs to be edited to add/remove/modify skills.
 */

import type { Skill, Target, Criterion } from "./types";

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
  actionType: "attack" | "move" | "heal";
  tickCost: number;
  range: number;
  damage?: number;
  healing?: number;
  behaviors: string[]; // Available behaviors for this skill
  defaultBehavior: string; // Default behavior value
  innate: boolean;
  maxInstances: number; // Max duplicates per character
  defaultTarget: Target;
  defaultCriterion: Criterion;
}

/**
 * All skills available in the game.
 * Add or remove skills HERE -- this is the only place to change.
 */
export const SKILL_REGISTRY: readonly SkillDefinition[] = [
  {
    id: "light-punch",
    name: "Light Punch",
    actionType: "attack",
    tickCost: 0,
    range: 1,
    damage: 10,
    behaviors: [],
    defaultBehavior: "",
    innate: false,
    maxInstances: 1,
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
  },
  {
    id: "heavy-punch",
    name: "Heavy Punch",
    actionType: "attack",
    tickCost: 2,
    range: 2,
    damage: 25,
    behaviors: [],
    defaultBehavior: "",
    innate: false,
    maxInstances: 1,
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
  },
  {
    id: "move-towards",
    name: "Move",
    actionType: "move",
    tickCost: 1,
    range: 1,
    behaviors: ["towards", "away"],
    defaultBehavior: "towards",
    innate: true,
    maxInstances: 3,
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
  },
  {
    id: "heal",
    name: "Heal",
    actionType: "heal",
    tickCost: 2,
    range: 5,
    healing: 25,
    behaviors: [],
    defaultBehavior: "",
    innate: false,
    maxInstances: 1,
    defaultTarget: "ally",
    defaultCriterion: "lowest_hp",
  },
];

/**
 * Default configuration applied when creating a Skill from a SkillDefinition.
 * This adds the "behavioral" fields (enabled, triggers, target, criterion)
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
    actionType: def.actionType,
    tickCost: def.tickCost,
    range: def.range,
    ...(def.damage !== undefined ? { damage: def.damage } : {}),
    ...(def.healing !== undefined ? { healing: def.healing } : {}),
    behavior: def.defaultBehavior,
    enabled: true,
    triggers: [{ type: "always" as const }],
    target: def.defaultTarget,
    criterion: def.defaultCriterion,
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
    actionType: def.actionType,
    tickCost: def.tickCost,
    range: def.range,
    ...(def.damage !== undefined ? { damage: def.damage } : {}),
    ...(def.healing !== undefined ? { healing: def.healing } : {}),
    behavior: def.defaultBehavior,
    enabled: true,
    triggers: [{ type: "always" as const }],
    target: def.defaultTarget,
    criterion: def.defaultCriterion,
  };
}

/**
 * Get a skill definition from the registry by its ID.
 * Used for looking up skill properties like maxInstances, behaviors, etc.
 */
export function getSkillDefinition(id: string): SkillDefinition | undefined {
  return SKILL_REGISTRY.find((def) => def.id === id);
}
