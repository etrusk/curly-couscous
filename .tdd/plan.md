# Phase 3: New Trigger Conditions -- Implementation Plan

## Summary

Add trigger-context integration tests for `channeling`, `idle`, `targeting_me` (scope variations), and `targeting_ally` conditions. Update TriggerDropdown to expose the 3 missing conditions. Split the oversized TriggerDropdown test file. No engine source changes required.

## Scope

- **Engine tests only** (no engine source changes -- `evaluateConditionForCandidate()` already handles all 8 conditions)
- **TriggerDropdown.tsx** -- add 3 `<option>` elements
- **TriggerDropdown test splitting** -- pre-existing tech debt, resolve during this phase

## Step-by-Step Plan

### Step 1: Create `triggers-channeling.test.ts`

**File:** `/home/bob/Projects/auto-battler/src/engine/triggers-channeling.test.ts`

**Pattern:** Follow `triggers-cell-targeted.test.ts` structure. Import from `vitest`, `./triggers`, `./types`, `./triggers-test-helpers`.

**Tests to write (estimated ~180 lines):**

1. **Basic channeling detection (enemy scope)**
   - Enemy with `currentAction !== null` -> returns true
   - Enemy with `currentAction === null` -> returns false
   - Ally channeling is ignored when scope is enemy -> returns false

2. **Channeling with ally scope**
   - Ally with `currentAction !== null` -> returns true
   - Ally idle -> returns false
   - Evaluator's own action is excluded from ally pool -> returns false

3. **Qualifier: skill match**
   - `qualifier: { type: "skill", id: "heal" }` + enemy channeling Heal -> true
   - `qualifier: { type: "skill", id: "heal" }` + enemy channeling Heavy Punch -> false

4. **Qualifier: action type match**
   - `qualifier: { type: "action", id: "attack" }` + enemy channeling an attack -> true
   - `qualifier: { type: "action", id: "attack" }` + enemy channeling a heal -> false

5. **Multiple enemies, some channeling**
   - One channeling, one idle -> returns true (existential: `pool.some()`)

6. **Dead enemy channeling ignored**
   - Dead enemy with `currentAction` -> returns false (dead characters excluded from pool)

### Step 2: Create `triggers-idle.test.ts`

**File:** `/home/bob/Projects/auto-battler/src/engine/triggers-idle.test.ts`

**Pattern:** Same as Step 1.

**Tests to write (estimated ~100 lines):**

1. **Basic idle detection (enemy scope)**
   - Enemy with `currentAction === null` -> returns true
   - Enemy with `currentAction !== null` -> returns false

2. **Idle with ally scope**
   - Ally idle -> returns true
   - Ally channeling -> returns false

3. **Multiple enemies, some idle**
   - One idle, one channeling -> returns true

4. **All enemies channeling**
   - No idle enemies -> returns false

### Step 3: Create `triggers-targeting-ally.test.ts`

**File:** `/home/bob/Projects/auto-battler/src/engine/triggers-targeting-ally.test.ts`

**Pattern:** Same as Step 1. Needs characters from multiple factions and explicit positions.

**Tests to write (estimated ~150 lines):**

1. **Basic targeting_ally detection (enemy scope)**
   - Enemy action targets a living ally's cell -> returns true
   - Enemy action targets evaluator's cell (not an ally, it's self) -> returns false
   - Enemy action targets a cell with no ally -> returns false

2. **Enemy action targets dead ally**
   - Dead ally at target cell -> returns false (ally must be alive, `hp > 0`)

3. **Multiple enemies, one targeting ally**
   - One enemy targets ally, one targets elsewhere -> returns true

4. **No enemy actions**
   - All enemies idle -> returns false

5. **Ally scope + targeting_ally combination**
   - `{ scope: "ally", condition: "targeting_ally" }` -- verify behavior: checks if any ally has an action targeting another ally's cell (unusual but engine supports it)

### Step 4: Add NOT modifier tests for new conditions

**File:** `/home/bob/Projects/auto-battler/src/engine/triggers-not-modifier.test.ts` (existing, append)

**Current:** 237 lines. Adding ~60 lines, total ~297 lines (within 400-line limit).

**Tests to add:**

1. **NOT + channeling**
   - No enemies channeling + negated channeling -> returns true
   - Enemy channeling + negated channeling -> returns false

2. **NOT + idle**
   - All enemies channeling + negated idle -> returns true
   - Enemy idle + negated idle -> returns false

3. **NOT + targeting_ally**
   - No enemy targeting ally + negated targeting_ally -> returns true
   - Enemy targeting ally + negated targeting_ally -> returns false

### Step 5: Split TriggerDropdown test file

**Current file:** `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.test.tsx` (454 lines)

