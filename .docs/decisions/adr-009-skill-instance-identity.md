# ADR-009: Instance Identity for Skill Duplication

## Decision

Add `instanceId` field to the `Skill` interface, separate from the registry `id`, to support multiple instances of the same skill on a single character.

## Date

2026-02-04

## Status

Accepted

## Context

The Move skill duplication feature requires multiple instances of the same registry skill on one character. The existing `id` field served three conflicting roles:

1. **Registry lookup** -- identifying which skill definition this instance comes from
2. **Instance uniqueness** -- distinguishing individual skill instances for targeted updates/removal
3. **React keys** -- providing unique keys for rendering lists

With duplication, multiple skills share the same registry `id`, causing React key collisions and making it impossible to target a specific instance for updates or removal.

## Options Considered

1. **Composite key (id + index)** -- Fragile; indices shift when skills are reordered or removed.
2. **UUID-based instanceId** -- Overkill for client-side-only usage; harder to debug.
3. **Counter-based instanceId** -- Simple, deterministic within a session, debuggable format.

## Decision Rationale

Option 3 (counter-based instanceId) chosen. A module-level counter generates IDs like `move-towards-1`, `move-towards-2`. Benefits:

- **Simple**: No external dependencies, no UUID library needed.
- **Debuggable**: IDs are human-readable and include the registry ID.
- **Collision-free**: Monotonically increasing counter never resets within a session.
- **Backward compatible**: Test helpers default `instanceId` to `id`, so existing tests work unchanged.

## Consequences

- All store actions operating on individual skill instances (`updateSkill`, `removeSkillFromCharacter`) now use `instanceId` instead of `id`.
- All React keys for skill lists use `instanceId`.
- Registry lookups (innate detection, faction exclusivity) continue using `id`.
- `generateInstanceId()` function added to `skill-registry.ts`.
- Character creation must call `getDefaultSkills()` directly (not clone a static array) to ensure unique instanceIds.
- Future: If persistence is added, instanceId generation must account for session boundaries.
