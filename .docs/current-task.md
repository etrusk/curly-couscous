# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively. -->

## Current Focus

RuleEvaluations prototype complete. All four core UI panels implemented. Next: enhance SkillsPanel with sentence-builder UI for skill configuration.

## Spike Learnings: Max Width Without Scrollbars

**Question:** How to maximize screen width without horizontal scrollbars?

**Approaches Tested:**

1. `100vw` vs `100%` - vw includes scrollbar width (causes overflow), % respects parent (safe)
2. `overflow-x: hidden` - Hides symptom, doesn't fix cause
3. `box-sizing: border-box` - Essential to include padding in width calculations
4. `dvw` (dynamic viewport) - Same scrollbar issue as vw
5. Clean percentage-based approach (recommended)

**Recommended Solution:**

- `width: 100%` + `max-width: 100%` (safe, respects scrollbar)
- `box-sizing: border-box` on all elements
- Remove #root padding, let .app handle it
- Minimal .app padding (0.5rem vs 2rem)
- Clean html/body: `margin: 0; padding: 0; overflow-x: hidden`

**Key Insight:** Viewport units (vw, dvw) don't account for scrollbar width. Always use % for width when scrollbars present.

## Recent Completions

- 2026-01-03: RuleEvaluations prototype - Read-only decision display, expandable skill details, faction-based grouping, 479 tests (1e4358f)
- 2026-01-03: UI layout restructure - All panels positioned, SkillsPanel/RuleEvaluations span full height, 461 tests (51198c6)
- 2026-01-02: SkillsPanel prototype - Click-to-select, skill configuration, priority reordering, 461 tests

## Next Steps

- Sentence-builder UI for SkillsPanel configuration
