# Plan: Split CharacterTooltip.test.tsx

## Decision

**Split into 2 files** (Option A from exploration). Both files are well under 400 lines. The Positioning block tests a pure function with no React rendering, making it a clean extraction, but at only ~130 lines with imports it would create an unnecessarily small file. Grouping it with other behavior-oriented tests (Portal, Accessibility, Hover) creates two balanced, cohesive files.

## Target Files

### 1. `CharacterTooltip-content.test.tsx` (~245 lines)

**Location:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip-content.test.tsx`

**Contains:** Content Rendering describe block (lines 19-235, 4 tests)

| Test                               | Description                                     |
| ---------------------------------- | ----------------------------------------------- |
| renders-next-action-section        | Next Action section with action name and target |
| renders-skill-priority-section     | Skill Priority section with numbered skill list |
| renders-collapsible-skipped-skills | Skipped skills in collapsible details/summary   |
| renders-mid-action-display         | Continuing Action when character is mid-action  |

**Imports needed:**

- `describe, it, expect, beforeEach` from vitest
- `render, screen` from @testing-library/react
- `CharacterTooltip` from ./CharacterTooltip
- `useGameStore` from ../../stores/gameStore
- `createCharacter, createTarget, createAttackAction` from ../RuleEvaluations/rule-evaluations-test-helpers
- `createMockRect, mockViewport` from ./tooltip-test-helpers

**beforeEach:** Store reset (`initBattle([])`, `selectCharacter(null)`) + `mockViewport(1000, 800)`

**JSDoc header:** `/** Tests for CharacterTooltip component - content rendering. */`

**Note:** The idle state test (lines 212-234) is part of Content Rendering and stays in this file.

### 2. `CharacterTooltip-behavior.test.tsx` (~255 lines)

**Location:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip-behavior.test.tsx`

**Contains:** Portal Rendering + Positioning + Accessibility + Hover Callbacks (lines 237-473, 9 tests across 4 describe blocks)

| Block            | Tests | Description                                                                                                            |
| ---------------- | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| Portal Rendering | 1     | Portal renders outside component tree                                                                                  |
| Positioning      | 5     | calculateTooltipPosition pure function (right default, left fallback, both-sides-constrained, clamp bottom, clamp top) |
| Accessibility    | 2     | role=tooltip, native details/summary                                                                                   |
| Hover Callbacks  | 1     | onMouseEnter/onMouseLeave callbacks                                                                                    |

**Imports needed:**

- `describe, it, expect, beforeEach, vi` from vitest
- `render, screen` from @testing-library/react
- `userEvent` from @testing-library/user-event
- `CharacterTooltip` from ./CharacterTooltip
- `calculateTooltipPosition` from ./tooltip-positioning
- `useGameStore` from ../../stores/gameStore
- `createCharacter, createTarget` from ../RuleEvaluations/rule-evaluations-test-helpers
- `createMockRect, mockViewport` from ./tooltip-test-helpers

**Note:** `createAttackAction` is NOT needed in this file. `vi` and `userEvent` are only needed for the Hover Callbacks block but are imported at file level.

**beforeEach per block:**

- Portal: Store reset + mockViewport
- Positioning: mockViewport only (no React rendering, no store)
- Accessibility: Store reset + mockViewport
- Hover: Store reset + mockViewport

**JSDoc header:** `/** Tests for CharacterTooltip component - portal, positioning, accessibility, and hover behavior. */`

## Steps

1. **Create** `CharacterTooltip-content.test.tsx` with Content Rendering block (lines 1-235 of original, adjusted imports)
2. **Create** `CharacterTooltip-behavior.test.tsx` with remaining 4 blocks (lines 237-473 of original, adjusted imports)
3. **Delete** original `CharacterTooltip.test.tsx`
4. **Run** `npm run test` -- verify all 13 tests pass, total test count unchanged
5. **Run** `npm run lint` -- verify no lint errors

## Verification Checklist

- [ ] 13 tests total across both new files (4 + 9)
- [ ] Each file under 400 lines
- [ ] No test logic modified (copy-paste, not rewrite)
- [ ] No new helper files created
- [ ] Naming follows PascalCase-kebab convention (`CharacterTooltip-content`, `CharacterTooltip-behavior`)
- [ ] Describe block names preserved exactly as-is
- [ ] All imports trimmed per file (no unused imports)
- [ ] Original `CharacterTooltip.test.tsx` deleted
- [ ] `CharacterTooltip.browser.test.tsx` untouched

## Risks

None. This is a mechanical file split with no logic changes. The shared helpers are already extracted. Each describe block is self-contained with its own beforeEach.

## Spec Alignment

- [x] Plan aligns with `.docs/spec.md` requirements (no behavior changes)
- [x] Approach consistent with `.docs/architecture.md` (test co-location maintained)
- [x] Patterns follow `.docs/patterns/index.md` (PascalCase-kebab naming matches IntentOverlay-_, PriorityTab-_, SkillRow-\*)
- [x] No conflicts with `.docs/decisions/index.md` (ADR-022 browser test convention unaffected)

## New Decisions

None. This plan follows existing patterns. No new ADR needed.
