# Test Designs

Three tasks in implementation order: (1) Dash defaultTrigger, (2) test file split, (3) DeathEvent dedup.

---

## Task 3: Retrofit Dash with `defaultTrigger`

Tests added to existing file following the Kick/Charge pattern.

### Test: dash-has-correct-default-trigger

- **File**: `/home/bob/Projects/auto-battler/src/engine/skill-registry-interrupt-charge.test.ts`
- **Type**: unit
- **Verifies**: The Dash skill definition in SKILL_REGISTRY includes the correct `defaultTrigger` field per spec line 133
- **Setup**: Look up Dash definition from `SKILL_REGISTRY` via `find(s => s.id === "dash")`
- **Assertions**:
  1. `dash` is defined (not undefined)
  2. `dash.defaultTrigger` deep-equals `{ scope: "enemy", condition: "in_range", conditionValue: 1 }`
  3. `dash.defaultFilter` is undefined (Dash has no default filter, unlike Kick)
- **Justification**: Ensures the registry data matches the spec. Without this, Dash would fall back to the generic `{ scope: "enemy", condition: "always" }` trigger, which defeats the intended "dash away when enemy is adjacent" behavior.

### Test: createSkillFromDefinition-propagates-dash-default-trigger

- **File**: `/home/bob/Projects/auto-battler/src/engine/skill-registry-interrupt-charge.test.ts`
- **Type**: unit
- **Verifies**: `createSkillFromDefinition` copies Dash's `defaultTrigger` into the resulting skill's `trigger` field
- **Setup**: Look up Dash definition from `SKILL_REGISTRY`, call `createSkillFromDefinition(dashDef)`
- **Assertions**:
  1. The returned skill's `trigger` deep-equals `{ scope: "enemy", condition: "in_range", conditionValue: 1 }`
  2. The returned skill's `actionType` equals `"move"`
  3. The returned skill's `distance` equals `2`
- **Justification**: The factory function is the path by which skills enter the game. If propagation fails, Dash instances would have the wrong trigger even though the registry is correct. The extra assertions on `actionType` and `distance` guard against Dash identity regression (same pattern as the Charge propagation test at lines 104-112).

### Placement Notes

Add a new `describe("Dash")` block between the existing `describe("Charge")` block (line 85) and `describe("createSkillFromDefinition propagation")` block (line 90). The first test goes inside this new Dash describe block. The second test should be added inside the existing `describe("createSkillFromDefinition propagation")` block as a new `it()`, following the Kick/Charge propagation tests already there.

---

## Task 1: Split `selector-filter-integration.test.ts`

This is a mechanical file reorganization. No new tests are designed. The purpose is to split a 639-line file into three files, each under 400 lines, while preserving all existing tests exactly as-is.

**Verified test count**: 23 `it()` blocks (the plan stated 20, but grep of `it(` in the source file shows 23 occurrences at lines 34, 51, 77, 103, 128, 154, 182, 207, 237, 258, 285, 310, 337, 374, 408, 433, 451, 476, 500, 524, 547, 585, 610).

### Split Groupings

**File A: `selector-filter-hp-edge.test.ts` (~300 lines, 10 tests)**

- Describe block name: `"filter integration - HP, rejection context, and edge cases"`
- Tests (by original `it()` description):
  1. "no filter -- skill without filter is selected as before"
  2. "hp_below filter passes when target HP is at 30%"
  3. "hp_below filter rejects when target HP is at 80%"
  4. "hp_above filter passes when target HP is at 80%"
  5. "hp_above filter rejects when target HP is at 30%"
  6. "filter rejection includes failedFilter context with SkillFilter shape"
  7. "filter_failed result does not include a target (pre-criterion semantics)"
  8. "empty filtered pool produces filter_failed when base pool is non-empty"
  9. "no_target produced when base pool is empty (no living enemies)"
  10. "negated filter in pipeline -- NOT hp_below passes when target is above threshold"
