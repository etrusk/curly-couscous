# Debug Investigations Index

LLM-optimized index of debugging sessions, root cause analyses, and lessons learned.

**Token Budget**: Keep this index under 200 tokens. Full investigation details are in separate files.

**Usage**: When agents need investigation details, reference the specific investigation file (e.g., `investigations/inv-001-intent-lines-not-rendering.md`), not this index.

## Investigations

| ID      | Issue                                       | Date       | Status   | File                                                                             |
| ------- | ------------------------------------------- | ---------- | -------- | -------------------------------------------------------------------------------- |
| INV-001 | Intent Lines Not Rendering After Timing Fix | 2026-01-27 | Resolved | [inv-001-intent-lines-not-rendering.md](./inv-001-intent-lines-not-rendering.md) |
| INV-002 | TDD Command Context Bloat                   | 2026-01-27 | Resolved | [inv-002-tdd-command-context-bloat.md](./inv-002-tdd-command-context-bloat.md)   |

## Adding New Investigations

1. Create new file: `.docs/investigations/inv-XXX-brief-title.md`
2. Use template:
   - Issue: Brief description
   - Date: When investigated
   - Symptoms: Observable behavior
   - Root Cause: Actual cause
   - Fix Applied: Resolution
   - Prevention: How to avoid
   - Related Files: Files involved
3. Add row to table above

**Remember**: Keep index minimal. Put details in separate files.
