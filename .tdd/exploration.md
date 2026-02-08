# Exploration Findings

## Task Understanding

Three cleanup/fix tasks:

1. **Split `selector-filter-integration.test.ts`** -- Currently 639 lines, exceeds the project's 400-line max. Needs to be split into logically grouped test files.
2. **Deduplicate DeathEvent on charge kills** -- When a charge kills a target, the charge module emits a DeathEvent, and then combat may also emit a DeathEvent for the same character on the same tick, resulting in duplicates.
3. **Retrofit Dash with `defaultTrigger`** -- The Dash skill definition is missing a `defaultTrigger` field. Kick and Charge already have one. The spec explicitly states Dash should have `defaultTrigger: { scope: "enemy", condition: "in_range", conditionValue: 1 }`.

## Task 1: Split selector-filter-integration.test.ts

### Structure Analysis (639 lines)

The file has a single top-level `describe("filter integration via evaluateSkillsForCharacter")` containing 20 flat `it()` blocks (no nested describes). All tests share a `makeAction()` helper at the top (lines 11-31).

Logical groupings by filter condition type:

- **Lines 34-49**: No filter baseline (1 test)
- **Lines 51-152**: HP-based filters: `hp_below` and `hp_above` pass/reject (4 tests)
- **Lines 154-205**: Filter rejection context: `failedFilter` shape, no target on filter_failed (2 tests)
- **Lines 207-256**: Pipeline behavior: fallthrough, self-target bypass (2 tests)
- **Lines 258-335**: Evaluation order: trigger+filter interaction, move filter, filter before heal-full-HP (3 tests)
- **Lines 337-406**: Advanced pool narrowing: duplicate instances, multi-candidate pre-criterion (2 tests)
- **Lines 408-449**: Edge cases: empty filtered pool vs empty base pool (2 tests)
- **Lines 451-474**: Negated filter (1 test)
- **Lines 476-583**: Condition-specific filters: channeling pass/reject, idle, channeling with qualifier, targeting_me, targeting_ally (5 tests)

**Suggested split** (two files, each under 400 lines):

- File A: "Core filter behavior" -- baseline, HP filters, rejection context, pipeline behavior, evaluation order, pool narrowing, edge cases, negation (~18 tests, ~450 lines -- may need further split into 3 files)
- File B: "Condition-specific filters" -- channeling, idle, targeting_me, targeting_ally (~5 tests, ~130 lines)

Actually a better split respecting 400-line limit:

- File A (~300 lines): HP-based filters + rejection context + edge cases (baseline, hp_below/hp_above, failedFilter, empty pool, negated) -- 10 tests
- File B (~200 lines): Pipeline and pool narrowing (fallthrough, self-target bypass, trigger+filter, move filter, filter before heal, duplicate instances, multi-candidate) -- 7 tests
- File C (~140 lines): Condition-specific filters (channeling, idle, qualifier, targeting_me, targeting_ally) -- 5 tests

The `makeAction()` helper (20 lines) would need to be shared -- either duplicated or extracted to `game-test-helpers.ts`.

## Task 2: Deduplicate DeathEvent on Charge Kills

### Death Event Emission Path

**`resolveCharges()` in `/home/bob/Projects/auto-battler/src/engine/charge.ts` (lines 127-136):**
After all charges are processed, iterates over ALL `updatedCharacters` with `hp <= 0` and emits a DeathEvent. This is a blanket check that does NOT track whether the death was caused by a charge.

**`resolveCombat()` in `/home/bob/Projects/auto-battler/src/engine/combat.ts` (lines 92-101):**
After all attacks are processed, iterates over ALL `updatedCharacters` with `hp <= 0` and emits a DeathEvent. Same blanket check.

**Pipeline order in `game-core.ts` (lines 55-96):**

```
resolveHealing -> resolveInterrupts -> resolveCharges -> resolveMovement -> resolveCombat
```

Each stage receives the `characters` output from the previous stage. So if `resolveCharges` kills a character (sets HP <= 0), that character enters `resolveCombat` still with `hp <= 0` (they are not filtered out between stages -- dead characters are only removed at the end in line 107: `characters.filter(c => c.hp > 0)`).

**The Duplication Bug:**

1. `resolveCharges` reduces target HP to <= 0, emits DeathEvent for that character
2. `resolveCombat` receives the same character with HP <= 0
3. If that character's cell also has no attacker targeting it, `resolveCombat` still sweeps all characters with `hp <= 0` and emits ANOTHER DeathEvent
4. Even if no attack hits the dead character, `resolveCombat` unconditionally checks ALL characters at lines 92-101

**Fix location:** The simplest fix is in `resolveCharges` or `resolveCombat` -- either:

- Option A: `resolveCharges` should NOT emit DeathEvents (let the final pipeline stage handle it). But this changes the charge module's event contract.
- Option B: `resolveCombat` should only emit DeathEvents for characters whose HP dropped to <= 0 during combat (track pre-combat HP). This is the cleanest fix since it makes combat only responsible for deaths it causes.
- Option C: `game-core.ts` deduplicates DeathEvents after collecting all events. Violates single-responsibility.

The existing test `charge-emits-death-event-when-killing-target` in `charge-events.test.ts` (line 81) explicitly expects a DeathEvent from resolveCharges. So Option B (fix combat to only emit deaths it causes) is the least disruptive.

**How to implement Option B:** Before the damage loop in `resolveCombat`, snapshot each character's HP. In the death check loop, only emit DeathEvent if `character.hp <= 0 && preHP > 0` (i.e., this character was alive before combat started but died during combat).

## Task 3: Retrofit Dash with defaultTrigger

### Spec Reference

From `spec.md` lines 133:

> Default trigger: `{ scope: "enemy", condition: "in_range", conditionValue: 1 }` (dash away when enemy is adjacent).

