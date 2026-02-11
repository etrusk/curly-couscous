# Fix Plan

Reviewer: tdd-analyzer | Date: 2026-02-11 | Review Cycle: 1

## Issues to Address

### C1: handleFilterValueChange drops negated and qualifier fields

- **Root cause**: On line 123 of `SkillRow.tsx`, `handleFilterValueChange` constructs a new `SkillFilter` object with only `condition` and `conditionValue`, discarding any existing `negated` and `qualifier` fields from `currentFilter`. This is a manual object construction where a spread operator should have been used, matching the pattern already used correctly in `handleFilterNotToggle` (line 130) and `handleFilterQualifierChange` (line 142).
- **Category**: Code bug (data loss)
- **Fix**: Replace the manual object construction on line 123 with a spread of `currentFilter!`, overriding only `conditionValue`:
  ```
  // Before (line 123):
  const newFilter: SkillFilter = { condition: currentFilter!.condition, conditionValue: parsed };
  // After:
  const newFilter: SkillFilter = { ...currentFilter!, conditionValue: parsed };
  ```
  This preserves `negated`, `qualifier`, and any other fields present on the current filter while updating only the value.
- **File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx:123`
- **Risk**: Low. The spread operator is the same pattern used in `handleFilterNotToggle` (line 130) and `handleFilterQualifierChange` (line 142) within the same file. Type safety is maintained since `currentFilter!` is typed as `SkillFilter` and `conditionValue` is a valid `SkillFilter` property. The guard on line 122 (`if (isNaN(parsed)) return`) ensures we never reach this line without a valid `currentFilter`.

### C1-test: Add regression test for negated preservation on value change

- **Root cause**: No existing test covers the scenario of changing the filter numeric value when `negated` is set. The test designs (B3, B4, B6) test toggling negated and preserving negated across condition switches, but none test that changing the _value input_ preserves `negated`.
- **Category**: Spec gap (missing test coverage for value-change + negated interaction)
- **Fix**: Add a new test to `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx` inside the "NOT toggle store interactions" describe block (after B4, before B5). The test should:
  1. Create a skill with `filter: { condition: "hp_below", conditionValue: 50, negated: true }`
  2. Initialize the store with `initBattle`
  3. Change the filter value input (type a new number)
  4. Assert the store filter still has `negated: true` and `condition: "hp_below"` alongside the new `conditionValue`

  Test name: `"changing filter value preserves negated flag"`

  This also implicitly tests that `qualifier` is preserved during value changes (for a `channeling` filter with qualifier and a hypothetical value, though currently `channeling` is a non-value condition -- the spread fix handles both fields generically).

- **File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx` (insert around line 122, after B4 test)
- **Risk**: Low. The test file is currently 396 lines. Adding ~20 lines for this test brings it to ~416, which would exceed the 400-line limit. However, C2's extraction will not affect this test file (it tests SkillRow behavior, not the extracted component). If the file exceeds 400 lines, the test should be placed in the existing `SkillRow-filter.test.tsx` file instead (currently 273 lines), in a new describe block "Filter value change preserves state". This keeps both test files under 400 lines.

### C2: SkillRow.tsx exceeds 400-line limit (429 lines)

