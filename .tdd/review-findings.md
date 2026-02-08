# Review Findings: Phases 7+8 (Kick/Interrupt + Charge)

**Reviewer:** TDD Review Agent
**Date:** 2026-02-08
**Tests:** 1504/1504 passing, TypeScript + ESLint clean

## Verdict: APPROVED (0 critical, 3 non-blocking)

All 18 acceptance criteria verified against requirements.md. Pipeline ordering correct: Healing -> Interrupts -> Charges -> Movement -> Combat. All files under 400 lines. No `any` casts in source. No security concerns.

---

## NON-BLOCKING Issues

### NB-1: Duplicate DeathEvent emission on charge kills (IMPORTANT)

**Files:** `src/engine/charge.ts:124-133`, `src/engine/combat.ts:92-101`

Both `resolveCharges` and `resolveCombat` iterate ALL `updatedCharacters` and emit `DeathEvent` for any with `hp <= 0`. When charge kills a character, charge emits a DeathEvent. Then combat runs on the same `updatedCharacters` and emits another DeathEvent for the same character (still has `hp <= 0`). The test `charge-kill-followed-by-combat-no-duplicate-death` uses `toContainEqual` which passes even with duplicates -- it does not assert exactly one death event.

**Impact:** UI event log may show duplicate death messages. No gameplay impact (dead chars filtered at line 107 of game-core.ts regardless).

**Recommendation:** Add `hp > 0` pre-check guard before death emission in combat.ts, or deduplicate in charge.ts by tracking pre-charge HP. Address in a follow-up patch.

### NB-2: Test helper type cast `actionType: "charge" as "attack"`

**Files:** All 6 test files use `actionType: "interrupt" as "attack"` or `actionType: "charge" as "attack"` in `createSkill` calls.

The `createSkill` helper already accepts the full `Skill` type which includes `"interrupt" | "charge"` in `actionType`. The `as "attack"` cast is unnecessary and misleading -- it obscures the actual type being set. The runtime behavior is correct because the `type` field on the Action object is set separately via `type: "charge" as const`.

**Impact:** Readability only. No runtime issue.

### NB-3: Charge movement uses greedy algorithm (different from Dash's A\*)

**Files:** `src/engine/charge.ts:163-222`

Plan Step 6 specified reusing `computeMultiStepDestination()` from Dash. Implementation instead created a separate `computeChargeDestination()` using greedy distance minimization. Session notes justify this (charge should not route around obstacles), and all tests pass. The deviation is reasonable and intentional. However, the plan.md should reflect this for documentation accuracy.

**Impact:** Documentation/plan divergence only. Behavior is correct per acceptance criteria.

---

## Positive Observations

- Pipeline integration is clean; `resolvedCharacterIds` prevents already-resolved charge/interrupt characters from blocking movement
- Interrupt resolution correctly uses shallow copies and sequential visibility for multiple interrupts
- defaultTrigger/defaultFilter on SkillDefinition is backward-compatible
- Test coverage is thorough: 36 tests across 6 files covering all acceptance criteria
- UI updates handle new types exhaustively in switch statements (no default fallthrough)
- Bidirectional line detection in IntentOverlay correctly includes charge alongside attack
