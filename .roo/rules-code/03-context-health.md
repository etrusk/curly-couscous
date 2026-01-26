# Context Health Rules for Code Mode

## Exchange Budget (ENFORCED)

- **15 exchanges**: Self-assessment checkpoint
- **20 exchanges**: Soft limit—must hand back unless completion imminent
- **25 exchanges**: Hard limit—mandatory handback, no exceptions

### At ~15 exchanges

Pause and self-assess:

- What's implemented and working?
- What's blocked or failing?
- Am I making measurable progress?

If no progress in last 5 exchanges → proceed to Early Stop.

## Early Stop Triggers

Stop immediately and execute handback if ANY occur:

- Editing same file 3+ times without test improvement
- Suggesting previously-tried approach
- Referencing non-existent APIs, methods, or types
- Unable to explain why current fix should work
- Test failures that don't match mental model
- Saying "let me try one more thing" more than twice

## Structured Handback Format

When any limit or trigger is hit, use `attempt_completion` with:

```
**Status**: 🛑 Blocked — context limit reached

**What Works**: [Bullet list of verified working functionality]

**What's Failing**: [Specific test/behavior]: [Exact error]

**Test State**: X passing / Y failing

**Files Modified**: `path/to/file.ts`: [1-line summary]

**Attempts Made**:
1. [Approach 1]: [Why it didn't work]
2. [Approach 2]: [Why it didn't work]

**Current Hypothesis**: [Best theory on root cause]

**Recommended Next Steps**:
- [Option A]: [What it would involve]
- [Option B]: [What it would involve]

**Health**: ⚠️ Degraded — [exchange limit | early stop trigger hit]
```

## What Code Mode Does NOT Do

- Complex debugging with unclear root cause after 2-3 attempts → hand back to Debug
- Design flaws → hand back to Architect
- Confusion is a signal—do not push through it