- Imports: `evaluateSkillsForCharacter` from `./game-decisions`, `createCharacter`, `createSkill` from `./game-test-helpers`
- Does NOT need `makeAction()` helper or `Action` type import

**File B: `selector-filter-pipeline.test.ts` (~200 lines, 7 tests)**

- Describe block name: `"filter integration - pipeline behavior and pool narrowing"`
- Tests:
  1. "filter fallthrough -- first skill rejected, second selected"
  2. "self-target skills bypass filter (filter is ignored)"
  3. "trigger passes but filter fails -- rejection is filter_failed"
  4. "filter on move skill -- filter checked even though move skips range check"
  5. "filter checked before heal-full-HP -- filter_failed takes precedence"
  6. "duplicated skill instances have independent filter configurations"
  7. "pre-criterion pool narrowing selects from narrowed pool (multi-candidate)"
- Imports: same as File A
- Does NOT need `makeAction()` helper or `Action` type import

**File C: `selector-filter-conditions.test.ts` (~160 lines, 6 tests)**

- Describe block name: `"filter integration - condition-specific filters"`
- Tests:
  1. "channeling filter in pipeline -- passes when enemy is channeling"
  2. "channeling filter in pipeline -- rejects when enemy is idle"
  3. "idle filter in pipeline -- passes when enemy is idle"
  4. "channeling filter with qualifier in pipeline"
  5. "targeting_me filter in pipeline -- passes when enemy targets evaluator"
  6. "targeting_ally filter in pipeline -- passes when enemy targets an ally"
- Imports: `evaluateSkillsForCharacter` from `./game-decisions`, `createCharacter`, `createSkill` from `./game-test-helpers`, `Action` type from `./types`
- `makeAction()` helper function stays local to this file (copied verbatim from original lines 11-31)
- Note: The plan stated 5 tests for this group, but there are actually 6. All 6 tests use or relate to condition-specific behavior requiring the `Action` type.

### Verification

- Total across three files: 10 + 7 + 6 = 23 (matches the 23 `it()` blocks in the original)
- Run `npm run test` to confirm all 23 tests pass in their new locations
- Verify each new file is under 400 lines
- Delete original `selector-filter-integration.test.ts`

---

## Task 2: Deduplicate DeathEvent on Charge Kills

New test file targeting the `resolveCombat` function directly. Tests verify that combat only emits DeathEvents for characters it actually killed (hp went from positive to non-positive during combat), not for characters already dead when combat began.

### Test: no-death-event-for-pre-dead-character-without-attack

- **File**: `/home/bob/Projects/auto-battler/src/engine/combat-death-dedup.test.ts`
- **Type**: unit
- **Verifies**: A character entering `resolveCombat` with `hp <= 0` (pre-dead from charges) produces zero DeathEvents when no attack targets them
- **Setup**:
  - Import `resolveCombat` from `./combat`
  - Import `baseCreateCharacter as createCharacter` and `createAttackAction` from `./combat-test-helpers`
  - Create a "pre-dead" character with `hp: -5` (simulating charge kill), positioned at a cell not targeted by any attack
  - Create a live bystander character with no attack action
- **Assertions**:
  1. `result.events.filter(e => e.type === "death")` has length 0
  2. The pre-dead character remains in `updatedCharacters` with `hp <= 0` (combat does not remove dead characters)
- **Justification**: This is the core dedup scenario. Before the fix, `resolveCombat` unconditionally sweeps all characters with `hp <= 0` and emits DeathEvents, creating duplicates for charge kills. This test fails against the current (buggy) code and passes after the fix.

### Test: no-death-event-when-pre-dead-character-is-also-attacked

