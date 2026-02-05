# Fix Plan: Skill System Refactor - Post-Review Fixes

## Summary

The review found that Plan Steps 5, 6 (partial), and 7 were not completed. The engine still uses `selectorOverride` + `evaluateSelector()`, making the new `target`/`criterion` fields decorative. Additionally, a tiebreaker inversion bug exists in `evaluateSelector` for `furthest_*` and `highest_hp_*` cases.

**Decision**: Complete the refactor (Option A). Remove `selectorOverride` entirely and switch the engine to `evaluateTargetCriterion(skill.target, skill.criterion, ...)`. The new system is already implemented, tested, and correct. Keeping `selectorOverride` contradicts acceptance criteria and leaves a known tiebreaker bug in the active code path.

---

## Critical Issue 1: Engine uses selectorOverride, not target/criterion

**Root Cause**: Plan Step 5 ("Switch decision engine from `evaluateSelector` to `evaluateTargetCriterion`") was not completed during implementation. The coder sessions ran out of budget fixing test compilation errors and could not reach Step 5.

**Fix Strategy**: Replace all `evaluateSelector(selectorOverride, ...)` calls with `evaluateTargetCriterion(skill.target, skill.criterion, ...)` in the engine. Remove `selectorOverride` from the `Skill` interface, test helpers, registry factories, and all test files.

**Files to Change** (source):

1. `src/engine/game-decisions.ts` (lines 110, 247)
   - Remove `DEFAULT_SELECTOR` constant (line 28)
   - Line 110: Replace `const selector = skill.selectorOverride ?? DEFAULT_SELECTOR;` and `const target = evaluateSelector(selector, character, state.characters);` with `const target = evaluateTargetCriterion(skill.target, skill.criterion, character, state.characters);`
   - Line 247: Same replacement in `evaluateSkillsForCharacter()`
   - Update import: Remove `evaluateSelector`, add `evaluateTargetCriterion` from `./selectors`
   - Remove import of `Selector` from `./types`

2. `src/engine/types.ts` (line 68)
   - Remove `selectorOverride?: Selector;` from `Skill` interface
   - Remove `Selector` interface entirely (lines 88-100) -- BUT only after all consumers are migrated
   - **Note**: Keep `Selector` temporarily if `evaluateSelector` is still exported for any non-engine consumer. Check consumers first.

3. `src/engine/selectors.ts`
   - Keep `evaluateSelector()` for now (some tests and `selectMovementTargetData` may still reference it)
   - OR remove it if no consumers remain after this fix. Decision: Remove it since `selectMovementTargetData` will switch too.
   - Keep `evaluateTargetCriterion()` -- this becomes the sole entry point

4. `src/engine/skill-registry.ts` (lines 40, 61, 76, 90, 105, 132, 155)
   - Remove `defaultSelector?: Selector` from `SkillDefinition` interface (line 40)
   - Remove `defaultSelector` from all 4 registry entries
   - Remove `selectorOverride` from `getDefaultSkills()` return (line 132)
   - Remove `selectorOverride` from `createSkillFromDefinition()` return (line 155)
   - Remove `Selector` from import

5. `src/stores/gameStore-selectors.ts` (lines 290-305)
   - `selectMovementTargetData`: Remove the `if (moveSkill.selectorOverride)` branch; always use `evaluateTargetCriterion(moveSkill.target, moveSkill.criterion, ...)`
   - Remove `evaluateSelector` import (line 19)

6. `src/engine/game-test-helpers.ts` (line 67)
   - Remove `selectorOverride: overrides.selectorOverride,` from `createSkill()`
   - Remove `selectorOverride` from parameter type if it was manually added

7. `src/stores/gameStore-test-helpers.ts` (line 48)
   - Remove `selectorOverride: overrides.selectorOverride ?? undefined,` from `createSkill()`

**Files to Change** (tests -- mechanical removal of `selectorOverride`):

The key insight: since test helpers default `target: "enemy"` and `criterion: "nearest"`, removing `selectorOverride` from tests that set it to `{ type: "nearest_enemy" }` requires NO replacement -- the default is equivalent. For non-default selectors, translate to explicit `target`/`criterion`:

