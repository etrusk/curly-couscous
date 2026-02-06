# ADR-011: Reshape Skill System with Universal Behavior and Target+Criterion Split

**Date:** 2026-02-05
**Status:** Accepted

## Decision

Reshape the skill data model in three coordinated changes: (1) add universal `behavior` field replacing Move-specific `mode`, (2) split monolithic `Selector` type into separate `target` and `criterion` fields, and (3) extend skill duplication from Move-only to all skills via registry-defined `maxInstances`.

## Context

The skill system had grown organically with special-case fields:

- Move was the only skill with a `mode` field ("towards"/"away"), making it structurally different from Attack and Heal skills.
- The `Selector` type (`nearest_enemy`, `lowest_hp_ally`, etc.) combined two orthogonal concepts -- who to target (enemy/ally/self) and how to pick (nearest/lowest_hp) -- into a single flattened enum. Adding new criteria (furthest, highest_hp) would require N x M new enum values.
- Skill duplication was hardcoded to Move only via a `MAX_MOVE_INSTANCES` constant and `mode !== undefined` guard.

Additionally, `getActionType()` inferred skill category from the presence of optional fields (`damage` => attack, `healing` => heal, `mode` => move). Removing `mode` broke this inference, requiring explicit `actionType`.

## Options Considered

### Action Type

1. **Explicit `actionType` field** -- Every skill declares its category. Simple, unambiguous. (Chosen)
2. **Registry-based lookup** -- Map skill name to action type via separate table. Adds indirection.
3. **Behavior-value inference** -- If behavior is "towards"/"away" => move. Fragile for future behaviors.

### Targeting

1. **Keep flattened Selector enum** -- Simple but O(N\*M) growth. Rejected.
2. **Split into Target + Criterion** -- Orthogonal, composable, O(N+M) growth. (Chosen)

### Duplication

1. **Keep Move-only hardcoded limit** -- Simple but prevents future duplicatable skills. Rejected.
2. **Registry-defined `maxInstances`** -- Universal, data-driven. (Chosen)

## Decision Rationale

The three changes are tightly coupled: removing `mode` requires `actionType` (to replace inference), and universal `behavior` enables universal duplication logic. Delivering them together avoids intermediate states where the data model is partially migrated.

The `target` + `criterion` split is independently motivated (to add `furthest` and `highest_hp` criteria without enum explosion) but pairs naturally with the refactor since both touch the `Skill` interface.

## Consequences

### Benefits

- (+) Every skill has identical shape: trigger + target + criterion + behavior
- (+) No special-case field detection (`mode !== undefined`, `damage !== undefined`)
- (+) Adding new criteria is O(1): just add to the `Criterion` union type
- (+) Adding new targets is O(1): just add to the `Target` union type
- (+) Any future skill can be made duplicatable by setting `maxInstances > 1`
- (+) `getActionType()` is now a simple field read instead of inference logic

### Tradeoffs

- (-) Large mechanical refactor: ~30 test files updated for `mode` -> `behavior` and `selectorOverride` -> `target`/`criterion`
- (-) `behavior: string` is loosely typed (not a union) to support arbitrary future behaviors. Registry `behaviors` array constrains valid values at runtime.
- (-) ~~`evaluateSelector()` retained alongside `evaluateTargetCriterion()` for backward compatibility with 8 existing test files~~ -- Cleaned up 2026-02-06: all 26 call sites migrated, `evaluateSelector` function and `Selector` type deleted

### Related Decisions

- Reinforces ADR-005 (centralized registry as single source of truth)
- Extends ADR-009 (instance identity) to all skills via `maxInstances`
- No conflict with ADR-006 (heal resolution order) or ADR-010 (movement before combat)
