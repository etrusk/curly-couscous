# Exploration Findings

## Task Understanding

Two cleanup items:

1. **Pre-existing TypeScript errors (TS18048/TS2532)**: Investigate TS18048 ("possibly undefined") in `charge-events.test.ts` and TS2532 ("possibly undefined") in `interrupt.test.ts`. Determine current status and fixes needed.

2. **Legacy component undefined CSS tokens**: Determine whether `SkillsPanel` and `InventoryPanel` should be migrated to the terminal overlay token system or deleted entirely.

## Findings

### Item 1: TypeScript Errors -- Already Resolved

TypeScript compiles cleanly (`npx tsc --noEmit` exits with code 0). The tsconfig has `"noUncheckedIndexedAccess": true`, which means array index access (`arr[0]`) returns `T | undefined`.

**charge-events.test.ts**: Line 143 uses `chargeEvents[0]!` -- the `!` non-null assertion suppresses the TS18048 error from `noUncheckedIndexedAccess`. This is a valid fix since the preceding assertion (`expect(chargeEvents.length).toBeGreaterThanOrEqual(1)`) guarantees the element exists.

**interrupt.test.ts**: Line 122 uses `updatedChanneler?.skills[0]!.cooldownRemaining` -- the `!` non-null assertion suppresses the TS2532 error from indexed access. The test setup explicitly provides a `skills: [channeledSkill]` array, so `skills[0]` is guaranteed to exist.

**Status**: These errors are already fixed. The `!` assertions are acceptable in test code where the test setup guarantees the values exist. However, if the team prefers to avoid `!` assertions, alternative approaches include:

- Extract to a local variable with an `expect(x).toBeDefined()` guard before accessing
- Use `?.` with optional chaining throughout (less precise assertions)

**No further action needed unless the team wants to eliminate `!` assertions from tests.**

### Item 2: Legacy Components -- Safe to Delete

**Architecture confirms deletion**: The architecture doc (`architecture.md` lines 54-55) explicitly marks both components as `(Legacy - to be deleted)`. The current-task.md (line 24) lists "Migrate remaining undefined tokens in legacy components (SkillsPanel, InventoryPanel) or delete legacy components" as a next step.

**Not imported in the app**: `App.tsx` does NOT import `SkillsPanel` or `InventoryPanel`. It uses `CharacterPanel` instead, which is the replacement single-view panel. The legacy components are only referenced by:

- Their own source files (`SkillsPanel.tsx`, `InventoryPanel.tsx`)
- Their own test files (`SkillsPanel.test.tsx`, `InventoryPanel.test.tsx`)
- Their barrel exports (`index.ts`)
- Their CSS modules (`.module.css`)
- Comments in `gameStore-selectors.ts` (lines 76, 361) -- text references only, no imports
- Comments in `gameStore-skills.test.ts` (line 2) -- text reference in file description only

**Undefined CSS tokens in legacy components** (would need migration if kept):

| Token                   | Used In                                                                     | Defined in theme.css?                                        |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `--surface-tertiary`    | SkillsPanel.module.css (lines 83, 109), InventoryPanel.module.css (line 79) | No -- was migrated to `--surface-hover` in active components |
| `--border-emphasis`     | InventoryPanel.module.css (line 88)                                         | No -- not defined anywhere                                   |
| `--content-error`       | SkillsPanel.module.css (lines 93, 124)                                      | No -- has CSS fallback values                                |
| `--surface-error`       | SkillsPanel.module.css (lines 94, 125)                                      | No -- has CSS fallback values                                |
| `--border-error`        | SkillsPanel.module.css (lines 95, 126)                                      | No -- has CSS fallback values                                |
| `--surface-error-hover` | SkillsPanel.module.css (lines 101, 132)                                     | No -- has CSS fallback values                                |

**Recommendation**: Delete both legacy component directories entirely. They are dead code not rendered anywhere in the application. The `CharacterPanel` component fully replaced them.

## Relevant Files

### TypeScript Errors (Item 1)

- `/home/bob/Projects/auto-battler/src/engine/charge-events.test.ts` - Line 143: `chargeEvents[0]!` non-null assertion (already fixed)
- `/home/bob/Projects/auto-battler/src/engine/interrupt.test.ts` - Line 122: `skills[0]!` non-null assertion (already fixed)
- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` - Shared test helpers used by both files
- `/home/bob/Projects/auto-battler/tsconfig.json` - `noUncheckedIndexedAccess: true` causes the indexed access errors

### Legacy Components (Item 2) -- Candidates for Deletion

- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.tsx` - Legacy component (377 lines)
- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx` - Legacy tests (~1540 lines)
- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.module.css` - Has undefined `--surface-tertiary` token
- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/index.ts` - Barrel export
- `/home/bob/Projects/auto-battler/src/components/InventoryPanel/InventoryPanel.tsx` - Legacy component (80 lines)
- `/home/bob/Projects/auto-battler/src/components/InventoryPanel/InventoryPanel.test.tsx` - Legacy tests
- `/home/bob/Projects/auto-battler/src/components/InventoryPanel/InventoryPanel.module.css` - Has undefined `--surface-tertiary` and `--border-emphasis` tokens
- `/home/bob/Projects/auto-battler/src/components/InventoryPanel/index.ts` - Barrel export

### Context Files

- `/home/bob/Projects/auto-battler/src/App.tsx` - Confirms neither legacy component is imported
- `/home/bob/Projects/auto-battler/src/styles/theme.css` - Confirms tokens are undefined
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors.ts` - Has comment references to SkillsPanel/InventoryPanel (text only, lines 76, 361)
- `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts` - Has comment reference (line 2)

## Existing Patterns

- **CSS Custom Property Theming**: Three-block pattern (`:root`, `[data-theme="light"]`, `[data-theme="high-contrast"]`) with terminal overlay tokens as a new independent layer (ADR-019)
- **Component replacement**: CharacterPanel replaced SkillsPanel+InventoryPanel in a single-view design
- **Test helpers**: Centralized in `game-test-helpers.ts` with `createCharacter`, `createSkill`, etc.

## Dependencies

- Deleting legacy components has no downstream dependencies (not imported anywhere in the app)
- Comment references in `gameStore-selectors.ts` and `gameStore-skills.test.ts` should be updated to remove legacy component names
- The store selectors and actions themselves are NOT legacy -- they are used by CharacterPanel

## Constraints Discovered

- TypeScript strict mode with `noUncheckedIndexedAccess` is enabled, requiring careful handling of array indexing
- The `!` assertions in test files are already present and working -- this is a style choice, not a bug
- Legacy components are self-contained (no imports from non-legacy code), making deletion straightforward

## Open Questions

- **For Item 1**: Should the `!` non-null assertions be kept as-is (working, acceptable in test code), or replaced with more defensive patterns? Current status is "compiles cleanly" so this may already be considered resolved.
- **For Item 2**: Should the comment references to "SkillsPanel" in `gameStore-selectors.ts` (line 76, 361) and `gameStore-skills.test.ts` (line 2) be updated when deleting the legacy components? These are purely documentary references, not code dependencies.
- **Scope decision**: Should both cleanup items be done in a single task/commit, or split into separate tasks?