- **File**: `/home/bob/Projects/auto-battler/src/engine/combat-death-dedup.test.ts`
- **Type**: unit
- **Verifies**: A pre-dead character who is also attacked during combat still produces no DeathEvent (they were already dead)
- **Setup**:
  - Create a pre-dead character with `hp: -5` positioned at `{q: 1, r: 0}`
  - Create an attacker with a resolving attack action targeting `{q: 1, r: 0}` (the pre-dead character's cell), damage 10
  - The attack hits the pre-dead character and reduces HP further
- **Assertions**:
  1. A DamageEvent is emitted for the attack (damage still applies to the cell occupant)
  2. `result.events.filter(e => e.type === "death")` has length 0 (no DeathEvent -- character was already dead)
  3. The pre-dead character's HP is further reduced to `-15` (-5 - 10)
- **Justification**: Edge case where a pre-dead character is also an attack target. Combat should apply damage (producing DamageEvent) but must not emit a DeathEvent since the character was already dead before combat began.

### Test: normal-combat-death-still-emits-death-event

- **File**: `/home/bob/Projects/auto-battler/src/engine/combat-death-dedup.test.ts`
- **Type**: unit
- **Verifies**: A character entering combat alive (hp > 0) who is killed by combat damage still gets exactly one DeathEvent (regression guard)
- **Setup**:
  - Create a character with `hp: 10` at `{q: 1, r: 0}`
  - Create an attacker with a resolving attack dealing 25 damage to `{q: 1, r: 0}`
- **Assertions**:
  1. The target's resulting HP is `-15` (10 - 25)
  2. Exactly one DeathEvent in `result.events` with `characterId` matching the target
  3. A DamageEvent precedes the DeathEvent in the events array (ordering preserved)
- **Justification**: Regression guard ensuring the fix does not suppress legitimate combat deaths. This test should pass both before and after the fix, confirming no regression.

### Test: mixed-scenario-only-combat-kill-gets-death-event

- **File**: `/home/bob/Projects/auto-battler/src/engine/combat-death-dedup.test.ts`
- **Type**: unit
- **Verifies**: In a mixed scenario with pre-dead and alive characters, only the character killed during combat gets a DeathEvent
- **Setup**:
  - Create pre-dead character A with `hp: -5` at `{q: 1, r: 0}` (killed by charge earlier)
  - Create pre-dead character B with `hp: -10` at `{q: 2, r: 0}` (killed by charge earlier)
  - Create alive character C with `hp: 15` at `{q: 3, r: 0}`
  - Create an attacker with a resolving attack dealing 25 damage to `{q: 3, r: 0}` (targeting C)
- **Assertions**:
  1. `result.events.filter(e => e.type === "death")` has length exactly 1
  2. The single DeathEvent has `characterId` equal to character C's id
  3. Characters A and B appear in `updatedCharacters` with `hp <= 0` but have no DeathEvents
  4. Character C's resulting HP is `-10` (15 - 25)
- **Justification**: End-to-end validation of the dedup logic with multiple pre-dead characters and one combat kill. Before the fix, this would produce 3 DeathEvents (one per `hp <= 0` character). After the fix, exactly 1 DeathEvent (only the combat-caused death).

### File Structure Notes

The new test file (`combat-death-dedup.test.ts`) should follow the structure of `combat-death.test.ts`:

- Top-level `describe("resolveCombat")` wrapping a nested `describe("death deduplication - pre-dead characters")`
- Import `resolveCombat` from `./combat`
- Import `baseCreateCharacter as createCharacter` and `createAttackAction` from `./combat-test-helpers` (same import pattern as `combat-death.test.ts`)
- The tick parameter for `resolveCombat` should be consistent (use `1` to match `combat-death.test.ts` convention)
- Attack actions should use `createAttackAction(targetCell, null, damage, resolveTick)` matching the `combat-test-helpers` four-parameter signature

---

## Existing Test Impact

### Tests that must continue passing (no changes needed)

| Test File                     | Reason                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `combat-death.test.ts`        | All scenarios use characters entering combat alive; unaffected by pre-HP snapshot |
| `charge-events.test.ts`       | Charge module's own DeathEvent emission is unchanged                              |
| `combat-edge-cases.test.ts`   | DamageEvent/DeathEvent ordering tests use alive characters                        |
| `combat-multi-attack.test.ts` | Multi-attacker tests use alive characters                                         |
| `charge-integration.test.ts`  | Integration tests; charge death preserved, combat no longer duplicates            |
