# SYNC_DOCS: Documentation Updates

This file contains the exact content for all documentation changes needed to complete the skill system refactor.

## 1. Update `.docs/spec.md` -- Targeting System Section (lines 140-159)

### Replace lines 140-159 with:

```markdown
## Targeting System

### Target and Criterion

Each skill specifies a **target** (which group to select from) and a **criterion** (how to pick within that group).

**Targets:**

| Target  | Description                          |
| ------- | ------------------------------------ |
| `enemy` | Select from living enemy characters  |
| `ally`  | Select from living allies (not self) |
| `self`  | Target self (ignores criterion)      |

**Criteria:**

| Criterion    | Description              |
| ------------ | ------------------------ |
| `nearest`    | Closest by hex distance  |
| `furthest`   | Farthest by hex distance |
| `lowest_hp`  | Lowest current HP        |
| `highest_hp` | Highest current HP       |

3 targets x 4 criteria = 12 combinations, but `self` target always returns the evaluator regardless of criterion.

**Tiebreaking:** Lower R coordinate, then lower Q coordinate (consistent across all target+criterion combinations).

### Trigger Conditions

- `enemy_in_range X`: Any enemy within X hexes
- `ally_in_range X`: Any ally within X hexes
- `hp_below X%`: Own HP below X%
- `my_cell_targeted_by_enemy`: Enemy has locked-in action targeting this hex

**Note:** `my_cell_targeted_by_enemy` detects any pending action targeting the cell. Wind-up actions (tickCost >= 1) have at least 1 tick of visibility before resolution. Instant actions (tickCost: 0) resolve the same tick they are chosen, so they cannot be dodged via this trigger.
```

## 2. Update `.docs/spec.md` -- Starting Skills Section (lines 60-138)

### Replace lines 60-138 with:

```markdown
## Starting Skills

### Innate vs Assignable Skills

Skills are classified as **innate** or **assignable**:

- **Innate skills** are automatically granted to new characters and cannot be removed. Move is the only innate skill.
- **Assignable skills** must be manually assigned from the Inventory panel. They can be added to or removed from characters freely.

New characters start with only innate skills. Players build their skill loadout by assigning skills from the shared inventory.

### Universal Skill Shape

Every skill instance has a uniform shape with four configurable fields:

- **Trigger**: Conditions that must be met for the skill to activate (AND logic)
- **Target**: Which group to select from (`enemy`, `ally`, or `self`)
- **Criterion**: How to pick within the target group (`nearest`, `furthest`, `lowest_hp`, `highest_hp`)
- **Behavior**: Action-specific modifier (e.g., `towards`/`away` for Move; empty string for skills without behavior choices)

This uniform shape means all skills are configured identically in the UI. The `behavior` field replaces Move's former `mode` field and is now universal to all skills.

### Skill Definitions

Each skill in the registry declares:

- `actionType`: Category (`attack`, `move`, or `heal`)
- `behaviors`: Available behavior values (e.g., `["towards", "away"]` for Move; `[]` for others)
- `defaultBehavior`: Default behavior when first assigned
- `maxInstances`: Maximum duplicates per character (Move: 3, all others: 1)
- `defaultTarget` and `defaultCriterion`: Defaults when first assigned

### Light Punch

- Tick cost: 0, Range: 1 (melee), Damage: 10
- Default target: enemy, Default criterion: nearest
- Fast and instant. Resolves immediately with no wind-up.
- **Assignable** (not innate), maxInstances: 1

### Heavy Punch

- Tick cost: 2, Range: 2, Damage: 25
- Default target: enemy, Default criterion: nearest
- Slow but powerful. 2-tick wind-up creates dodge window.
- **Assignable** (not innate), maxInstances: 1

### Heal

- Tick cost: 2, Range: 5, Healing: 25
- Default target: ally, Default criterion: lowest_hp
- Supportive skill. 2-tick wind-up with cell-based targeting (locks to target's cell at decision time).
- Heals target for 25 HP, capped at maxHp.
- Cannot target characters at full HP (rejected as no_target if no wounded allies in range).
- Healing resolves before combat in the Resolution Phase (ADR-006), making last-moment saves possible.
- **Assignable** (not innate), maxInstances: 1

### Skill Categories

Skills fall into three action categories:

- **Attack** (damage): Deal damage to enemies. Light Punch, Heavy Punch.
- **Heal** (healing): Restore HP to allies. Heal.
- **Move** (movement): Reposition on the grid. Move.

Skills fall into two timing categories:

- **Instant** (tickCost: 0): Resolve the same tick they are chosen. No wind-up, no telegraph. Guaranteed to hit if the target is in range at decision time. Trade telegraphing for reliability.
- **Wind-up** (tickCost >= 1): Take one or more ticks to resolve. Intent lines appear during wind-up, giving opponents time to react (dodge, reposition). Trade speed for power.

**Tactical rationale:** Instant attacks exist as an anti-kiting mechanic. Without them, characters with escape-route-weighted movement could indefinitely flee melee attackers, since every attack required at least 1 tick of wind-up during which the target could move away. Instant attacks guarantee hits on contact, forcing tactical tradeoffs: kiting is still viable against wind-up attacks, but closing to melee range carries real risk from instant attacks.

**Current instant skills:** Light Punch (tickCost: 0)
**Current wind-up skills:** Heavy Punch (tickCost: 2), Heal (tickCost: 2), Move (tickCost: 1)

### Move

- Tick cost: 1, Distance: 1 hex
- Default target: enemy, Default criterion: nearest
- Behaviors: **towards** (closer), **away** (farther)
- **Innate** (automatically assigned, cannot be removed), maxInstances: 3

### Skill Duplication

Any skill can be duplicated up to its registry-defined `maxInstances` limit. When duplicated, each instance gets a unique `instanceId` (ADR-009) and can be configured independently (different triggers, targets, criteria, behaviors). Move allows up to 3 instances; all other current skills allow 1 (no duplication).
```

