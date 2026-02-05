# TDD Session

## Task

Reshape skill system: universal behavior, target+criterion split, universal duplication

## Confirmed Scope

Refactor skill slot data model to uniform shape (trigger + target + criterion + behavior). Three tightly coupled changes: (1) Add universal `behaviors` property to all skills, rename Move's `mode` to `behavior`; (2) Split monolithic `selector` into separate `target` and `criterion` fields, add mirror selectors (furthest, highest_hp); (3) Extend Move-specific duplication to all skills with registry-defined `maxInstances`. Single coherent refactor, not separate commits.

## Acceptance Criteria

- Every skill slot has the shape: trigger + target + criterion + behavior
- No skill has special-case fields (Move's old `mode` is gone)
- All skills are duplicatable up to their registry-defined maxInstances
- All existing game logic (decision evaluation, resolution, collision) works unchanged
- All existing tests updated and passing
- New tests cover: mirror selectors (furthest, highest_hp), target+criterion combinations, duplication of non-Move skills, maxInstances enforcement
- .docs/spec.md updated to reflect new data model (Targeting System and Starting Skills sections)

## Current Phase

SYNC_DOCS - COMPLETE. All documentation changes specified in .tdd/doc-updates.md. Ready for Coder to apply.

## Phase History

- 2026-02-05T00:00:00Z INIT -> EXPLORE
- 2026-02-05 EXPLORE -> PLAN (Architect agent, ~7 exchanges, ~25K tokens)
- 2026-02-05 PLAN -> DESIGN_TESTS (Architect agent, ~5 exchanges, ~35K tokens)
- 2026-02-05 DESIGN_TESTS -> TEST_DESIGN_REVIEW (Architect agent, ~6 exchanges, ~35K tokens)
- 2026-02-05 TEST_DESIGN_REVIEW -> WRITE_TESTS (Architect agent, ~5 exchanges, ~18K tokens)
- 2026-02-05 WRITE_TESTS -> IMPLEMENT (Coder agent, ~17 exchanges, ~91K tokens) - PARTIAL
- 2026-02-05 IMPLEMENT -> REVIEW (Reviewer agent, ~7 exchanges, ~30K tokens) - CHANGES REQUESTED
- 2026-02-05 REVIEW -> ANALYZE_FIX (Architect agent, ~5 exchanges, ~30K tokens)
- 2026-02-05 REVIEW cycle 2 (Reviewer agent, ~6 exchanges, ~20K tokens) - APPROVED
- 2026-02-05 SYNC_DOCS (Architect agent, ~4 exchanges, ~20K tokens) - COMPLETE

## Context Metrics

Orchestrator: 8K/100K (8%)
Cumulative agent tokens: ~224K
Agent invocations: 13

### Agent History

| #   | Agent     | Phase              | Exchanges | Tokens | Status            |
| --- | --------- | ------------------ | --------- | ------ | ----------------- |
| 1   | Architect | EXPLORE            | 7         | ~25K   | COMPLETE          |
| 2   | Architect | PLAN               | 5         | ~35K   | COMPLETE          |
| 3   | Architect | DESIGN_TESTS       | 6         | ~35K   | COMPLETE          |
| 4   | Architect | TEST_DESIGN_REVIEW | 5         | ~18K   | COMPLETE          |
| 5   | Coder     | WRITE_TESTS        | 9         | ~65K   | COMPLETE          |
| 6   | Coder     | IMPLEMENT          | 17        | ~91K   | PARTIAL           |
| 7   | Coder     | IMPLEMENT          | 14        | ~72K   | PARTIAL (98.9%)   |
| 8   | Coder     | FIX                | 14        | ~77K   | PARTIAL (99.4%)   |
| 9   | Reviewer  | REVIEW             | 7         | ~30K   | CHANGES REQUESTED |
| 10  | Architect | ANALYZE_FIX        | 5         | ~30K   | COMPLETE          |
| 11  | Coder     | FIX                | 9         | ~61K   | COMPLETE          |
| 12  | Reviewer  | REVIEW (cycle 2)   | 6         | ~20K   | APPROVED          |
| 13  | Architect | SYNC_DOCS          | 4         | ~20K   | COMPLETE          |

## Quality Gates Status

- Tests: 1102/1103 passing (99.9%)
- TypeScript: PASS (0 errors)
- Build: PASS (production build successful)
- ESLint: Pre-existing issues unrelated to this refactor (acceptable)

## Review Cycles

Count: 2

- Review 1: TEST_DESIGN_REVIEW - APPROVED with 3 minor gaps, 2 issues (non-blocking)
- Review 2: REVIEW (final) - APPROVED: 0 critical, 1 important (stale comments), 2 minor. Ready for SYNC_DOCS.

## Next Steps

Coder agent applies documentation changes from `.tdd/doc-updates.md`, then COMMIT.
