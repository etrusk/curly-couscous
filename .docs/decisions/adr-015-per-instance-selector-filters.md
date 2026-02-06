# ADR-015: Per-Instance Selector Filters

## Decision

Selector filters are per-instance configuration on the `Skill` interface (not per-definition in the skill registry), following the same pattern as triggers.

## Date

2026-02-06

## Context

The selector filter feature adds optional target validation (e.g., `hp_below 50%`) that runs after the selector picks a target but before the range check. The design question was whether filters should be part of the skill definition (in the registry) or part of the skill instance (configured per character).

## Options Considered

1. **Per-definition (registry-level)**: Filter baked into skill definitions in `skill-registry.ts`
2. **Per-instance (Skill interface)**: Filter as optional field on the `Skill` interface, configured per instance

## Decision Rationale

Per-instance configuration was chosen because:

- Filters are tactical refinements that players configure differently per character and per priority slot
- Consistent with triggers, which are also per-instance (not per-definition)
- No changes needed to `SkillDefinition` or `skill-registry.ts`
- Duplicated skill instances (ADR-009) can have independent filter configurations
- The existing `updateSkill` store action handles `Partial<Skill>` and works without modification

## Consequences

- Filter state lives on the `Skill` interface alongside `triggers`, `target`, and `criterion`
- `selectorFilter?: SelectorFilter` is optional -- skills without it behave exactly as before
- The store's `updateSkill` action already supports partial updates, so no store changes needed
- Future filter types (e.g., `has_buff`, `distance_below`) can be added to the `SelectorFilterType` union without structural changes
