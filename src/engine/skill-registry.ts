/**
 * Centralized skill registry - single source of truth for all skill definitions.
 * This is the ONLY file that needs to be edited to add/remove/modify skills.
 */

import type {
  Skill,
  Target,
  Criterion,
  TriggerScope,
  ConditionType,
} from "./types";

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
  actionType: "attack" | "move" | "heal" | "interrupt" | "charge";
  tickCost: number;
  range: number;
  damage?: number;
  healing?: number;
  distance?: number;
  behaviors: string[]; // Available behaviors for this skill
  defaultBehavior: string; // Default behavior value
  innate: boolean;
  defaultTarget: Target;
  defaultCriterion: Criterion;
  targetingMode: "cell" | "character"; // How targets are tracked during resolution
  cooldown?: number; // Optional cooldown ticks after use
  defaultTrigger?: {
    scope: "enemy" | "ally" | "self";
    condition: string;
    conditionValue?: number;
  };
  defaultFilter?: {
    condition: string;
    conditionValue?: number;
    qualifier?: { type: "action" | "skill"; id: string };
  };
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
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
    targetingMode: "cell",
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
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
    targetingMode: "cell",
    cooldown: 3,
  },
  {
    id: "move-towards",
    name: "Move",
    actionType: "move",
    tickCost: 1,
    range: 1,
    distance: 1,
    behaviors: ["towards", "away"],
    defaultBehavior: "towards",
    innate: true,
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
    targetingMode: "cell",
    cooldown: 1,
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
    defaultTarget: "ally",
    defaultCriterion: "lowest_hp",
    targetingMode: "character",
  },
  {
    id: "ranged-attack",
    name: "Ranged Attack",
    actionType: "attack",
    tickCost: 1,
    range: 4,
    damage: 15,
    behaviors: [],
    defaultBehavior: "",
    innate: false,
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
    targetingMode: "cell",
    cooldown: 2,
  },
  {
    id: "dash",
    name: "Dash",
    actionType: "move",
    tickCost: 0,
    range: 1,
    distance: 2,
    behaviors: ["towards", "away"],
    defaultBehavior: "away",
    innate: false,
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
    targetingMode: "cell",
    cooldown: 3,
  },
  {
    id: "kick",
    name: "Kick",
    actionType: "interrupt",
    tickCost: 0,
    range: 1,
    damage: 0,
    behaviors: [],
    defaultBehavior: "",
    innate: false,
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
    targetingMode: "cell",
    cooldown: 4,
    defaultTrigger: { scope: "enemy", condition: "channeling" },
    defaultFilter: { condition: "channeling" },
  },
  {
    id: "charge",
    name: "Charge",
    actionType: "charge",
    tickCost: 1,
    range: 3,
    damage: 20,
    distance: 3,
    behaviors: [],
    defaultBehavior: "",
    innate: false,
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
    targetingMode: "cell",
    cooldown: 3,
    defaultTrigger: {
      scope: "enemy",
      condition: "in_range",
      conditionValue: 3,
    },
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
    ...(def.distance !== undefined ? { distance: def.distance } : {}),
    behavior: def.defaultBehavior,
    enabled: true,
    trigger: def.defaultTrigger
      ? {
          scope: def.defaultTrigger.scope as TriggerScope,
          condition: def.defaultTrigger.condition as ConditionType,
          ...(def.defaultTrigger.conditionValue !== undefined
            ? { conditionValue: def.defaultTrigger.conditionValue }
            : {}),
        }
      : { scope: "enemy" as const, condition: "always" as const },
    target: def.defaultTarget,
    criterion: def.defaultCriterion,
    ...(def.defaultFilter
      ? {
          filter: {
            condition: def.defaultFilter.condition as ConditionType,
            ...(def.defaultFilter.conditionValue !== undefined
              ? { conditionValue: def.defaultFilter.conditionValue }
              : {}),
            ...(def.defaultFilter.qualifier
              ? { qualifier: def.defaultFilter.qualifier }
              : {}),
          },
        }
      : {}),
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
    ...(def.distance !== undefined ? { distance: def.distance } : {}),
    behavior: def.defaultBehavior,
    enabled: true,
    trigger: def.defaultTrigger
      ? {
          scope: def.defaultTrigger.scope as TriggerScope,
          condition: def.defaultTrigger.condition as ConditionType,
          ...(def.defaultTrigger.conditionValue !== undefined
            ? { conditionValue: def.defaultTrigger.conditionValue }
            : {}),
        }
      : { scope: "enemy" as const, condition: "always" as const },
    target: def.defaultTarget,
    criterion: def.defaultCriterion,
    ...(def.defaultFilter
      ? {
          filter: {
            condition: def.defaultFilter.condition as ConditionType,
            ...(def.defaultFilter.conditionValue !== undefined
              ? { conditionValue: def.defaultFilter.conditionValue }
              : {}),
            ...(def.defaultFilter.qualifier
              ? { qualifier: def.defaultFilter.qualifier }
              : {}),
          },
        }
      : {}),
  };
}

/**
 * Get a skill definition from the registry by its ID.
 * Used for looking up skill properties like behaviors, range, etc.
 */
export function getSkillDefinition(id: string): SkillDefinition | undefined {
  return SKILL_REGISTRY.find((def) => def.id === id);
}
