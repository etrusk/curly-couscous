# Exploration: Move Skill Duplication

## 1. Skill Identity Architecture

### Current Skill ID Model

Skills use a string `id` field that serves THREE roles simultaneously:

1. **Registry lookup key**: `SKILL_REGISTRY.find(s => s.id === skillId)` -- used in `gameStore.ts` lines 292, 328 and `gameStore-selectors.ts` line 92.
2. **Uniqueness constraint**: `character.skills.some(s => s.id === skillId)` -- in `assignSkillToCharacter` (gameStore.ts line 281) prevents same-id skills on one character.
3. **React rendering key**: `<div key={skill.id}>` in `SkillsPanel.tsx` line 196.

The Move skill has `id: "move-towards"` in the registry (`skill-registry.ts` line 48). There is exactly ONE Move definition. Its `mode: "towards"` is an intrinsic property that gets copied into the `Skill` instance.

### Key Constraint: `id` Is Used for Deduplication

In `gameStore.ts`, `assignSkillToCharacter`:

```typescript
const hasSkill = character.skills.some((s) => s.id === skillId);
if (hasSkill) return; // Blocks duplicate assignment
```

And `removeSkillFromCharacter` finds by ID:

```typescript
const skillIndex = character.skills.findIndex((s) => s.id === skillId);
```

Two Move skills with `id: "move-towards"` on the same character would break:

- Assignment blocked by `hasSkill` check
- Removal always finds first instance
- React keys collide

### Faction Exclusivity

`getFactionAssignedSkillIds` (`gameStore-selectors.ts` lines 83-98) builds a `Set<string>` of skill IDs assigned across all characters of a faction. Innate skills are explicitly excluded (line 93: `if (def?.innate) continue`). Move is already exempt from faction exclusivity.

## 2. Skill Registry Structure

**File**: `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

- `SkillDefinition` -- immutable intrinsic properties (id, name, tickCost, range, damage/healing/mode, innate, defaultSelector)
- `SKILL_REGISTRY` -- readonly array of 4 entries: light-punch, heavy-punch, move-towards, heal
- `getDefaultSkills()` -- returns `Skill[]` from innate definitions only (currently just Move)
- `createSkillFromDefinition(def)` -- creates a `Skill` instance with default behavioral config

**Name handling issue**: Both `getDefaultSkills()` (line 78) and `createSkillFromDefinition()` (line 98) currently hardcode the name transformation:

```typescript
name: def.mode ? `${def.name} Towards` : def.name, // Move -> "Move Towards"
```

The registry has `name: "Move"` but instances get `"Move Towards"` regardless of actual mode. With duplication, all instances should simply be called "Move" -- the mode dropdown in the UI already shows towards/away. This hardcoded name transform should be removed.

## 3. Skill Priority Evaluation

**File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts`

The decision loop in `computeDecisions()` (lines 66-161) iterates `character.skills` top-to-bottom and selects the FIRST skill whose:

1. `enabled === true`
2. All triggers pass (AND logic)
3. Selector finds a valid target
4. Range check passes (for attack/heal)

Once a skill is selected, remaining skills are skipped. **Multiple Move instances at different priorities already work correctly** -- the loop does not care about skill type or ID.

`evaluateSkillsForCharacter()` (lines 173-309) mirrors this for UI display, marking skills as selected/rejected/skipped. Also already handles duplicates correctly.

## 4. Trigger System

**File**: `/home/bob/Projects/auto-battler/src/engine/triggers.ts`

`hp_below` trigger (lines 52-59):

```typescript
const currentPercent = (evaluator.hp / evaluator.maxHp) * 100;
return currentPercent < thresholdPercent;
```

Returns true when `currentPercent < thresholdPercent` (strict less-than).

**Correct priority ordering for HP-based conditional movement:**

1. Move (mode: away, trigger: hp_below 50%) -- activates when HP < 50%
2. Move (mode: towards, trigger: always) -- fallback when HP >= 50%

This works with the existing trigger system. No trigger changes needed.

## 5. Skills Panel UI

**File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.tsx`

- Renders skills using `selectedCharacter.skills.map()` with `key={skill.id}` (line 196)
- Mode dropdown exists (lines 315-332) for any skill with `mode !== undefined`
- Innate badge shown via `SKILL_REGISTRY.find(def => def.id === skill.id)?.innate`
- Unassign button only for non-innate skills
- Priority reorder via moveSkillUp/moveSkillDown by array index

**Problems with current UI for duplicates:**

- `key={skill.id}` -- duplicate keys cause React warnings
- `updateSkill(charId, skillId, updates)` finds first match by ID
- `handleUnassignSkill(skillId)` removes wrong instance
- Innate check by ID lookup -- all instances appear innate

## 6. Inventory Panel

**File**: `/home/bob/Projects/auto-battler/src/components/InventoryPanel/InventoryPanel.tsx`

Move is innate, so it never appears in inventory. **Duplication should NOT go through the inventory flow.** A "Duplicate" button in the SkillsPanel is the correct UX for creating Move copies.

## 7. State Management (Zustand Store)

**File**: `/home/bob/Projects/auto-battler/src/stores/gameStore.ts`

Key actions affected:

- `updateSkill(charId, skillId, updates)` -- finds by `s.id === skillId` (line 226). Ambiguous with duplicates.
- `moveSkillUp/moveSkillDown` -- use array index, NOT skill ID. Already duplicate-safe.
- `removeSkillFromCharacter` -- finds by ID (line 321). Ambiguous.
- `MAX_SKILL_SLOTS = 3` (`gameStore-constants.ts` line 19). Duplicates count toward this limit.

**File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-types.ts`