| selectorOverride value         | Replacement                                               |
| ------------------------------ | --------------------------------------------------------- |
| `{ type: "nearest_enemy" }`    | Remove entirely (default)                                 |
| `{ type: "nearest_ally" }`     | `target: "ally", criterion: "nearest"`                    |
| `{ type: "lowest_hp_ally" }`   | `target: "ally", criterion: "lowest_hp"`                  |
| `{ type: "lowest_hp_enemy" }`  | `target: "enemy", criterion: "lowest_hp"`                 |
| `{ type: "self" }`             | `target: "self"` (criterion ignored but can be any value) |
| `{ type: "furthest_enemy" }`   | `target: "enemy", criterion: "furthest"`                  |
| `{ type: "highest_hp_enemy" }` | `target: "enemy", criterion: "highest_hp"`                |

Test files to update (15 files, 97 occurrences total):

- `src/engine/game-healing-integration.test.ts` (9 occurrences)
- `src/engine/game-core-process-tick-combat-movement.test.ts` (2)
- `src/engine/game-core-process-tick-resolution-order.test.ts` (2)
- `src/engine/skill-registry.test.ts` (4) -- assertions about `selectorOverride` on created skills; change to assert `target`/`criterion` instead
- `src/engine/game-decisions-skill-priority.test.ts` (4)
- `src/engine/game-decisions-action-type-inference.test.ts` (1)
- `src/stores/gameStore-selectors-movement-target.test.ts` (6) -- test names reference `selectorOverride`; update names and data
- `src/stores/gameStore-skills-duplication.test.ts` (1)
- `src/components/BattleViewer/TargetingLineOverlay.test.tsx` (1)
- `src/components/BattleViewer/battle-viewer-tooltip.test.tsx` (1)
- `src/components/BattleViewer/CharacterTooltip.test.tsx` (3)
- `src/components/PlayControls/PlayControls.test.tsx` (1)
- `src/components/SkillsPanel/SkillsPanel.test.tsx` (31) -- most complex; assertions about `selectorOverride` in updateSkill calls need rewriting
- `src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx` (18)
- `src/components/RuleEvaluations/rule-evaluations-action-summary.test.tsx` (13)

**Test Impact**: All 1119 tests should remain passing. The changes are mechanical: remove `selectorOverride` prop from test skill objects, use `target`/`criterion` instead. Test helpers already default to `target: "enemy", criterion: "nearest"`, so the ~56 occurrences of `selectorOverride: { type: "nearest_enemy" }` can simply be deleted. The remaining ~41 non-default occurrences need translation per the table above.

**Risks**:

- High volume of mechanical changes across 15 test files. Mitigated by: TypeScript compiler will flag any remaining references to removed property.
- SkillsPanel tests that assert `selectorOverride` on `updateSkill` calls (31 occurrences) are the most complex. These need the assertion changed from `expect(updatedSkill?.selectorOverride?.type).toBe(...)` to `expect(updatedSkill?.target).toBe(...)` / `expect(updatedSkill?.criterion).toBe(...)`.

---

## Critical Issue 2: Tiebreaker inversion bug in evaluateSelector

**Root Cause**: The `evaluateSelector` function uses `-compareByDistanceThenPosition()` for `furthest_*` cases (lines 128-129, 139). Negating the entire comparator inverts both the primary comparison (distance) AND the tiebreaker (R, Q coordinates). The correct behavior reverses only the primary comparison while keeping tiebreaker direction consistent (lower R, lower Q wins).

**Fix Strategy**: This bug becomes irrelevant when Critical Issue 1 is fixed, because `evaluateSelector()` will be removed entirely. The `evaluateTargetCriterion()` function already has the correct implementation with custom comparators (lines 214-226, 231-241 in `selectors.ts`).

**Files to Change**: None -- the fix is subsumed by Critical Issue 1 (removing `evaluateSelector` entirely).

**Test Impact**: None. The existing tiebreaker tests for `evaluateTargetCriterion` already validate correct behavior. When the engine switches to `evaluateTargetCriterion`, those tests cover the live code path.

