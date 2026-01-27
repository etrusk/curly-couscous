# INV-002: TDD Command Context Bloat

**Date**: 2026-01-27

**Status**: Resolved

## Issue

`.claude/commands/tdd.md` consuming excessive tokens on every invocation.

## Symptoms

- tdd.md file was 634 lines (~7,000 tokens)
- Research shows memory files should total 1.3k-2.2k tokens combined
- Command file loads on EVERY prompt, consuming scarce context budget
- Redundant agent summary examples repeated 12+ times across phases
- Verbose Task tool prompts shown in full for every phase transition

## Root Cause

The file grew organically with detailed examples and explanations for each phase. While helpful for initial understanding, the repetition violated research-backed context management principles:

1. **Context is finite with diminishing returns**: Adding 10% irrelevant content reduces accuracy by 23%
2. **Optimal utilization is 60-75%**: More context increases interference
3. **Separation of concerns**: Static patterns vs dynamic task state
4. **Memory files should be minimal**: Combined total 1.3k-2.2k tokens

## Fix Applied

Reduced tdd.md from 634 lines to 329 lines (~48% reduction, estimated ~65% token reduction):

1. **Consolidated agent summary format**: Defined once at top, removed 12 repetitive examples
2. **Phase routing table**: Condensed all phases into single table instead of verbose procedural text
3. **Simplified Task tool prompts**: Template references instead of full examples for each phase
4. **Removed redundant reminders**: "AUTOMATICALLY spawn" stated once, not repeated 12 times
5. **Compressed session state template**: Showed minimal template instead of verbose example
6. **Eliminated explanatory redundancy**: Trusted agents have access to documentation

## Prevention

1. **Apply token budgets to command files**: Command files load on every invocation—keep them minimal
2. **Define patterns once, reference many**: Use tables and templates instead of repetition
3. **Separate instructions from examples**: Show one example, not twelve variations
4. **Regular context audits**: Review command files against research-backed token budgets

## Related Files

- `.claude/commands/tdd.md` (reduced from 634 to 329 lines)
- `.claude/commands/tdd.md.backup` (original preserved)
- `.docs/research/Context_Memory_and_RAG_for_AI_Coding_Assistants.md` (research source)

## Lessons Learned

- Command files are "hot path" context—they load on EVERY invocation
- Repetition for clarity has a cost—define once, reference many
- Research-backed token budgets (1.3k-2.2k combined) should guide all memory files
- Context is scarce; treat it like a precious budget
