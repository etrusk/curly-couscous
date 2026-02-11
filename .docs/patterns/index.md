# Proven Patterns Index

LLM-optimized index of implementation patterns successfully applied in this codebase.

**Token Budget**: Keep this index under 200 tokens. Full pattern details are in separate files.

**Usage**: When agents need pattern details, reference the specific pattern file (e.g., `patterns/[pattern-name].md`), not this index.

## Patterns

| Pattern                    | Description                                                                        | File                                                             |
| -------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Bidirectional Line Offset  | Perpendicular offset for overlapping bidirectional SVG lines                       | [bidirectional-line-offset.md](./bidirectional-line-offset.md)   |
| Portal Tooltip Positioning | Smart viewport-aware tooltips with portal rendering                                | [portal-tooltip-positioning.md](./portal-tooltip-positioning.md) |
| Browser Test Convention    | `.browser.test.tsx` naming for Vitest Browser Mode tests                           | (inline, see ADR-022)                                            |
| CSS Variable Probe Element | Probe element technique for resolving CSS custom properties                        | [css-variable-probe-element.md](./css-variable-probe-element.md) |
| Scoring Module Extraction  | Extract candidate scoring into separate module when host file nears 400-line limit | (inline, see ADR-024)                                            |

**Note**: Progressive disclosure patterns (collapsible sections, nested tooltips) are documented as design principles in `spec.md` rather than implementation patterns.

## Visual Patterns

| Pattern                     | Description                                                                  | Reference                        |
| --------------------------- | ---------------------------------------------------------------------------- | -------------------------------- |
| Ghost Button                | Transparent background + dashed border; content appears on hover             | `ui-ux-guidelines.md` Buttons    |
| Opacity Text Hierarchy      | Primary (87%), secondary (60%), muted (38%), ghost (15%) opacity levels      | `ui-ux-guidelines.md` Typography |
| Row Density                 | `0.5rem` padding, `0.5rem` gap, `0.85rem` font; battle mode compacts further | `visual-specs/skill-row.md`      |
| SVG Overlay Stack           | Grid(0) < whiff(5) < intents(10) < damage(20) < tooltip(1000) z-ordering     | `visual-specs/battle-viewer.md`  |
| Contrast Outline            | White stroke behind colored stroke for SVG line visibility on any background | `visual-specs/intent-line.md`    |
| Evaluation Status Indicator | Left `3px` border color + icon color encodes selected/rejected/skipped       | `visual-specs/skill-row.md`      |

## Adding New Patterns

1. Create new file: `.docs/patterns/[pattern-name].md`
2. Use template:
   - Context: When to use
   - Implementation: Code example
   - Rationale: Why it works
   - Related Files: Where used
3. Add row to table above

**Remember**: Keep index minimal. Put details in separate files.