**Risks**: None. The buggy code path is removed, replaced by the already-correct code path.

---

## Important Issue 1: MAX_MOVE_INSTANCES not removed; SkillsPanel uses Move-specific logic

**Root Cause**: Plan Step 6 specified removing `MAX_MOVE_INSTANCES`, but only the store-level duplication logic was updated to use registry `maxInstances`. The UI (SkillsPanel) still imports and uses `MAX_MOVE_INSTANCES`.

**Fix Strategy**: Replace all `MAX_MOVE_INSTANCES` usage in SkillsPanel with registry-based `getSkillDefinition(skill.id)?.maxInstances` lookup. Replace `isMove` detection (currently `behavior !== ""`) with registry-based check. Remove `MAX_MOVE_INSTANCES` constant.

**Files to Change**:

1. `src/components/SkillsPanel/SkillsPanel.tsx` (lines 10, 238-243, 280)
   - Remove `MAX_MOVE_INSTANCES` import (line 10)
   - Import `getSkillDefinition` from `../../engine/skill-registry`
   - Line 238-244: Replace `isMove` logic with `const def = getSkillDefinition(skill.id);` then `const canDuplicate = def && def.maxInstances > 1;`
   - Line 241-243: Replace `moveCount` with `const instanceCount = selectedCharacter.skills.filter(s => s.id === skill.id).length;`
   - Line 280: Replace `moveCount < MAX_MOVE_INSTANCES` with `instanceCount < (def?.maxInstances ?? 1)`
   - The "Duplicate" button should show for ANY skill where `def.maxInstances > 1` and `instanceCount < def.maxInstances`
   - The behavior dropdown should show when `def?.behaviors?.length > 1` (currently only Move)
   - The "Remove" button logic for innate skills: replace `moveCount > 1` with `instanceCount > 1`

2. `src/stores/gameStore-constants.ts` (line 25)
   - Remove `export const MAX_MOVE_INSTANCES = 3;`

**Test Impact**: SkillsPanel tests that reference duplication behavior may need updating. The behavioral change is: the Duplicate button becomes potentially visible for non-Move skills if their `maxInstances > 1`. Currently all non-Move skills have `maxInstances: 1`, so the visible behavior is unchanged.

**Risks**: Low. The store already enforces `maxInstances` correctly; this only changes the UI gating logic.

---

## Important Issue 2: decomposeSelector/composeSelector not removed

**Root Cause**: Plan Step 7 specified removing these functions, but they remain because `selectorOverride` was still the primary data path. With Critical Issue 1 fixed, these functions are no longer needed.

**Fix Strategy**: Remove `decomposeSelector()` and `composeSelector()` from SkillsPanel. Update `handleCategoryChange` and `handleStrategyChange` to write directly to `skill.target` and `skill.criterion` via `updateSkill()`. Remove display fallback logic that reads `selectorOverride`.

**Files to Change**:

1. `src/components/SkillsPanel/SkillsPanel.tsx` (lines 28-90, 156-216, 237-250)
   - Remove `decomposeSelector()` function (lines 28-51)
   - Remove `composeSelector()` function (lines 58-90)
   - Remove `DEFAULT_SELECTOR` constant (line 17)
   - Remove `Selector` from import (line 6)
   - Simplify `handleCategoryChange` (lines 156-185): Just call `updateSkill(charId, instanceId, { target: category, criterion: currentCriterion })`. No need to compose selector.
   - Simplify `handleStrategyChange` (lines 187-216): Just call `updateSkill(charId, instanceId, { criterion: strategy })`. No need to compose selector.
   - Line 237: Remove `const selector = skill.selectorOverride || DEFAULT_SELECTOR;`
   - Lines 248-250: Remove `decomposed` computation; use `skill.target` and `skill.criterion` directly as display values
   - Line 363: `value={skill.target}` instead of `displayTarget`
   - Line 381: `value={skill.criterion}` instead of `displayCriterion`
   - Line 389: `disabled={skill.target === "self"}` instead of `displayTarget === "self"`

