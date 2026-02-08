# Implementation Plan

Three cleanup/fix tasks. No new architectural decisions needed. All changes are internal engine work with no UI impact.

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` (Dash defaultTrigger from spec line 133; DeathEvent fix corrects buggy behavior)
- [x] Approach consistent with `.docs/architecture.md` (pure engine changes, test-first)
- [x] Patterns follow `.docs/patterns/index.md` (no new patterns needed)
- [x] No conflicts with `.docs/decisions/index.md` (ADR-005 centralized registry, ADR-010 resolution order, ADR-018 defaultTrigger)

---

## Task 1: Split `selector-filter-integration.test.ts`

**Goal:** Split 639-line file into 3 files, each under 400 lines. No logic changes.

### File Plan

**File A: `selector-filter-hp-edge.test.ts` (~300 lines)**

- Baseline: "no filter" (lines 34-49)
- HP filters: `hp_below` pass/reject, `hp_above` pass/reject (lines 51-152)
- Rejection context: `failedFilter` shape, no target on filter_failed (lines 154-205)
- Edge cases: empty filtered pool vs empty base pool (lines 408-449)
- Negated filter (lines 451-474)
- Total: 10 tests
- Imports: `evaluateSkillsForCharacter` from `./game-decisions`, `createCharacter`, `createSkill` from `./game-test-helpers`
- Does NOT need `makeAction()` helper

**File B: `selector-filter-pipeline.test.ts` (~200 lines)**

- Pipeline behavior: fallthrough, self-target bypass (lines 207-256)
- Evaluation order: trigger+filter interaction, move filter, filter before heal-full-HP (lines 258-335)
- Advanced pool narrowing: duplicate instances, multi-candidate pre-criterion (lines 337-406)
- Total: 7 tests
- Same imports as File A
- Does NOT need `makeAction()` helper

**File C: `selector-filter-conditions.test.ts` (~140 lines)**

- Condition-specific: channeling pass/reject, idle, channeling with qualifier, targeting_me, targeting_ally (lines 476-583, plus some setup)
- Total: 5 tests (the only ones using `makeAction()`)
- `makeAction()` stays local to this file (only used here, 4 of 5 tests)
- Additional import: `Action` type from `./types`

### Procedure

1. Create 3 new files with the groupings above
2. Each file gets its own top-level `describe` block with a descriptive name
3. Delete original `selector-filter-integration.test.ts`
4. Run `npm run test` to confirm all 20 tests pass in the new locations
5. Verify each file is under 400 lines

### Risks

- None. This is a mechanical split. No logic changes, no shared state between tests.

---

## Task 2: Deduplicate DeathEvent on Charge Kills

**Goal:** `resolveCombat` should only emit DeathEvents for characters it killed, not characters already dead from earlier pipeline stages (charges).

### Root Cause

Pipeline order: `resolveCharges` -> `resolveCombat`. Both sweep ALL characters with `hp <= 0` and emit DeathEvents. Dead characters from charges flow into combat without filtering, causing duplicate DeathEvents.

### Fix: Option B (snapshot pre-combat HP)

**File:** `/home/bob/Projects/auto-battler/src/engine/combat.ts`

**Change:** In `resolveCombat`, before the damage loop (line 62), snapshot each character's HP into a `Map<string, number>`. In the death check loop (line 92-101), change the condition from `character.hp <= 0` to `character.hp <= 0 && preHpMap.get(character.id)! > 0`.

**Pseudocode for the fix:**

```
// Before damage loop:
const preHpMap = new Map(updatedCharacters.map(c => [c.id, c.hp]));

