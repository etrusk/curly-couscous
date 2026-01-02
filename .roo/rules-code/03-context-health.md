# Context Health Rules for Code Mode

## Exchange Budget (ENFORCED)
Code tasks have a **20-exchange soft limit** and **25-exchange hard limit**.

### At ~15 exchanges
Pause and self-assess:
- What's implemented and working?
- What's blocked or failing?
- Am I making measurable progress (tests passing, errors changing)?

If no measurable progress in last 5 exchanges → proceed to Early Stop.

### At 20 exchanges without completion
→ STOP. Do not attempt further fixes.
→ Proceed to **Structured Handback for Human Review** (below).

### At 25 exchanges
HARD STOP. No exceptions. Execute handback immediately.

---

## Early Stop Triggers
Stop immediately and execute handback if ANY of these occur:

- [ ] Editing the same file 3+ times without test improvement
- [ ] Suggesting an approach you already tried earlier in this session
- [ ] Referencing APIs, methods, or types that don't exist
- [ ] Unable to explain why your current fix should work
- [ ] Test failures that don't match your mental model
- [ ] Saying "let me try one more thing" more than twice
- [ ] Error messages are surprising or nonsensical given your changes

These indicate context degradation. A fresh start with your summary beats continued thrashing.

---

## Structured Handback for Human Review

When any limit or trigger is hit, use `attempt_completion` with this EXACT format:

```
**Status**: 🛑 Blocked — context limit reached

**What Works**:
- [Bullet list of implemented functionality that is verified working]

**What's Failing**:
- [Specific test/behavior]: [Exact error or symptom]

**Test State**: X passing / Y failing

**Files Modified**:
- `path/to/file.ts`: [1-line summary of changes]

**Attempts Made**:
1. [Approach 1]: [Why it didn't work]
2. [Approach 2]: [Why it didn't work]
3. [Approach 3]: [Why it didn't work]

**Current Hypothesis**:
[Your best theory on root cause, even if uncertain]

**Recommended Next Steps**:
- [Option A]: [What it would involve]
- [Option B]: [What it would involve]

**Health**: ⚠️ Degraded — [exchange limit | early stop trigger hit]
```

Do NOT:
- Continue attempting fixes after triggering handback
- Provide vague summaries ("something is wrong with X")
- Omit the attempts made section
- Skip the hypothesis

---

## What Code Mode Does NOT Do
- Code mode does not debug complex issues. If root cause is unclear after 2-3 attempts, hand back.
- Code mode does not redesign. If implementation reveals design flaws, hand back for Architect review.
- Code mode does not push through confusion. Confusion is a signal, not an obstacle to overcome.
