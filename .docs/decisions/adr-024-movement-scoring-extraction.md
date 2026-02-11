# ADR-024: Extract Scoring Functions to movement-scoring.ts

## Decision

Extract candidate scoring functions from `game-movement.ts` into a new `movement-scoring.ts` module.

## Date

2026-02-11

## Context

`game-movement.ts` was at 362/400 lines. Adding plural movement logic (~60 lines) for the `enemies`/`allies` target feature would exceed the project's 400-line-per-file constraint. The scoring functions form a cohesive unit shared by both singular and plural movement.

## Options Considered

1. **Extract scoring module** (chosen) -- Move scoring functions to `movement-scoring.ts`, keeping both files well under 400 lines.
2. **Inline and compress** -- Keep everything in `game-movement.ts` by making plural code more compact. Would land at ~407 lines, requiring cosmetic line-count trimming.

## Decision Rationale

Extraction creates a clean API boundary: `game-movement.ts` owns movement strategy (towards/away routing, single/multi-step iteration, singular/plural dispatch), while `movement-scoring.ts` owns candidate evaluation (scoring, comparison, selection). Both singular and plural movement reuse the same comparators by constructing `CandidateScore` objects with appropriate distance values.

## Extracted Functions

- `CandidateScore` (interface)
- `calculateCandidateScore()`
- `computePluralCandidateScore()` (new, for aggregate distance scoring)
- `compareAwayMode()`
- `compareTowardsMode()`
- `selectBestCandidate()`
- `countEscapeRoutes()`
- `buildObstacleSet()`

## Consequences

- Two files instead of one for movement logic
- `game-movement.ts` reduced from 362 to ~268 lines; `movement-scoring.ts` is ~274 lines
- No behavior change -- existing tests pass without modification
- Clear separation of concerns enables independent testing of scoring logic