2. `src/components/SkillsPanel/SkillsPanel.test.tsx`
   - Tests that import `decomposeSelector`/`composeSelector` need updating
   - Tests that assert `selectorOverride` on updateSkill calls: change to assert `target`/`criterion` (overlaps with Critical Issue 1 test changes)

**Test Impact**: SkillsPanel tests are the most heavily affected (31 `selectorOverride` occurrences). But this overlaps entirely with the test changes needed for Critical Issue 1.

**Risks**: Medium. The SkillsPanel test file has the most changes. Careful sequencing needed.

---

## Important Issue 3: Duplicated skills omit selectorOverride

**Root Cause**: `gameStore.ts:387-401` creates duplicated skills without `selectorOverride`. Since the engine reads `selectorOverride`, duplicated skills fall back to `DEFAULT_SELECTOR`.

**Fix Strategy**: This issue is fully resolved by Critical Issue 1. Once the engine uses `target`/`criterion` instead of `selectorOverride`, the duplicated skill's `target` and `criterion` (which ARE set from registry defaults, lines 399-400) will be correctly used.

**Files to Change**: None beyond Critical Issue 1 changes.

**Test Impact**: None.

**Risks**: None.

---

## Change Sequence

Execute in this exact order to keep tests passing at each step:

### Phase 1: Engine Switch (Critical Issues 1 & 2)

**Step 1.1**: Update test helpers to stop passing `selectorOverride`

- `src/engine/game-test-helpers.ts` -- Remove `selectorOverride` line from `createSkill()`
- `src/stores/gameStore-test-helpers.ts` -- Remove `selectorOverride` line from `createSkill()`
- This is safe because the Skill interface still has `selectorOverride?` (optional), so removing it from defaults does not break compilation.
- Tests that explicitly pass `selectorOverride` still compile because the property still exists on the interface.

**Step 1.2**: Switch engine to evaluateTargetCriterion

- `src/engine/game-decisions.ts` -- Replace both `evaluateSelector` calls with `evaluateTargetCriterion`. Update imports.
- `src/stores/gameStore-selectors.ts` -- Replace `selectMovementTargetData` selectorOverride branch with direct `evaluateTargetCriterion` call.
- At this point, `selectorOverride` is still on the type but no longer read by the engine. Tests should still pass because `target`/`criterion` defaults match the old `DEFAULT_SELECTOR` behavior.

**Step 1.3**: Remove `selectorOverride` from Skill interface and registry

- `src/engine/types.ts` -- Remove `selectorOverride?: Selector` from Skill. Keep `Selector` interface temporarily (tests still reference it in their data).
- `src/engine/skill-registry.ts` -- Remove `defaultSelector` from `SkillDefinition`, remove from all registry entries, remove from `getDefaultSkills()` and `createSkillFromDefinition()`.
- TypeScript compiler will now flag all remaining references to `selectorOverride`. Fix each in the next step.

**Step 1.4**: Mechanical test migration (15 files, ~97 occurrences)

- For each test file, apply the translation table above.
- Most are simple: delete `selectorOverride: { type: "nearest_enemy" }` (defaults cover it).
- Non-default selectors get translated to `target`/`criterion`.
- SkillsPanel tests: change assertions from `selectorOverride.type` to `target`/`criterion`.
- Registry tests: change assertions to check `target`/`criterion` instead of `selectorOverride`.
- Movement target tests: update test names and data.

**Step 1.5**: Remove Selector type and evaluateSelector function

- `src/engine/types.ts` -- Remove `Selector` interface (once no test or source file references it)
- `src/engine/selectors.ts` -- Remove `evaluateSelector()` function, remove `Selector` from import
- `src/engine/game-decisions.ts` -- Remove `DEFAULT_SELECTOR` constant, `Selector` import
- Verify TypeScript compilation clean.

### Phase 2: UI Cleanup (Important Issues 1 & 2)

**Step 2.1**: Remove decomposeSelector/composeSelector from SkillsPanel

- `src/components/SkillsPanel/SkillsPanel.tsx` -- Remove both functions, simplify handlers to write `target`/`criterion` directly.
- Remove `DEFAULT_SELECTOR`, `Selector` import.
- Use `skill.target` and `skill.criterion` directly in JSX.

