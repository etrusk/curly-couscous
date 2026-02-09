# Exploration Findings

## Task Understanding

Split `CharacterTooltip.test.tsx` (473 lines) into multiple focused test files, each under 400 lines. Pure reorganization -- no test logic changes, no coverage loss. The file currently has 5 describe blocks covering distinct concerns that map naturally to separate files.

## File Structure Analysis

### Current describe blocks and line ranges

| #   | describe block                         | Lines               | Tests   | Concern                                                                   |
| --- | -------------------------------------- | ------------------- | ------- | ------------------------------------------------------------------------- |
| 1   | `CharacterTooltip - Content Rendering` | 19-235 (217 lines)  | 4 tests | Next action, skill priority, collapsible sections, mid-action, idle state |
| 2   | `CharacterTooltip - Portal Rendering`  | 237-272 (36 lines)  | 1 test  | Portal renders outside component tree                                     |
| 3   | `CharacterTooltip - Positioning`       | 274-376 (103 lines) | 5 tests | calculateTooltipPosition pure function tests                              |
| 4   | `CharacterTooltip - Accessibility`     | 378-434 (57 lines)  | 2 tests | role=tooltip, details/summary elements                                    |
| 5   | `CharacterTooltip - Hover Callbacks`   | 436-473 (38 lines)  | 1 test  | onMouseEnter/onMouseLeave callbacks                                       |

**Total: 13 tests across 5 describe blocks in 473 lines.**

### Natural split points

**Option A: Two files by concern type**

- `CharacterTooltip-content.test.tsx` -- Content Rendering (217 lines) = ~240 lines with imports
- `CharacterTooltip-behavior.test.tsx` -- Portal + Positioning + Accessibility + Hover (234 lines) = ~260 lines with imports

**Option B: Three files (more granular, aligns with existing codebase patterns)**

- `CharacterTooltip-content.test.tsx` -- Content Rendering (4 tests, ~240 lines)
- `CharacterTooltip-positioning.test.tsx` -- Positioning pure function tests (5 tests, ~130 lines)
- `CharacterTooltip-portal.test.tsx` -- Portal + Accessibility + Hover (4 tests, ~130 lines)

Option A is simplest and each file is well under 400 lines. Option B is more granular but creates very small files. The project precedent leans toward concern-based splitting (e.g., `PriorityTab-battle.test.tsx`, `PriorityTab-config.test.tsx`, `token-accessibility.test.tsx`, `token-interaction.test.tsx`).

### Imports used per describe block

| Import                             | Content | Portal | Positioning | A11y | Hover |
| ---------------------------------- | ------- | ------ | ----------- | ---- | ----- |
| `describe, it, expect, beforeEach` | Y       | Y      | Y           | Y    | Y     |
| `vi`                               | N       | N      | N           | N    | Y     |
| `render, screen`                   | Y       | Y      | N           | Y    | Y     |
| `userEvent`                        | N       | N      | N           | N    | Y     |
| `CharacterTooltip`                 | Y       | Y      | N           | Y    | Y     |
| `calculateTooltipPosition`         | N       | N      | Y           | N    | N     |
| `useGameStore`                     | Y       | Y      | N           | Y    | Y     |
| `createCharacter`                  | Y       | Y      | N           | Y    | Y     |
| `createTarget`                     | Y       | N      | N           | Y    | N     |
| `createAttackAction`               | Y       | N      | N           | N    | N     |
| `createMockRect`                   | Y       | Y      | N           | Y    | Y     |
| `mockViewport`                     | Y       | Y      | Y           | Y    | Y     |

**Key observation:** The Positioning block (block 3) tests the pure function `calculateTooltipPosition` directly -- it does not render the CharacterTooltip component at all. This makes it the cleanest extraction target. It only needs `calculateTooltipPosition` and `mockViewport`.

## Relevant Files

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.test.tsx` - The file to split (473 lines, 13 tests)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.browser.test.tsx` - Related browser tests (170 lines, 4 tests) -- NOT being split, already separate
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/tooltip-test-helpers.ts` - Shared helpers: `createMockRect`, `mockViewport`, `waitForTooltipDelay` (38 lines)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/tooltip-positioning.ts` - Pure function `calculateTooltipPosition` (44 lines)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-test-helpers.ts` - Shared helpers: `createCharacter`, `createTarget`, `createAttackAction` (169 lines)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.tsx` - The component under test
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.module.css` - CSS module for the component

## Existing Patterns

- **Hyphenated concern-based naming** - The project uses `Component-concern.test.tsx` naming: `IntentOverlay-offset-basic.test.tsx`, `PriorityTab-battle.test.tsx`, `SkillRow-actions.test.tsx`, `SkillRow-filter.test.tsx`
- **Lowercase concern naming for non-component splits** - Token tests use `token-interaction.test.tsx`, `token-accessibility.test.tsx` (lowercase, kebab-case)
- **Since this is a component split, use PascalCase-kebab pattern** - `CharacterTooltip-content.test.tsx` matches `PriorityTab-battle.test.tsx`, `SkillRow-actions.test.tsx`
- **Shared test helpers in separate files** - Already have `tooltip-test-helpers.ts` and `rule-evaluations-test-helpers.ts`; no new helper files needed
- **Each split file has its own JSDoc header** - e.g., `/** * Tests for IntentOverlay component - basic bidirectional attack offset. */`
- **Each split file has its own beforeEach** - Reset logic is duplicated per file (not shared)
- **Describe block names retain context** - e.g., `IntentOverlay - Basic Offset` (component name prefix preserved)
- **Split files are typically 86-376 lines** - All under 400 lines; range varies widely

## Dependencies

- `tooltip-test-helpers.ts` - Already extracted, shared across test files. No changes needed.
- `rule-evaluations-test-helpers.ts` - Already extracted, shared across test files. No changes needed.
- `useGameStore` - Store reset pattern (`actions.initBattle([])` or `actions.selectCharacter(null)`) is used in beforeEach; each new file will need its own beforeEach.
- `mockViewport(1000, 800)` - Called in most beforeEach blocks; each new file will need this.

## Constraints Discovered

- **No new helper files needed** - All shared utilities already exist in `tooltip-test-helpers.ts` and `rule-evaluations-test-helpers.ts`
- **The Positioning block is self-contained** - Tests only the pure function, zero React rendering. Cleanest extraction.
- **Content Rendering is the largest block at 217 lines** - Even with imports/boilerplate (~25 lines), it will be ~242 lines, well under 400.
- **Portal + Accessibility + Hover are small** - Combined they total ~131 lines of test code. They could be one file (~155 with imports) or stay in a slimmed-down `CharacterTooltip.test.tsx`.
- **The browser test file (`CharacterTooltip.browser.test.tsx`) is 170 lines** - It does NOT need splitting and is already separate by convention (ADR-022).

## Open Questions

- **Two vs three files?** Option A (two files) is simpler and both files are well under 400 lines. Option B (three files) is more granular. The content rendering block alone at ~240 lines is the largest single concern and cannot be further split without breaking test cohesion. Recommend Option A for simplicity, but either works.
- **Should the original `CharacterTooltip.test.tsx` be deleted or become one of the split files?** Project precedent has no "base" file remaining after splits (IntentOverlay tests are all `IntentOverlay-*.test.tsx`; there is a separate `IntentLine.test.tsx` which is a different component). Recommend deleting the original and creating fresh named files.
