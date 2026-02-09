# ADR-020: React Compiler Adoption with Deferred Manual Memoization Cleanup

**Date:** 2026-02-09
**Status:** Accepted

## Decision

Adopt the React Compiler (`babel-plugin-react-compiler` 1.0.0) as a Babel plugin in the Vite build pipeline, alongside the existing manual `useMemo`/`useCallback` calls. Defer removal of manual memoization to a follow-up task.

## Context

React 19 enables the React Compiler, which automatically inserts memoization during the build step. The codebase has 8 manual `useMemo`/`useCallback` sites. The question was whether to remove them during the upgrade or keep them temporarily.

## Options Considered

1. **Adopt compiler + remove manual memoization immediately** -- Higher upgrade risk, cleaner result
2. **Adopt compiler + keep manual memoization temporarily** -- Lower risk, minor redundancy
3. **Skip compiler, upgrade React only** -- Misses auto-memoization benefits

## Decision Rationale

Option 2 chosen. The compiler coexists cleanly with manual memoization (it skips already-memoized values). Keeping them temporarily adds zero runtime cost and reduces upgrade risk by isolating dependency changes from code changes.

## Consequences

- `eslint-plugin-react-compiler` (RC status, 19.1.0-rc.2) validates compiler compatibility at lint time
- ~~Manual memoization is harmless but redundant -- removal is a low-priority cleanup task~~ **Completed 2026-02-09:** All 8 manual useMemo/useCallback calls removed across 7 files. Zero manual memoization remains in src/.
- All 1434 tests pass with the compiler enabled, confirming no behavioral changes
