# Delegation Rules

## Subtask Message Template
Every subtask MUST use this format:

```
**Goal**: [One sentence — what this subtask must accomplish]

**Files**: [Explicit paths — e.g., src/auth/login.ts, src/auth/login.test.ts]

**Context**: [2-3 bullets max — only decisions affecting THIS subtask]

**Success Criteria**: [Specific, testable conditions for completion]

**Budget**: Complete within ~20 exchanges. Report degradation if hit.

**Handback**: When complete, use `attempt_completion` with:
- **Done**: [One sentence summary]
- **Files**: [List of files read/modified]
- **Health**: ✅ Clean | ⚠️ Degraded — [reason if applicable]
- **Next**: [Suggested next step for Orchestrator]
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

## Final Step: Spec/Code Synchronization & Commit
Before completing ANY task, verify spec/code alignment, then execute **Workflow Step 12** (see `01-workflow.md`).

### 1. Spec Review
Does the specification/design documentation need updates based on:
- Features implemented differently than originally designed
- Requirements changed during implementation
- Human feedback that modified behavior
- Architectural decisions that deviated from spec

### 2. Code Alignment
If spec needs updates, verify code alignment:
- Does implementation match the updated spec
- Are tests consistent with actual behavior
- Is there technical debt or cleanup needed

### 3. Commit & Push (Workflow Step 12)
🛑 **MANDATORY**: Execute git commit and push per Workflow Step 12:
- `git add -A` → `git commit` (conventional format) → `git push`
- **Do NOT use `attempt_completion` until changes are committed and pushed**
- Include commit hash in handback message

### Action Required
- If spec is outdated → Delegate update to Architect mode first
- If code needs cleanup → Delegate to Code mode first
- After all sync complete → Execute commit/push (Step 12)

**Exception**: If explicitly instructed not to commit/push, note this in handback with reason