### Current State

In `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` lines 138-152, the Dash definition has NO `defaultTrigger` field. When `createSkillFromDefinition` is called for Dash, it falls back to `{ scope: "enemy", condition: "always" }` (the default fallback at line 222/266).

### Existing Pattern

Kick has:

```typescript
defaultTrigger: { scope: "enemy", condition: "channeling" },
defaultFilter: { condition: "channeling" },
```

Charge has:

```typescript
defaultTrigger: { scope: "enemy", condition: "in_range", conditionValue: 3 },
```

Dash should get:

```typescript
defaultTrigger: { scope: "enemy", condition: "in_range", conditionValue: 1 },
```

No `defaultFilter` is needed for Dash (similar to Charge).

### Test Pattern

Tests for defaultTrigger exist in `/home/bob/Projects/auto-battler/src/engine/skill-registry-interrupt-charge.test.ts`. The test pattern is:

1. Find skill definition in SKILL_REGISTRY
2. Assert `defaultTrigger` equals expected value
3. Test `createSkillFromDefinition` propagates trigger correctly

New tests should follow this pattern, either added to the existing test file or in a new file for Dash.

## Relevant Files

- `/home/bob/Projects/auto-battler/src/engine/selector-filter-integration.test.ts` - The 639-line test file to split (Task 1)
- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` - Shared test helpers; `makeAction()` may be extracted here (Task 1)
- `/home/bob/Projects/auto-battler/src/engine/charge.ts` - Lines 127-136 emit DeathEvent for all hp<=0 chars (Task 2)
- `/home/bob/Projects/auto-battler/src/engine/combat.ts` - Lines 92-101 emit DeathEvent for all hp<=0 chars (Task 2, fix point)
- `/home/bob/Projects/auto-battler/src/engine/game-core.ts` - Pipeline order: charge before combat, dead chars not filtered between stages (Task 2)
- `/home/bob/Projects/auto-battler/src/engine/charge-events.test.ts` - Existing test expects DeathEvent from resolveCharges (Task 2)
- `/home/bob/Projects/auto-battler/src/engine/charge-integration.test.ts` - Integration test checking death event at line 345 (Task 2)
- `/home/bob/Projects/auto-battler/src/engine/combat-death.test.ts` - Unit tests for combat DeathEvent emission (Task 2)
- `/home/bob/Projects/auto-battler/src/engine/combat-edge-cases.test.ts` - Tests DamageEvent/DeathEvent ordering (Task 2)
- `/home/bob/Projects/auto-battler/src/engine/combat-multi-attack.test.ts` - Tests multi-attacker DeathEvent generation (Task 2)
- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` - Dash definition missing `defaultTrigger` at lines 138-152 (Task 3)
- `/home/bob/Projects/auto-battler/src/engine/skill-registry-interrupt-charge.test.ts` - Test pattern for defaultTrigger (Task 3)
- `/home/bob/Projects/auto-battler/src/engine/types.ts` - DeathEvent type definition (Task 2)
- `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts` - `evaluateSkillsForCharacter` used by split test file (Task 1)
- `/home/bob/Projects/auto-battler/.docs/spec.md` - Dash default trigger spec at line 133 (Task 3)

## Existing Patterns

- **Centralized Skill Registry (ADR-005)** - All skill definitions in one file; `defaultTrigger`/`defaultFilter` on `SkillDefinition` (ADR-018)
- **Test file splitting** - Prior art: `TriggerDropdown.test.tsx` was recently split to resolve same 400-line tech debt (noted in current-task.md)
- **Resolution Phase ordering** - Healing -> Interrupts -> Charges -> Movement -> Combat (ADR-010 extended)
- **Shared test helpers** - `createCharacter`, `createSkill`, `createAttackAction`, `initRNG` from `game-test-helpers.ts`
- **Death check pattern** - Both `charge.ts` and `combat.ts` use identical `if (character.hp <= 0)` sweep over all characters

## Dependencies

- Task 1 depends on understanding `evaluateSkillsForCharacter` import and `makeAction` helper
- Task 2 depends on the pipeline flow in `game-core.ts` -- the fix must not break existing charge or combat death tests
- Task 3 has no dependencies beyond the skill registry

## Constraints Discovered

- `resolveCharges` explicitly tests for DeathEvent emission (`charge-events.test.ts` line 81-118). The charge module's DeathEvent must be preserved -- the fix should be in `combat.ts`.
- `resolveCombat` death tests (`combat-death.test.ts`) test scenarios where combat itself causes death. These tests will pass unchanged if we only suppress death events for characters already dead before combat.
- The `makeAction()` helper in the test file creates actions with `createSkill` from `game-test-helpers.ts`. It is only used by 4 of the 20 tests (channeling/targeting filters). Could remain local to the condition-specific split file.
- `selector-filter-integration.test.ts` is exactly 639 lines (640 including trailing newline), not 610 as mentioned in current-task.md (may have grown during later phases).

## Open Questions

- **Task 1**: Should `makeAction()` be extracted to `game-test-helpers.ts` or duplicated/kept in the file that needs it? The helper is only used by condition-specific filter tests (4 tests), so keeping it local to that split file seems cleanest.
- **Task 2**: Should we also consider whether `resolveCharges` should not emit DeathEvents at all (moving that responsibility to `game-core.ts`)? This would be a larger refactor. The minimal fix (Option B: make `resolveCombat` only emit deaths for characters it killed) is less disruptive.
- **Task 2**: Are there any consumers of DeathEvent that would break if duplicates are removed? The game history (`state.history`) and event log would receive fewer events, which is the desired behavior.
- **Task 3**: The spec (line 133) clearly states the default trigger value. Is any additional behavioral change needed, or is this purely a registry field addition?
