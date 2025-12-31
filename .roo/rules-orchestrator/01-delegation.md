# Delegation Rules

## Subtask Message Template
Every subtask MUST use this format:

```
**Goal**: [One sentence — what this subtask must accomplish]

**Files**: [Explicit paths — e.g., src/auth/login.ts, src/auth/login.test.ts]

**Context**: [2-3 bullets max — only decisions affecting THIS subtask]

**Success Criteria**: [Specific, testable conditions for completion]

**Budget**: Complete within ~20 exchanges. Report degradation if hit.
```

## DO NOT Include in Subtasks
- Conversation history or reasoning from prior subtasks
- Alternatives already rejected
- Background context the subtask doesn't need
- Speculative "might also need" files

## Context Transfer Between Subtasks
When subtask A completes and subtask B needs its output:
- Include only the **decision** and **artifact** (file path, function name)
- Do NOT include A's reasoning or rejected approaches

## Mode Selection
- **Architect**: Design decisions, tradeoff analysis, planning docs, **test design**
- **Code**: Implementation, writing tests from approved designs, fixes
- **Ask**: Review, explanation, critique (read-only)
- **Debug**: Root cause analysis, systematic troubleshooting
  - ⚠️ Debug has strict 20-exchange limit — see rules-debug

## Completion Requirements
Every `attempt_completion` MUST include:
1. What was done (one sentence)
2. Files modified (list)
3. Context health: ✅ Clean | ⚠️ Degraded — [reason]

When a subtask reports "⚠️ Degraded":
→ Do NOT extend that subtask
→ Create NEW subtask with the summary as starting context

## Final Step: Spec/Code Synchronization
Before completing ANY task, verify:

1. **Spec Review**: Does the specification/design documentation need updates based on:
   - Features implemented differently than originally designed
   - Requirements changed during implementation
   - Human feedback that modified behavior
   - Architectural decisions that deviated from spec

2. **Code Alignment**: If spec needs updates, verify code alignment:
   - Does implementation match the updated spec
   - Are tests consistent with actual behavior
   - Is there technical debt or cleanup needed
   - Should code be refactored for clarity

**Action Required**:
- If spec is outdated → Delegate update to Architect mode
- If code needs cleanup after spec sync → Delegate to Code mode
- Only mark task complete when spec and code are synchronized
