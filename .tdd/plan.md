# Plan: Delete Legacy Components (SkillsPanel, InventoryPanel)

## Summary

Pure dead-code deletion. Both components are confirmed unused (not imported in App.tsx), marked "(Legacy - to be deleted)" in architecture.md, and fully replaced by CharacterPanel. This removes 8 files and ~2000 lines of dead code, along with 6 undefined CSS tokens that exist only in these legacy files.

## Test Decision: No New Tests Needed

**Rationale**: This is a pure deletion of dead code. No behavioral changes, no new code, no modified logic. The verification step is running the existing test suite and type-check to confirm nothing breaks. Writing tests for code being deleted would be counterproductive.

**Verification plan**: `npm run test`, `npm run type-check`, `npm run build` must all pass after deletion.

## Steps

### Step 1: Delete SkillsPanel directory (4 files)

Delete the entire directory: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/`

Files removed:

- `SkillsPanel.tsx` (377 lines)
- `SkillsPanel.test.tsx` (~1540 lines)
- `SkillsPanel.module.css`
- `index.ts`

### Step 2: Delete InventoryPanel directory (4 files)

Delete the entire directory: `/home/bob/Projects/auto-battler/src/components/InventoryPanel/`

Files removed:

- `InventoryPanel.tsx` (80 lines)
- `InventoryPanel.test.tsx`
- `InventoryPanel.module.css`
- `index.ts`

### Step 3: Clean up comment references

Three comment-only references need updating (no code changes, just comments):

**File: `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors.ts`**

- **Line 76**: Change `InventoryPanel (display filtering)` to `CharacterPanel (display filtering)` in the JSDoc comment for the faction-assigned-skills helper. The selector is used by CharacterPanel now, not InventoryPanel.

- **Lines 360-362**: Change section header from `// SkillsPanel Selectors` to `// CharacterPanel Selectors`. The selectors below (`selectSelectedCharacterId`, `selectSelectedCharacter`) are still in active use by CharacterPanel. Only the section label is stale.

**File: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`**

- **Line 2**: Change `Tests for SkillsPanel store integration` to `Tests for skill store integration` in the file-level JSDoc. The tests validate store actions/selectors that are now consumed by CharacterPanel.

### Step 4: Update architecture.md

In `/home/bob/Projects/auto-battler/.docs/architecture.md`, lines 54-55:

- Remove `│   ├── SkillsPanel/  # (Legacy - to be deleted)`
- Remove `│   ├── InventoryPanel/ # (Legacy - to be deleted)`

These lines are in the Project Structure tree under `components/`.

### Step 5: Update current-task.md

In `/home/bob/Projects/auto-battler/.docs/current-task.md`:

- Remove the next-step item: `Migrate remaining undefined tokens in legacy components (SkillsPanel, InventoryPanel) or delete legacy components`
- Remove the next-step item: `Fix pre-existing TypeScript errors (TS18048 in charge-events.test, TS2532 in interrupt.test)` (already resolved per exploration findings)
- Add a recent completion entry for this task

### Step 6: Verify

Run in order:

1. `npm run type-check` -- TypeScript compilation must succeed
2. `npm run test` -- All existing tests must pass (legacy test files are deleted, not failing)
3. `npm run build` -- Full build must succeed
4. `npm run lint` -- Linting must pass

## Risk Assessment

**Risk: LOW**. These components are self-contained dead code with zero imports from any active code path. The only cross-references are comments (Step 3), which are cosmetic fixes.

**Potential surprise**: If any file not found by exploration imports from `SkillsPanel` or `InventoryPanel`, TypeScript compilation (Step 6) will catch it immediately.

## Architectural Decisions

No new architectural decisions introduced. This plan executes an existing decision already documented in architecture.md ("Legacy - to be deleted").

## Files Modified (Total: 3 edited, 8 deleted)

**Deleted (8)**:

- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.tsx`
- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.module.css`
- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/index.ts`
- `/home/bob/Projects/auto-battler/src/components/InventoryPanel/InventoryPanel.tsx`
- `/home/bob/Projects/auto-battler/src/components/InventoryPanel/InventoryPanel.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/InventoryPanel/InventoryPanel.module.css`
- `/home/bob/Projects/auto-battler/src/components/InventoryPanel/index.ts`

**Edited (5)**:

- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors.ts` (2 comment updates)
- `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts` (1 comment update)
- `/home/bob/Projects/auto-battler/.docs/architecture.md` (remove 2 lines from project structure tree)
- `/home/bob/Projects/auto-battler/.docs/current-task.md` (update task status)
- `/home/bob/Projects/auto-battler/.tdd/session.md` (phase tracking)

## Spec Alignment Checklist

- [x] Plan aligns with `.docs/spec.md` requirements -- spec references CharacterPanel, not legacy components
- [x] Approach consistent with `.docs/architecture.md` -- architecture explicitly marks these as "Legacy - to be deleted"
- [x] Patterns follow `.docs/patterns/index.md` -- no patterns involved (pure deletion)
- [x] No conflicts with `.docs/decisions/index.md` -- no ADR conflicts

## Commit

Single conventional commit: `chore(ui): delete legacy SkillsPanel and InventoryPanel components`
