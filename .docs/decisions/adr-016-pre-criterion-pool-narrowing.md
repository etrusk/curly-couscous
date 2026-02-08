# ADR-016: Pre-Criterion Pool Narrowing for Skill Filters

## Decision

Skill filters narrow the candidate pool before criterion selection (pre-criterion), not after (post-criterion). A shared per-candidate condition evaluator is used by both triggers and filters. Self-target skills bypass filter evaluation entirely.

## Date

2026-02-08

## Context

Phase 1 introduced the unified trigger system with `evaluateConditionForCandidate()`. Phase 2 needed to unify filters with the same condition model. The original filter design (ADR-015) validated the selected target after criterion selection (post-criterion). This created a semantic mismatch: triggers evaluate against a pool (existential check), but filters validated a single already-selected target.

## Options Considered

1. **Post-criterion validation (existing)**: Criterion selects best target, filter validates it. If filter fails, skill is rejected (no fallback to next-best candidate).
2. **Pre-criterion pool narrowing**: Filter removes non-matching candidates from the pool, criterion selects from the narrowed set.
3. **Pool extraction + separate filter step**: Extract pool construction from `evaluateTargetCriterion`, filter externally, pass filtered pool back.

## Decision Rationale

Pre-criterion pool narrowing (Option 2) was chosen because:

- Semantically correct: filter expresses "only consider targets matching X", not "reject if the best target doesn't match X"
- With multiple candidates, pre-criterion selects the best matching candidate rather than failing if the single best doesn't match
- Implemented via optional `candidateFilter` parameter on `evaluateTargetCriterion()` -- minimal API change
- `hasCandidates()` helper distinguishes `filter_failed` (base pool non-empty, filtered pool empty) from `no_target` (base pool empty)
- Self-target bypass is correct: self-targeting has no pool to narrow

## Consequences

- `evaluateTargetCriterion()` gains optional `candidateFilter?: (c: Character) => boolean` parameter
- `hasCandidates()` added to `selectors.ts` for `no_target` vs `filter_failed` distinction
- Shared `evaluateConditionForCandidate()` in `triggers.ts` used by both trigger (`pool.some()`) and filter (`pool.filter()`) evaluation
- `evaluateFilterForCandidate()` in `selector-filters.ts` wraps shared evaluator with negation support
- Self-target skills ignore filters silently (no error, no validation)
- Multi-candidate scenarios may select different targets than the old post-criterion design (intended improvement)
