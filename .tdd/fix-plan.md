# Fix Plan

## Summary

Documentation-only fixes for stale version references discovered during review (IMPORTANT-1). Two files are affected: `.docs/architecture.md` (flagged by reviewer) and `CLAUDE.md` (discovered during analysis -- same React upgrade left multiple version strings outdated).

Source of truth: `package.json` (version 0.20.0).

## Issues to Address

### 1. Architecture doc: React version stale

- **Root cause**: React 18 to 19 upgrade did not update `.docs/architecture.md` tech stack section.
- **Fix**: Change `React 18+` to `React 19+`
- **File**: `/home/bob/Projects/auto-battler/.docs/architecture.md:6`
- **Old**: `- Framework: React 18+`
- **New**: `- Framework: React 19+`
- **Risk**: None. Documentation-only change.

### 2. Architecture doc: Vite version stale

- **Root cause**: Vite was upgraded from 5 to 7 at some prior point but the architecture doc was not updated.
- **Fix**: Change `Vite 5` to `Vite 7`
- **File**: `/home/bob/Projects/auto-battler/.docs/architecture.md:8`
- **Old**: `- Build Tool: Vite 5`
- **New**: `- Build Tool: Vite 7`
- **Risk**: None. Documentation-only change.

### 3. CLAUDE.md: Project version stale

- **Root cause**: Version bump from 0.19.0 to 0.20.0 was applied to `package.json` but not to `CLAUDE.md`.
- **Fix**: Update version string
- **File**: `/home/bob/Projects/auto-battler/CLAUDE.md:9`
- **Old**: `**Version:** 0.19.0 (follows SemVer: MAJOR.MINOR.PATCH)`
- **New**: `**Version:** 0.20.0 (follows SemVer: MAJOR.MINOR.PATCH)`
- **Risk**: None. Documentation-only change.

### 4. CLAUDE.md: React version stale in tech stack

- **Root cause**: React 18 to 19 upgrade did not update the CLAUDE.md tech stack.
- **Fix**: Update React version from 18.2 to 19.2
- **File**: `/home/bob/Projects/auto-battler/CLAUDE.md:15`
- **Old**: `- Framework: React 18.2 with Vite 7.3`
- **New**: `- Framework: React 19.2 with Vite 7.3`
- **Risk**: None. Documentation-only change.

### 5. CLAUDE.md: TypeScript version stale

- **Root cause**: TypeScript was upgraded from 5.3 to 5.9 but CLAUDE.md was not updated.
- **Fix**: Update TypeScript version
- **File**: `/home/bob/Projects/auto-battler/CLAUDE.md:13`
- **Old**: `- Language: TypeScript 5.3`
- **New**: `- Language: TypeScript 5.9`
- **Risk**: None. Documentation-only change.

### 6. CLAUDE.md: Zustand version stale

- **Root cause**: Zustand was upgraded from 4.4 to 4.5 but CLAUDE.md was not updated.
- **Fix**: Update Zustand version
- **File**: `/home/bob/Projects/auto-battler/CLAUDE.md:16`
- **Old**: `- State Management: Zustand 4.4 with Immer`
- **New**: `- State Management: Zustand 4.5 with Immer`
- **Risk**: None. Documentation-only change.

### 7. CLAUDE.md: Prettier version stale

- **Root cause**: Prettier was upgraded from 3.1 to 3.8 but CLAUDE.md was not updated.
- **Fix**: Update Prettier version
- **File**: `/home/bob/Projects/auto-battler/CLAUDE.md:19`
- **Old**: `- Formatting: Prettier 3.1`
- **New**: `- Formatting: Prettier 3.8`
- **Risk**: None. Documentation-only change.

## Files to Modify

| File                    | Changes                           |
| ----------------------- | --------------------------------- |
| `.docs/architecture.md` | 2 edits (lines 6, 8)              |
| `CLAUDE.md`             | 5 edits (lines 9, 13, 15, 16, 19) |

## Verification

After applying fixes, grep for any remaining references to "React 18", "Vite 5", "0.19.0", "TypeScript 5.3", "Zustand 4.4", or "Prettier 3.1" across `.docs/` and `CLAUDE.md` to confirm no stale references remain.

## Notes

- The MINOR issues from the review (act() warnings, single commit) are non-blocking and do not require fixes.
- Architecture doc line 5 says `TypeScript 5.x (strict mode)` which is intentionally vague with the `.x` wildcard -- this is fine and does not need updating.