## 3. Update `.docs/spec.md` -- Skill Assignment Section (lines 122-138)

**No changes needed.** The Skill Assignment section (lines 122-138) does not reference `mode`, `selectorOverride`, or any old terminology. It remains accurate.

## 4. Fix JSDoc in `src/engine/game-decisions.ts` (line 58)

### Current (line 58):

```
 * 6. Use selector (skill.selectorOverride ?? DEFAULT_SELECTOR) to find target
```

### Replace with:

```
 * 6. Use target + criterion (skill.target, skill.criterion) to find target
```

## 5. Fix JSDoc in `src/engine/skill-registry.ts` (line 106)

### Current (line 106):

```
 * This adds the "behavioral" fields (enabled, triggers, selectorOverride)
```

### Replace with:

```
 * This adds the "behavioral" fields (enabled, triggers, target, criterion)
```

## 6. Create `.docs/decisions/adr-011-skill-system-reshape.md`

### Full content:

```markdown
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
- (-) `evaluateSelector()` retained alongside `evaluateTargetCriterion()` for backward compatibility with 8 existing test files (can be cleaned up in follow-up)

### Related Decisions

- Reinforces ADR-005 (centralized registry as single source of truth)
- Extends ADR-009 (instance identity) to all skills via `maxInstances`
- No conflict with ADR-006 (heal resolution order) or ADR-010 (movement before combat)
```

## 7. Update `.docs/decisions/index.md`

### Add row to the table (after ADR-010 row):

```markdown
| ADR-011 | Reshape Skill System: Universal Behavior + Target/Criterion Split | 2026-02-05 | Accepted | [adr-011-skill-system-reshape.md](./adr-011-skill-system-reshape.md) |
```

## 8. Update `.docs/architecture.md` (line 17)

### Current (line 17):

```
- **Data-Driven Targeting**: Selectors and triggers as declarative data interfaces (not functions)
```

### Replace with:

```
- **Data-Driven Targeting**: Target + criterion pairs and triggers as declarative data interfaces (not functions)
```

### Current (line 30):

```
│   ├── types.ts      # Character, Skill, Trigger, Selector, Action, Position {q,r}
```

### Replace with:

```
│   ├── types.ts      # Character, Skill, Trigger, Target, Criterion, Action, Position {q,r}
```

## 9. Update `.docs/current-task.md`

### Replace entire content with:

```markdown
# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

None -- ready for next task.

## Recent Completions

- 2026-02-05: Skill system reshape (COMPLETE, TDD/Claude Code) - Universal behavior field replaces Move-specific mode. Target+criterion split replaces monolithic Selector. Universal maxInstances replaces Move-only duplication. Explicit actionType replaces inference. ADR-011 created. 1102/1103 tests passing. ~30 files modified across engine, stores, components, and tests.

- 2026-02-04: Move skill duplication (COMPLETE, TDD/Claude Code) - Added instanceId to Skill type for instance-level identity. New duplicateSkill store action, max 3 Move instances per character. ADR-009 created.

- 2026-02-04: Branch cleanup (COMPLETE) - Merged hexagonal grid conversion and skill exclusivity to main, deleted 4 conflicting branches.

- 2026-02-04: Hexagonal grid conversion (COMPLETE, merged to main) - All hex tests passing, TS errors fixed, PR merged.

## Next Steps

- Address selectMovementTargetData known limitation (targeting line shows first Move instance, not trigger-evaluated one)
- Consider migrating old selector tests from evaluateSelector to evaluateTargetCriterion (tech debt cleanup)
- Potential: Additional duplicatable skills beyond Move
- Potential: Skill loadout presets or templates
```

## Summary of All Changes

| File                                              | Action                                                      | Type           |
| ------------------------------------------------- | ----------------------------------------------------------- | -------------- |
| `.docs/spec.md` lines 60-159                      | Replace Targeting System + Starting Skills sections         | Documentation  |
| `.docs/architecture.md` lines 17, 30              | Update Data-Driven Targeting reference and types.ts comment | Documentation  |
| `.docs/decisions/adr-011-skill-system-reshape.md` | Create new file                                             | Documentation  |
| `.docs/decisions/index.md`                        | Add ADR-011 row to table                                    | Documentation  |
| `.docs/current-task.md`                           | Update project status                                       | Documentation  |
| `src/engine/game-decisions.ts` line 58            | Fix stale JSDoc comment                                     | Source (JSDoc) |
| `src/engine/skill-registry.ts` line 106           | Fix stale JSDoc comment                                     | Source (JSDoc) |

## Notes for Coder Agent

1. The two JSDoc fixes (items 4 and 5) require editing source files. These are single-line comment changes.
2. The `.docs/spec.md` update replaces two large sections. Apply carefully to preserve surrounding content (Skill Assignment section at lines 122+ should remain as-is since it does not reference old terminology).
3. All changes are documentation-only. No test or build impact.