- **Root cause**: The `filterOverride` local state pattern and its usage across 6 filter handlers added more lines than the plan's estimate of ~397. The file is 29 lines over the 400-line limit. The filter control section (lines 321-383, ~63 lines of JSX) plus its 6 handlers (lines 99-151, ~53 lines) account for ~116 lines dedicated to filter UI.
- **Category**: Project constraint violation (CLAUDE.md: "Max 400 lines per file -- flag for extraction if exceeded")
- **Fix**: Extract the filter controls section (the JSX inside `<div className={...filterField}>`) into a new `FilterControls` sub-component. This moves:

  **Extracted to new file** (`/home/bob/Projects/auto-battler/src/components/CharacterPanel/FilterControls.tsx`):
  - The `filterOverride` local state (line 63) and `currentFilter` derived state (lines 64-66)
  - The `FILTER_VALUE_CONDITIONS` set (lines 23-27) and `getFilterDefaultValue` function (lines 29-32)
  - Six handlers: `handleAddFilter`, `handleFilterTypeChange`, `handleFilterValueChange`, `handleFilterNotToggle`, `handleFilterQualifierChange`, `handleRemoveFilter` (lines 99-151)
  - The filter group JSX (lines 321-383): NOT toggle, condition select, value input, qualifier select, remove button, and "+ Filter" button

  **Props for FilterControls**:

  ```typescript
  interface FilterControlsProps {
    skill: Skill;
    character: Character;
    // currentFilter could be derived internally from skill.filter + local override
  }
  ```

  The component calls `updateSkill` from the store directly (same pattern as SkillRow), so no callback props needed. It imports `QualifierSelect` directly.

  **Line count impact**:
  - `FilterControls.tsx`: ~100 lines (6 handlers + JSX + imports + local state + constants)
  - `SkillRow.tsx`: 429 - 116 (handlers + JSX + constants) + 5 (import + component usage) = ~318 lines
  - Both well under the 400-line limit

  **Alternative considered**: Extracting only the JSX without the handlers would keep the handlers in SkillRow and require passing 6 callback props. This is worse because (a) it increases coupling, (b) the handlers only operate on filter state and have no dependency on other SkillRow state, and (c) the `filterOverride` state would need to be shared across components.

- **File**:
  - Create: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/FilterControls.tsx` (new, ~100 lines)
  - Modify: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` (remove filter handlers, constants, JSX; add import + usage)
- **Risk**:
  - Medium. The `filterOverride` local state pattern exists to ensure immediate DOM updates after store mutations in test contexts. Moving it to `FilterControls` should work since the state is entirely filter-scoped. The component will still call `useGameStore(selectActions)` directly.
  - Existing tests in `SkillRow-filter.test.tsx` and `SkillRow-filter-not-toggle.test.tsx` render `<SkillRow>`, so they exercise `FilterControls` transitively. No test changes should be needed -- the tests query by aria-labels which remain the same.
  - The `styles` import needs to be from `SkillRow.module.css` (where `.notToggle`, `.filterGroup`, `.addFilterBtn` etc. are defined). The new component imports the same CSS module, OR the filter-related CSS classes are moved to a new `FilterControls.module.css`. Recommendation: keep using `SkillRow.module.css` for now to avoid CSS class renaming; filter styles are still visually part of the SkillRow layout.

## Verification Steps

1. After C1 fix: Run existing tests `npm run test -- --reporter=verbose SkillRow-filter-not-toggle` -- all B3, B4, B6 tests should still pass, confirming negated handling works across all handlers.
2. After C1-test: Run the new regression test in isolation to confirm it fails before the C1 fix (red) and passes after (green). Since C1 and C1-test are being fixed together, verify the test passes with the spread fix applied.
3. After C2 extraction:
   - `wc -l SkillRow.tsx` must report <= 400 lines
   - `wc -l FilterControls.tsx` must report <= 400 lines
   - Run full test suite `npm run test` -- all 1481+ tests must pass
   - Run `npm run lint` -- clean
   - Run `npm run type-check` -- clean
4. Final verification: `npm run build` succeeds

## Implementation Order

1. Fix C1 first (1-line change in `SkillRow.tsx` line 123) -- this is independent of C2
2. Add C1-test regression test (in `SkillRow-filter.test.tsx` to keep files under 400 lines)
3. Extract `FilterControls.tsx` for C2 -- moves filter handlers, state, constants, and JSX out of SkillRow
4. Verify line counts, run all tests, lint, type-check

## Files to Modify

| File                                                     | Action                           | Estimated Lines |
| -------------------------------------------------------- | -------------------------------- | --------------- |
| `src/components/CharacterPanel/SkillRow.tsx`             | Modify (C1 fix + C2 extraction)  | ~318            |
| `src/components/CharacterPanel/FilterControls.tsx`       | Create (C2 extraction)           | ~100            |
| `src/components/CharacterPanel/SkillRow-filter.test.tsx` | Modify (C1-test regression test) | ~295            |
