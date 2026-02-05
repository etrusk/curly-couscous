# Review Findings

## Summary

- Files reviewed: 14 (types, registry, game-decisions, selectors, game-actions, gameStore, duplication tests, selector tests, session state)
- Critical issues: 0
- Important issues: 1
- Minor issues: 2
- Spec compliance: PASS (implementation criteria met; documentation update deferred to SYNC_DOCS)
- Pattern compliance: PASS

## Acceptance Criteria Status

### 1. Every skill slot has shape: trigger + target + criterion + behavior

- **Status**: MET
- **Evidence**: `src/engine/types.ts:54-68` -- `Skill` interface has `triggers: Trigger[]`, `target: Target`, `criterion: Criterion`, `behavior: string`. All fields required (non-optional).

### 2. No skill has special-case fields (mode is gone)

- **Status**: MET
- **Evidence**: `src/engine/types.ts` -- No `mode` field. No `selectorOverride` field. Confirmed via grep: zero `.mode` property accesses in production or test `.ts`/`.tsx` files.

### 3. All skills are duplicatable up to registry-defined maxInstances

- **Status**: MET
- **Evidence**: `src/stores/gameStore.ts:367-377` -- `duplicateSkill()` looks up `def.maxInstances` from `SKILL_REGISTRY`. Registry entries: Move has `maxInstances: 3`, all others `maxInstances: 1`. Tests verify both limits (`gameStore-skills-duplication.test.ts:200-217`).

### 4. All existing game logic works unchanged

- **Status**: MET
- **Evidence**: 1102/1103 tests passing. TypeScript compiles with 0 errors. Production build succeeds.

### 5. All existing tests updated and passing

- **Status**: MET
- **Evidence**: 1102 passing, 0 failing, 1 skipped (intentional browser verification test).

### 6. New tests cover mirror selectors, target+criterion combinations, non-Move duplication, maxInstances enforcement

- **Status**: MET
- **Evidence**:
  - `selectors-furthest.test.ts` -- 7 tests covering furthest enemy/ally with tiebreaking
  - `selectors-highest-hp.test.ts` -- 5 tests covering highest_hp enemy/ally with tiebreaking
  - `selectors-target-criterion.test.ts` -- All 12 target+criterion combinations plus self-ignores-criterion and null-return cases
  - `gameStore-skills-duplication.test.ts:200-217` -- maxInstances: 1 blocks duplication

### 7. .docs/spec.md updated for new data model

- **Status**: DEFERRED TO SYNC_DOCS
- Spec still references old "Target Selectors" (5 selector types), does not document `Target`/`Criterion` split, `furthest`, or `highest_hp`. This is Step 8 per the plan and is expected to be handled in the SYNC_DOCS phase.

## Issues

### IMPORTANT

#### Stale comment in game-decisions.ts references removed selectorOverride pattern

- **File**: `src/engine/game-decisions.ts:58`
- **Description**: JSDoc comment says "Use selector (skill.selectorOverride ?? DEFAULT_SELECTOR) to find target" but the code now uses `evaluateTargetCriterion(skill.target, skill.criterion, ...)`. Similarly, `src/engine/skill-registry.ts:106` says "enabled, triggers, selectorOverride" in a comment.
- **Risk**: Misleading for future developers reading the code.
- **Suggested fix**: Update comments to reference `target`/`criterion` instead of `selectorOverride`.

### MINOR

#### Legacy evaluateSelector function retained in selectors.ts

- **File**: `src/engine/selectors.ts:84-174`
- **Description**: `evaluateSelector()` with its local `Selector` type is retained for backward compatibility with 8 existing test files. Production code exclusively uses `evaluateTargetCriterion()`.
- **Risk**: Low. The old function is not imported by any production code. The local `Selector` type is correctly scoped to `selectors.ts` only (removed from `types.ts`).
- **Suggested fix**: Consider migrating old test files to `evaluateTargetCriterion` in a follow-up task and removing `evaluateSelector` entirely.

#### Duplication test still says "rejects non-move skills" using old terminology

- **File**: `src/stores/gameStore-skills-duplication.test.ts:153`
- **Description**: Test description says "rejects non-move skills" but the actual behavior is now "rejects skills with maxInstances: 1". The test is functionally correct but the description is misleading given the universal duplication model.
- **Risk**: Low. Test logic is correct; only the description is outdated.
- **Suggested fix**: Rename to "rejects duplication when maxInstances is 1" or similar.

## Documentation Recommendations

- [ ] SYNC_DOCS phase: Update `.docs/spec.md` Targeting System section for Target+Criterion model
- [ ] SYNC_DOCS phase: Document `furthest` and `highest_hp` criteria in spec
- [ ] SYNC_DOCS phase: Update Starting Skills section for `behavior` field
- [ ] SYNC_DOCS phase: Create ADR-011 for explicit actionType decision
- [ ] Follow-up: Migrate old selector tests from `evaluateSelector` to `evaluateTargetCriterion`

## Verdict

[x] APPROVED - All implementation criteria met. One important comment-cleanup issue (non-blocking). Documentation update deferred to SYNC_DOCS phase per plan Step 8.
