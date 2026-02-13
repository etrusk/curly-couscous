# Implementation Plan: Fix SkillRow Grid Overflow

## Summary

Pure CSS fix. Change grid track sizing for columns 6-9 from `auto` to `minmax(0, auto)` in both config and battle mode grid templates. Add `flex-wrap: wrap` to `.triggerControl` and `.filterGroup` inline-flex containers. Update documentation to match.

## Files to Modify

### CSS Changes (2 files, 4 edits)

1. **`/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css`** (3 edits)
   - **Edit A** (lines 3-16): Config mode `.skillRow` grid-template-columns -- change columns 6-9 from `auto` to `minmax(0, auto)`:

     ```css
     /* 6: trigger     */ minmax(0, auto)
     /* 7: target      */ minmax(0, auto)
     /* 8: selector    */ minmax(0, auto)
     /* 9: filter      */ minmax(0, auto)
     ```

   - **Edit B** (lines 26-38): Battle mode `.skillRow.battleMode` grid-template-columns -- change the four `auto` values at positions 6-9 to `minmax(0, auto)`. Also add inline comments matching config mode style for clarity:

     ```css
     grid-template-columns:
       /* 1: checkbox    */
       auto
       /* 2: status icon */ 1.5rem
       /* 3: priority    */ auto
       /* 4: name        */ 7.5rem
       /* 5: eval        */ 10rem
       /* 6: trigger     */ minmax(0, auto)
       /* 7: target      */ minmax(0, auto)
       /* 8: selector    */ minmax(0, auto)
       /* 9: filter      */ minmax(0, auto)
       /* 10: behavior   */ minmax(0, auto)
       /* 11: spacer     */ 1fr
       /* 12: actions    */ auto;
     ```

   - **Edit C** (lines 228-232): `.filterGroup` -- add `flex-wrap: wrap`:
     ```css
     .filterGroup {
       display: inline-flex;
       align-items: center;
       gap: 0.25rem;
       flex-wrap: wrap;
     }
     ```

2. **`/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css`** (1 edit)
   - **Edit D** (lines 1-5): `.triggerControl` -- add `flex-wrap: wrap`:
     ```css
     .triggerControl {
       display: inline-flex;
       align-items: center;
       gap: 0.25rem;
       flex-wrap: wrap;
     }
     ```

### Documentation Updates (2 files)

3. **`/home/bob/Projects/auto-battler/.docs/visual-specs/skill-row.md`** (2 edits)
   - **Edit E** (lines 14-15): Update grid template snippets to show `minmax(0, auto)` for columns 6-9:
     Config: `auto 1.5rem auto 9rem 12rem minmax(0,auto) minmax(0,auto) minmax(0,auto) minmax(0,auto) minmax(0,auto) 1fr auto`
     Battle: `auto 1.5rem auto 7.5rem 10rem minmax(0,auto) minmax(0,auto) minmax(0,auto) minmax(0,auto) minmax(0,auto) 1fr auto`

   - **Edit F** (line 37-40, column width table + line 91 rationale): Update columns 6-9 width from `auto` to `minmax(0, auto)` in the Grid Columns table. Update line 91 rationale to explain that `minmax(0, auto)` allows columns to shrink below intrinsic minimum when space is constrained.

   - **Edit G** (line 214): Update `.filterGroup` description to include `flex-wrap: wrap`.

4. **`/home/bob/Projects/auto-battler/.docs/ui-ux-guidelines.md`** (1 edit)
   - **Edit H** (lines 266-295): Update Interactive Row snippet to show `minmax(0, auto)` for columns 6-9 in both config and battle mode templates.

## Implementation Order

1. Edit A + Edit B (grid templates in SkillRow.module.css)
2. Edit C (filterGroup flex-wrap in SkillRow.module.css)
3. Edit D (triggerControl flex-wrap in TriggerDropdown.module.css)
4. Run `npm run test` to confirm no test breakage
5. Edit E + Edit F + Edit G (visual-specs/skill-row.md)
6. Edit H (ui-ux-guidelines.md)
7. Run `npm run lint` and `npm run type-check` to confirm no issues
8. Visual verification in browser (human)

## Tests

**No tests needed.** Rationale:

- This is a pure CSS change (4 property value modifications, 2 property additions). No TypeScript, no JSX, no DOM structure changes.
- CSS layout properties (`grid-template-columns`, `flex-wrap`) cannot be meaningfully tested with unit tests in a jsdom environment. jsdom does not implement CSS layout.
- The existing test suites (10 test files listed in exploration.md) use Testing Library with DOM queries and user interactions, not layout assertions. These tests will not break because no DOM structure or behavior changes.
- Browser tests (`.browser.test.tsx`) could theoretically test layout via `getComputedStyle`/`getBoundingClientRect`, but the overflow behavior only manifests with specific content widths at specific viewport sizes, making it fragile and better suited to manual visual verification.
- The appropriate validation method is visual verification in the browser, which is already listed as acceptance criteria (items 4-7 in requirements).

The test suite should still be run to confirm no unexpected breakage, but no new test code is needed.

## Architectural Risks

None. This change:

- Extends an existing pattern (column 10 already uses `minmax(0, auto)`)
- Does not alter DOM structure, component behavior, or data flow
- Has no interaction with TypeScript types or game logic
- Has no theme-specific concerns (grid-template-columns and flex-wrap are theme-independent)

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` requirements (UI layout section, no spec conflicts)
- [x] Approach consistent with `.docs/architecture.md` (CSS Modules pattern, no architectural changes)
- [x] Patterns follow `.docs/patterns/index.md` (extends Row Density pattern, no new patterns)
- [x] No conflicts with `.docs/decisions/index.md` (no ADR implications)
- [x] Visual values match `.docs/ui-ux-guidelines.md` and `visual-specs/skill-row.md` (docs will be updated as part of this task)

No new architectural decisions introduced.
