# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively. -->

## Current Focus

**Goal**: Enhance Skill Priority sub-panel UI in Rule Evaluations component to improve transparency of AI decision-making.

**Scope**: Modify the `SkillPriorityList` component in `src/components/RuleEvaluations/RuleEvaluations.tsx` to:

1. Always show any higher priority skills that are not satisfied (with their rejection reasons)
2. Show an expandable section with remaining lower-priority skills
3. Maintain existing functionality for selected skill highlighting and collapsible sections

**Files Involved**:

- `src/components/RuleEvaluations/RuleEvaluations.tsx` - Main component with `SkillPriorityList` function
- `src/components/RuleEvaluations/RuleEvaluations.module.css` - Styling for new UI elements
- `src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx` - Update tests for new behavior
- Possibly `src/components/RuleEvaluations/rule-evaluations-basic.test.tsx` - Update basic tests

**Approach**:

1. Analyze current `SkillPriorityList` logic that shows skills up to selected index
2. Modify to show all unsatisfied higher-priority skills (status: "rejected") with rejection reasons
3. Keep selected skill visible and highlighted
4. Group remaining lower-priority skills (both satisfied and unsatisfied) in expandable section
5. Update CSS for visual hierarchy and accessibility
6. Update existing tests to verify new behavior

**Constraints**:

- Must maintain TypeScript strict mode compliance
- Must not break existing test suite
- Must follow project accessibility guidelines (shape redundancy, contrast ratios)
- Must keep file under 400 lines (currently 444 lines, may need decomposition)
- UI should remain consistent with existing design patterns

**Success Criteria**:

- Users can see why higher priority skills were skipped before reaching selected skill
- Expandable section clearly indicates remaining skills count
- All existing tests pass with updated expectations
- Visual verification shows improved information hierarchy

## Recent Completions

- 2026-01-26: Rule Evaluations show all board characters - Implemented selector `selectAllCharacterEvaluations`, multi-character view with condensed headers, expandable sections. Updated spec.md UI Layout section to reflect "all board characters" behavior.
- 2026-01-26: Token.test.tsx decomposition - Split 428-line file into token-visual.test.tsx (327 lines) and token-interaction.test.tsx (206 lines), resolving ESLint max-lines violation. All tests pass (664 tests).
- 2026-01-26: Intent lines visualization fix - Fixed selector to show intent lines for actions with ticksRemaining > 0 (Heavy Punch shows arrow, Light Punch does not). Updated spec.md with visibility rule.
- 2026-01-26: Character icons alphabetical letters - Added letter display to tokens based on slotPosition (A, B, C...). Implemented letterMapping utility, updated Token component with SVG text, maintained visual design and accessibility.

## Next Steps

- Skill priority sub panel should always show any higher priority rules not satisfied with reason, then expandable section with remaining rules
- If only 2 characters, they move erratically in a zig-zag towards each other, should be smoother
- Sentence-builder UI for SkillsPanel configuration
- Movement and targeting should have their own intent lines
- Change Heavy Punch to resolve on 2nd tick