// Death check changes from:
if (character.hp <= 0) { ... }
// To:
const preHp = preHpMap.get(character.id)!;
if (character.hp <= 0 && preHp > 0) { ... }
```

This means: only emit a DeathEvent if the character was alive before combat started AND is now dead. Characters entering combat already dead (from charges) are ignored.

### Tests

**New test file:** `/home/bob/Projects/auto-battler/src/engine/combat-death-dedup.test.ts`

Tests needed:

1. **No duplicate DeathEvent for pre-dead character:** Character enters `resolveCombat` with `hp <= 0` and no attack targets them. Should produce zero DeathEvents.

2. **No duplicate DeathEvent when pre-dead character is also attacked:** Character enters with `hp <= 0`, another attack hits their cell. Should produce a DamageEvent but NOT a DeathEvent (already dead).

3. **Normal death still emits DeathEvent:** Character enters with `hp > 0`, gets killed by combat. Should emit exactly one DeathEvent. (Regression guard.)

4. **Multiple deaths, only combat-caused ones emit:** Two characters with `hp <= 0` enter (pre-dead). One character alive gets killed in combat. Only the combat-killed character gets a DeathEvent.

**Existing tests that must continue to pass:**

- `combat-death.test.ts`: All tests pass because they test characters entering combat alive
- `charge-events.test.ts`: `charge-emits-death-event-when-killing-target` continues to work (charge still emits its own DeathEvent)
- `combat-edge-cases.test.ts`: DamageEvent/DeathEvent ordering tests use characters entering alive
- `combat-multi-attack.test.ts`: Multi-attacker tests use characters entering alive

### Integration Verification

After unit tests pass, run full suite to confirm:

- `charge-integration.test.ts` still passes (death event from charge is preserved)
- No double DeathEvents in game-core pipeline scenarios

### Risks

- The `@preconditions` comment in `resolveCombat` says "Characters with HP <= 0 should have been removed in previous tick." This precondition is NOT enforced and is factually wrong (dead chars flow between stages within a single tick). The fix makes the code robust against this. Update the comment to reflect reality.

---

## Task 3: Retrofit Dash with `defaultTrigger`

**Goal:** Add `defaultTrigger` field to Dash skill definition per spec line 133.

### Fix

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

**Change:** Add one field to the Dash definition object (between lines 151 and 152):

```typescript
defaultTrigger: { scope: "enemy", condition: "in_range", conditionValue: 1 },
```

### Tests

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry-interrupt-charge.test.ts`

Add a new `describe("Dash")` block following the Kick and Charge pattern:

1. **Dash has defaultTrigger:** Assert `SKILL_REGISTRY.find(s => s.id === "dash")?.defaultTrigger` equals `{ scope: "enemy", condition: "in_range", conditionValue: 1 }`.

2. **createSkillFromDefinition propagates Dash trigger:** Call `createSkillFromDefinition` for Dash, verify the resulting skill's trigger matches the defaultTrigger.

**Note:** The test file name (`skill-registry-interrupt-charge.test.ts`) becomes slightly misnamed with Dash tests added. This is acceptable -- the file tests registry entries for newer skills (Kick, Charge, Dash) and remains well under 400 lines. Renaming is optional future cleanup.

### Risks

- None. One-line addition to registry, follows exact pattern of Kick and Charge.

---

## Implementation Order

1. **Task 3 (Dash defaultTrigger)** -- simplest, independent, 1 source line + 2 tests
2. **Task 1 (test file split)** -- mechanical, no source changes, reduces risk of merge conflicts for Task 2
3. **Task 2 (DeathEvent dedup)** -- most complex, benefits from having clean test files first

## Files Modified (Expected)

| File                                                 | Task | Change                                       |
| ---------------------------------------------------- | ---- | -------------------------------------------- |
| `src/engine/skill-registry.ts`                       | 3    | Add `defaultTrigger` to Dash                 |
| `src/engine/skill-registry-interrupt-charge.test.ts` | 3    | Add Dash describe block                      |
| `src/engine/selector-filter-integration.test.ts`     | 1    | DELETE                                       |
| `src/engine/selector-filter-hp-edge.test.ts`         | 1    | NEW (split A)                                |
| `src/engine/selector-filter-pipeline.test.ts`        | 1    | NEW (split B)                                |
| `src/engine/selector-filter-conditions.test.ts`      | 1    | NEW (split C)                                |
| `src/engine/combat.ts`                               | 2    | Add pre-HP snapshot, conditional death check |
| `src/engine/combat-death-dedup.test.ts`              | 2    | NEW (dedup regression tests)                 |
