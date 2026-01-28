# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

2026-01-28 (Claude Code TDD): Movement targeting should show intent lines when target changed - Implementing intent line display when movement targets are changed, including first selection at step 1 (no special casing)

## Recent Completions

- 2026-01-27: Documentation and refactoring follow-up - Added ADR-002 documenting uniform filtering architectural decision. Updated INV-001 to clarify movement exception was incorrect (spec always required ticksRemaining >= 0 for all actions). Refactored duplicate posEqual() helper to use existing positionsEqual() from engine/types.ts. All 753 tests passing. Commit c4564b4.
- 2026-01-27: Intent lines fixes - Unified action filtering (removed movement exception, all actions now ticksRemaining >= 0). Added 4px perpendicular offset for bidirectional attacks (prevents overlap). Split test files to comply with 400-line limit (2 files → 7 organized files). Fixed 4 issues: Light attack visibility, movement special treatment, movement targeting visibility, overlapping Heavy attack lines. All 753 tests passing. Commit 049fb6e.
- 2026-01-27: Intent lines not rendering bug fix - Fixed selectIntentData filter broken by commit 44d5cf4 "simplification". Restored proper logic: attacks filtered when ticksRemaining <= 0, movement shown even at ticksRemaining = 0 (movement exception documented in spec). Added 2 regression tests. Documented in investigations/index.md (INV-001). All 732 tests passing.
- 2026-01-27: Intent line styling improvements - Reduced stroke widths (3/4px -> 2/2.5px), tightened dash pattern ("8 4" -> "4 2"), added round line caps, switched markers to fixed userSpaceOnUse units for consistent sizing. Split IntentLine.test.tsx to comply with 400-line limit. All 730 tests passing. Commit 92e873c.
- 2026-01-27: Action resolution timing fix - Changed resolvesAtTick formula from tick+tickCost-1 to tick+tickCost. All actions now have 1+ tick visibility before resolution. Light Punch now dodgeable. Updated spec.md (3 sections), tdd.md (added SYNC_DOCS phase). All 724 tests passing. Commit 44d5cf4.

## Next Steps

- If only 2 characters, they move erratically in a zig-zag towards each other, should be smoother
- Sentence-builder UI for SkillsPanel configuration
