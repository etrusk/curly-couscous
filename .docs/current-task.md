# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

Hexagonal grid conversion (99% tests passing, all source files type-safe). Branch: feature/hexagonal-grid-conversion. Core complete: hex.ts, Position {q,r}, pathfinding, movement, stores, all rendering overlays with pixel-space offsets. 1035/1045 tests passing (99.0%). All CRITICAL issues resolved. Remaining: 10 pre-existing React testing failures (CharacterTooltip/battle-viewer-tooltip act() warnings), 271 TypeScript errors in 38 test files (mechanical {x,y} to {q,r}), SVG hex rendering deferred.

## Recent Completions

- 2026-02-04: Hex topology test rewrites (41 tests fixed) - Fixed all hex topology test failures across 4 files: movement-groups-stress (3), game-movement-wall-boundary (18), game-decisions-move-destination-wall-boundary (14), game-movement-escape-routes (6). Test-only changes. Tests improved from 994/1045 (95.1%) to 1035/1045 (99.0%). Established hex test vocabulary: "vertex" replaces "corner" (6 positions, 3 neighbors), "tangential escape" replaces "perpendicular escape", 6-way collision replaces 8-way.

- 2026-02-03: Hexagonal grid conversion (95% complete) - Fixed all CRITICAL issues from TDD review. Updated 20 test files with hex coordinates, fixed 5 source files (IntentOverlay, TargetingLine, TargetingLineOverlay, 2 test helpers). Tests improved from 931/1045 (89.1%) to 994/1045 (95.1%). All source files now compile with 0 TypeScript errors.

- 2026-02-03: Heal skill and action-based intent colors - Completed. Added Heal skill (tickCost: 2, range: 5, healing: 25, lowest_hp_ally). Refactored intent line colors from faction-based to action-based (red=attack, green=heal, blue=move) using Okabe-Ito palette.

- 2026-02-02: Instant attacks and simplified intent line visuals - Completed (commit 6e88fea). Light Punch as instant attack (tickCost: 0). Simplified intent line visual encoding with timing-based styling.

## Next Steps

### Hexagonal Grid Conversion - Remaining Work (branch: feature/hexagonal-grid-conversion)

**Current Status:** 1035/1045 tests passing (99.0%), 0 TypeScript errors in source files

**Phase 2: Fix TypeScript Errors in Test Files (271 errors in 38 files)**

All mechanical {x,y} to {q,r} coordinate updates. Ensure coordinates satisfy hex validity: max(|q|, |r|, |q+r|) <= 5.

**Phase 3: SVG Hex Rendering (SUBSTANTIAL WORK - Can be separate task)**

- Rewrite Grid.tsx, Cell.tsx as SVG hex components
- Update BattleViewer.tsx for hex-aware dimensions
- Remove CSS Grid dependencies
- Visual: flat-top hexagons, proper spacing, hover states

**Phase 4: Browser Testing**

- Verify: hex rendering, character placement, movement, combat, intent lines, targeting

**Phase 5: Documentation Updates**

1. **spec.md** - Update grid section: 12x12 square grid to hex radius 5 (91 hexes), Chebyshev to hex distance, 8-directional to 6-directional
2. **architecture.md** - Add hex.ts utility module, document SVG-based hex rendering
3. **decisions/** - New ADR for hex coordinate system (axial {q,r}, flat-top, radius 5, uniform cost)

**Phase 6: Commit and PR**

- Run all quality gates: `npm run type-check && npm run lint && npm test`
- Commit with conventional commit format

---

Then: Sentence-builder UI for SkillsPanel configuration
