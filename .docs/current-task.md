# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively. -->

## Recent Completions

- 2026-01-26: Intent lines visualization fix - Fixed selector to show intent lines for actions with ticksRemaining > 0 (Heavy Punch shows arrow, Light Punch does not). Updated spec.md with visibility rule.
- 2026-01-26: Character icons alphabetical letters - Added letter display to tokens based on slotPosition (A, B, C...). Implemented letterMapping utility, updated Token component with SVG text, maintained visual design and accessibility.
- 2026-01-25: spec.md verification - Updated spec to reflect current implementation
- 2026-01-25: RuleEvaluations.test.tsx decomposition - Split into 3 focused test modules
- 2026-01-25: selectors.test.ts decomposition - Split into 9 focused test modules
- 2026-01-25: triggers.test.ts decomposition - Split into 7 focused test modules

## Next Steps

- Rule Evaluations should show all current board characters
- Skill priority sub panel should always show any higher priority rules not satisfied with reason, then expandable section with remaining rules
- If only 2 characters, they move erratically in a zig-zag towards each other, should be smoother
- Sentence-builder UI for SkillsPanel configuration
- Movement and targeting should have their own intent lines
- Change Heavy Punch to resolve on 2nd tick
