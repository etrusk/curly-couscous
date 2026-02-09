# Review Findings: Vitest Browser Mode Setup

**Reviewer**: tdd-reviewer | **Date**: 2026-02-09 | **Verdict**: APPROVED with minor notes

## Quality Gates

| Gate          | Status | Details                       |
| ------------- | ------ | ----------------------------- |
| TypeScript    | PASS   | `tsc --noEmit` clean          |
| ESLint        | PASS   | No warnings or errors         |
| Unit tests    | PASS   | 150 files, 1448 tests passing |
| Browser tests | PASS   | 1 file, 4 tests passing       |

## Checklist Results

### 1. Duplication Check - PASS

No duplication found. Browser tests target real-DOM behaviors (getBoundingClientRect, viewport constraints) that jsdom tests cannot cover. No overlap with existing 13 jsdom tests in `CharacterTooltip.test.tsx`.

### 2. Spec Compliance - PASS

Tests validate tooltip positioning requirements from spec (right-preferred, left-fallback, viewport clamping). No production code changed.

### 3. Pattern Compliance - PASS

- Test file co-located with component per project pattern
- `beforeEach` store reset matches existing jsdom test pattern
- CSS modules inherited via `extends: true` in workspace config

### 4. Configuration Correctness - PASS

- `test.projects` with `extends: true` correctly inherits plugins/CSS config
- Include/exclude patterns are mutually exclusive (no double-running)
- `test:watch` scoped to unit project (fast TDD loop preserved)
- `test` script runs both projects via `vitest run`

### 5. No Regressions - PASS

All 1448 unit tests pass unchanged. The workspace migration from flat `test` block to `test.projects` preserves all existing behavior.

## Issues Found

### IMPORTANT: Hardcoded Chromium path (portability)

**File**: `/home/bob/Projects/auto-battler/vite.config.ts` line 49
**Issue**: `executablePath: "/usr/bin/chromium"` is Linux-specific. This will fail on macOS or Windows, and in CI environments where Chromium is at a different path.
**Recommendation**: Remove `executablePath` and let Playwright auto-detect, or use an environment variable fallback: `process.env.CHROMIUM_PATH || undefined`.
**Mitigating factor**: Session log documents this was necessary due to a SOCKS proxy issue blocking `npx playwright install chromium`. The downloaded browser binary would normally be auto-detected.

### MINOR: Screenshot artifacts not gitignored

**File**: `src/components/BattleViewer/__screenshots__/`
**Issue**: Vitest Browser Mode generated screenshot artifacts (2 PNG files). These should be added to `.gitignore` unless intentionally tracked for visual regression testing.

### MINOR: Missing planned documentation updates

**Files**: Plan Step 10 specified ADR-022, architecture.md update, and decisions/index.md update. None were created.
**Mitigating factor**: Session log shows the coder phase focused on infrastructure + tests. Documentation can be a follow-up commit. Not blocking.

## Summary

Clean implementation. The workspace configuration correctly separates unit and browser test projects. Tests are well-structured, target genuine jsdom gaps, and follow the approved test designs with review adjustments applied (relational assertions, waitFor timing). The hardcoded Chromium path is the only notable concern -- it works on this machine but reduces portability. Recommend addressing it before CI integration.