**Step 2.2**: Replace MAX_MOVE_INSTANCES with registry-based maxInstances

- `src/components/SkillsPanel/SkillsPanel.tsx` -- Import `getSkillDefinition`, replace isMove/moveCount with registry-based logic.
- `src/stores/gameStore-constants.ts` -- Remove `MAX_MOVE_INSTANCES`.
- Update SkillsPanel tests for new duplication button logic.

### Phase 3: Cleanup (Minor Issues)

**Step 3.1**: Remove `as any` casts from duplication test

- `src/stores/gameStore-skills-duplication.test.ts` -- Remove `as any` on behavior, target, criterion.

**Step 3.2**: Verify no remaining references to removed items

- Grep for `selectorOverride`, `evaluateSelector`, `DEFAULT_SELECTOR`, `MAX_MOVE_INSTANCES`, `decomposeSelector`, `composeSelector`.
- Verify TypeScript compilation (0 errors).
- Verify ESLint passes.
- Verify all 1119+ tests pass.

---

## Risk Assessment

### High Risk: Volume of test changes in Step 1.4

- 97 occurrences across 15 test files
- **Mitigation**: TypeScript compiler catches all missed references after Step 1.3 removes the property. This is a compile-time-safe migration. Process one file at a time, run `npm run type-check` between each batch.

### Medium Risk: SkillsPanel test rewrite (Step 1.4 + Step 2.1)

- 31 occurrences in SkillsPanel.test.tsx, many are assertions about `updateSkill` behavior
- **Mitigation**: The assertions change from `expect(updatedSkill?.selectorOverride?.type).toBe("X_Y")` to `expect(updatedSkill?.target).toBe("X"); expect(updatedSkill?.criterion).toBe("Y")`. This is a predictable, mechanical transformation.

### Low Risk: Engine behavior change (Step 1.2)

- Switching from `evaluateSelector` to `evaluateTargetCriterion` could theoretically change targeting results
- **Mitigation**: For the 6 original selector types (nearest*enemy/ally, lowest_hp_enemy/ally, self), both functions produce identical results. The difference is only for `furthest*_`and`highest*hp*_` tiebreaking -- which is actually a bug fix (Critical Issue 2).

### Low Risk: Removing MAX_MOVE_INSTANCES (Step 2.2)

- Could break SkillsPanel duplication gating
- **Mitigation**: Registry `maxInstances` already enforces the same limit (3 for Move, 1 for others). The UI change just reads from the same source.

---

## Test Strategy

1. **After Step 1.2 (engine switch)**: Run full test suite. Expect all 1119 to pass because `target`/`criterion` defaults match old `DEFAULT_SELECTOR` behavior, and tests that set explicit `selectorOverride` also have matching `target`/`criterion` set by test helpers.

2. **After Step 1.3 (remove selectorOverride from type)**: Run `npm run type-check`. Expect TypeScript errors on every remaining `selectorOverride` reference. Fix all in Step 1.4.

3. **After Step 1.4 (test migration)**: Run `npm run type-check` and full test suite. Expect 0 TS errors and all tests passing.

4. **After Step 1.5 (remove Selector type)**: Run `npm run type-check`. Verify no remaining imports of `Selector` or `evaluateSelector`.

5. **After Step 2.1 and 2.2 (UI cleanup)**: Run full test suite. Verify SkillsPanel tests pass with new assertion pattern.

6. **Final gate**: `npm run test && npm run type-check && npm run lint`. All must pass clean.

---

## Estimated Effort

- **Step 1.1-1.2**: Small (2 source files, ~10 lines changed)
- **Step 1.3**: Small (3 source files, ~15 lines removed)
- **Step 1.4**: Large (15 test files, ~97 mechanical replacements). This is the bulk of the work.
- **Step 1.5**: Small (2 source files, ~50 lines removed)
- **Step 2.1**: Medium (1 source file, ~60 lines removed/simplified, test updates)
- **Step 2.2**: Small (2 source files, ~10 lines changed)
- **Step 3.1-3.2**: Trivial

**Total**: ~22 source file changes. The critical path is the mechanical test migration (Step 1.4), which is high-volume but low-complexity.