The `updateSkill` signature is `(charId: string, skillId: string, updates: Partial<Skill>)`. Must change to use instance identifier.

## 8. Movement Target Data Selector

**File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors.ts` (lines 268-314)

`selectMovementTargetData` finds the Move skill via:

```typescript
const moveSkill = character.skills.find((s) => s.mode !== undefined);
```

Finds only the FIRST Move skill. With duplicates, this should find the one that the decision engine would actually select. May need updating.

## 9. Constraints and Requirements

### Must Solve

1. **Instance identity**: Each skill instance needs a unique identifier beyond the registry `id`. Required for React keys, targeted updates, and unambiguous removal.
2. **Store actions**: `updateSkill` and `removeSkillFromCharacter` must operate on instance identity, not registry ID.
3. **Duplication limit**: 3 instances max (including innate original).
4. **Innate status**: Only the original Move instance is innate (non-removable). Duplicates are removable.
5. **Naming**: All instances simply named "Move". The mode dropdown handles differentiation. Remove the hardcoded "Towards" suffix from `getDefaultSkills()` and `createSkillFromDefinition()`.

### Already Works (No Changes Needed)

- Priority evaluation in `computeDecisions()` -- handles any skill ordering
- Trigger evaluation -- `hp_below` works as-is
- Movement resolution -- `computeMoveDestination()` uses `skill.mode` from the action
- Action creation -- `createSkillAction()` reads mode from the skill
- Faction exclusivity -- Move is innate, excluded from exclusivity checks

## 10. Recommended Approach: `instanceId` Field

### Add `instanceId` to Skill type

```typescript
interface Skill {
  id: string; // Registry ID (e.g., "move-towards") -- shared by duplicates
  instanceId: string; // Unique per-instance (e.g., "move-towards-1")
  name: string;
  // ... rest unchanged
}
```

### Why instanceId

| Approach                               | Pros                                                           | Cons                                                          |
| -------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| UUID as `id`                           | Truly unique                                                   | Loses registry connection, complicates innate detection       |
| Suffixed `id` (e.g., "move-towards:1") | Human-readable                                                 | Fragile string parsing, changes `id` semantics                |
| **Separate `instanceId`**              | `id` retains registry meaning; `instanceId` handles uniqueness | One extra field; code using `id` for instance ops must switch |

The `instanceId` approach avoids breaking any code that legitimately uses `id` for registry lookup (innate detection, faction exclusivity). Only code that incorrectly conflates registry identity with instance identity needs to change.

### Generation Strategy

Use a simple counter: `${registryId}-${counter}`. The counter increments per character. For example:

- First move: `instanceId: "move-towards-1"`
- Duplicate: `instanceId: "move-towards-2"`

### Impact Assessment

Files requiring changes:

| File                                         | Change                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/engine/types.ts`                        | Add `instanceId` to `Skill`                                                                                 |
| `src/engine/skill-registry.ts`               | Generate instanceId in `getDefaultSkills()` and `createSkillFromDefinition()`; remove "Towards" name suffix |
| `src/stores/gameStore.ts`                    | New `duplicateSkill` action; update `updateSkill`, `removeSkillFromCharacter` to use instanceId             |
| `src/stores/gameStore-types.ts`              | Update action signatures                                                                                    |
| `src/stores/gameStore-constants.ts`          | DEFAULT_SKILLS generation gets instanceId                                                                   |
| `src/components/SkillsPanel/SkillsPanel.tsx` | Use `instanceId` for keys/operations; add "Duplicate" button for Move skills                                |
| `src/stores/gameStore-selectors.ts`          | `selectMovementTargetData` may need update                                                                  |

### Duplication Limit: 3

- 3 covers all practical use cases (towards + away + one conditional variant)
- With MAX_SKILL_SLOTS=3, filling all slots with Move is a valid tactical choice
- When slots expand to 6, the 3-move cap prevents degenerate all-movement builds
- Simple to explain: "Up to 3 Move skills per character"

### New Store Action

```
duplicateSkill(charId: string, instanceId: string): void
```

- Validates source skill exists and has `mode` (is a Move skill)
- Checks move instance count < 3
- Checks character.skills.length < MAX_SKILL_SLOTS
- Creates new Skill instance with unique instanceId, default config (mode: "towards", trigger: always)
- Inserts directly below the source skill in priority list

### Innate Tracking

The original innate Move is identified by checking: `SKILL_REGISTRY.find(d => d.id === skill.id)?.innate` AND the skill is the character's first instance of that registry ID (or we track which instanceId is the original). Simpler approach: add an `isOriginal: boolean` or `innateInstance: boolean` flag on the Skill, set to true only on the default instance from `getDefaultSkills()`. Duplicates get `innateInstance: false`.

Alternative (simpler): Track by convention that the innate instance is the one created by `getDefaultSkills()` at character creation. Store its instanceId. For the "can this be removed?" check, compare against `SKILL_REGISTRY` innate flag AND check if there's at least one other Move instance remaining. Actually simplest: only allow removing a Move instance if the character has more than one Move skill. This ensures the innate "always have Move" invariant without extra fields.

## 11. Spec Alignment

- [x] "Skill slots: 3 initial, up to 6 unlockable" -- duplication respects MAX_SKILL_SLOTS
- [x] "A skill can only be assigned once per character (no duplicates)" -- this refers to assignable skills from inventory, not innate duplication
- [x] "Centralized Skill Registry" (ADR-005) -- registry unchanged; duplication is runtime instance creation
- [x] Innate skills "cannot be removed" -- original innate instance protected; duplicates removable
- [x] No conflicts with existing ADRs

### Spec Gap

The spec's "no duplicates" rule refers to assignment. Move duplication is a distinct mechanism. This warrants a new ADR to document the decision.