**Strategy:** Extract the "Gap 3: NOT Toggle Modifier" `describe` block (lines 315-453, ~139 lines) into a new file.

**New file:** `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx`

- Move the entire `describe("Gap 3: NOT Toggle Modifier", ...)` block
- Same imports: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `./TriggerDropdown`
- Same `defaultProps` setup

**Remaining in original:** ~315 lines (well within 400-line limit), plus room for new condition tests.

### Step 6: Add TriggerDropdown condition option tests

**File:** `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.test.tsx` (after split, ~315 lines)

**Tests to add (~45 lines):**

1. **New condition options are rendered**
   - Update existing test "renders trigger type dropdown with correct value" to expect 8 options instead of 5
   - Add assertions for: `screen.getByRole("option", { name: "Channeling" })`, `screen.getByRole("option", { name: "Idle" })`, `screen.getByRole("option", { name: "Targeting ally" })`

2. **No value input for new conditions**
   - `channeling` trigger: no spinbutton rendered
   - `idle` trigger: no spinbutton rendered
   - `targeting_ally` trigger: no spinbutton rendered

3. **Condition change to new condition**
   - Switch from `always` to `channeling`: callback with `{ scope: "enemy", condition: "channeling" }` (no conditionValue)

### Step 7: Update TriggerDropdown.tsx

**File:** `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.tsx`

**Change:** Add 3 `<option>` elements inside the condition `<select>` (after line 109):

```
<option value="channeling">Channeling</option>
<option value="idle">Idle</option>
<option value="targeting_ally">Targeting ally</option>
```

**No other changes needed:**

- `VALUE_CONDITIONS` set correctly excludes these (they are not value-based)
- `handleConditionChange` already handles non-VALUE conditions correctly (strips conditionValue)
- `handleNotToggle` works for all conditions
- Display names follow existing convention: title case for first word, lowercase for subsequent words ("In range", "HP below", "Cell targeted" -> "Targeting ally")

### Step 8: Verify all tests pass

Run `npm run test` to confirm:

- All 1396+ existing tests still pass
- All new trigger-context tests pass
- All new TriggerDropdown tests pass
- Run `npm run type-check` and `npm run lint` for compliance

## File Summary

| File                                                                | Action               | Estimated Lines       |
| ------------------------------------------------------------------- | -------------------- | --------------------- |
| `src/engine/triggers-channeling.test.ts`                            | CREATE               | ~180                  |
| `src/engine/triggers-idle.test.ts`                                  | CREATE               | ~100                  |
| `src/engine/triggers-targeting-ally.test.ts`                        | CREATE               | ~150                  |
| `src/engine/triggers-not-modifier.test.ts`                          | MODIFY (append)      | +60 (~297 total)      |
| `src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx` | CREATE (extracted)   | ~155                  |
| `src/components/CharacterPanel/TriggerDropdown.test.tsx`            | MODIFY (split + add) | ~360 total            |
| `src/components/CharacterPanel/TriggerDropdown.tsx`                 | MODIFY (3 options)   | +3 lines (~137 total) |

## Open Question Resolutions

1. **Display names:** "Channeling", "Idle", "Targeting ally" -- follows existing convention (title case first word, lowercase rest).

2. **`targeting_me` tests:** Already well-covered in `triggers-cell-targeted.test.ts` (297 lines, 11 tests). No new file needed. The acceptance criterion for `targeting_me` is already satisfied by existing tests.

3. **TriggerDropdown test splitting:** Extract NOT toggle tests to separate file. This resolves the pre-existing 454-line tech debt and creates room for new condition tests.

4. **Integration test depth:** Tests at `evaluateTrigger()` level only (not full pipeline). This matches the acceptance criteria scope and the pattern set by existing trigger test files. Full pipeline tests would belong to a separate integration test phase.

5. **Scope validation:** Not testing unusual scope/condition combinations beyond `{ scope: "ally", condition: "targeting_ally" }` (which is in the acceptance criteria). The engine does not restrict scope/condition pairings, and there is no spec requirement to add restrictions.

## Risks

1. **TriggerDropdown test file split** could break import paths if tests reference each other -- they don't, so risk is low.
2. **Display name choices** for new conditions are a UI decision without spec guidance. Using obvious descriptive names minimizes risk.

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` -- all 8 condition types documented in spec, TriggerDropdown exposure matches spec requirements
- [x] Approach consistent with `.docs/architecture.md` -- pure engine tests, no React in engine tests, component tests use Testing Library
- [x] Patterns follow `.docs/patterns/index.md` -- no new patterns needed, existing test file naming convention followed
- [x] No conflicts with `.docs/decisions/index.md` -- leverages ADR-016 shared evaluator, no new ADRs needed

## New Decisions

None. This phase uses existing architecture (shared condition evaluator, unified trigger system) without introducing new patterns or decisions.
