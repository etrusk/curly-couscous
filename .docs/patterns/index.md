# Proven Patterns Index

LLM-optimized index of implementation patterns successfully applied in this codebase.

**Token Budget**: Keep this index under 200 tokens. Full pattern details are in separate files.

**Usage**: When agents need pattern details, reference the specific pattern file (e.g., `patterns/[pattern-name].md`), not this index.

## Patterns

| Pattern                            | Description | File |
| ---------------------------------- | ----------- | ---- |
| _(No implementation patterns yet)_ |             |      |

**Note**: Progressive disclosure patterns (collapsible sections, nested tooltips) are documented as design principles in `spec.md` rather than implementation patterns.

## Adding New Patterns

1. Create new file: `.docs/patterns/[pattern-name].md`
2. Use template:
   - Context: When to use
   - Implementation: Code example
   - Rationale: Why it works
   - Related Files: Where used
3. Add row to table above

**Remember**: Keep index minimal. Put details in separate files.
