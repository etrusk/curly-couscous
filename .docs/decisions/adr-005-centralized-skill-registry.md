# ADR-005: Centralized Skill Registry

**Date:** 2026-01-30
**Status:** Accepted

## Decision

Create `src/engine/skill-registry.ts` as the single source of truth for all skill definitions in the game. Both `DEFAULT_SKILLS` (character initialization) and the Inventory section UI derive from this registry. Skills are classified as "innate" (automatically assigned to characters) or "assignable" (manually assigned from inventory).

## Context

The task required replacing the empty placeholder panel with an Inventory panel showing available skills. User feedback emphasized that adding/removing skills should require changes in only one file. The original implementation had `DEFAULT_SKILLS` as a hand-written constant in `gameStore-constants.ts`, which would have required parallel changes if a separate inventory constant were maintained.

## Options Considered

1. **Separate AVAILABLE_SKILLS constant** -- Duplicates skill data between inventory display and character initialization. Violates single-source-of-truth.
2. **Centralized registry in engine layer** -- Single file defines all skills; both consumers derive from it. (Chosen)
3. **Config file (JSON)** -- External configuration. Overkill for 3 skills, adds parsing complexity.

## Decision Rationale

Option 2 provides:

- Single file to edit when adding/removing/modifying skills
- Clean dependency direction (UI depends on engine, not reverse)
- Natural home alongside `types.ts` in the engine layer
- `SkillDefinition` captures intrinsic properties; `Skill` adds behavioral configuration -- clean separation

## Consequences

- Adding/removing/editing a skill requires changes only in `skill-registry.ts`
- `DEFAULT_SKILLS` is now derived rather than hand-written
- New `SkillDefinition` type introduced alongside existing `Skill` type
- Slight increase in abstraction for 3 skills, but pays off as skill count grows
- `gameStore.ts` gained `assignSkillToCharacter` and `removeSkillFromCharacter` actions that reference the registry
