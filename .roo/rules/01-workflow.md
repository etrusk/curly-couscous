# Workflow Rules

## For Non-Trivial Tasks
Use Orchestrator mode. It will:

0. **HEALTH CHECK**: Verify `.roo/status.md` is under 500 tokens
   - Run: `wc -w .roo/status.md` (multiply by 1.3 for token estimate)
   - ✅ Under 500 → proceed to step 1
   - ⚠️ 500-650 → warn user, recommend pruning, may proceed if user confirms
   - 🛑 Over 650 → STOP. Output pruning guidance. Do not proceed until fixed.

1. **EXPLORE** via Architect: Read files, understand context

2. **PLAN** via Architect: Propose approach in markdown
   - Apply file hygiene rules (see below)

3. **DESIGN TESTS** via Architect: Propose test cases for the planned behavior
   - Output complete list of tests with justifications
   - See rules-architect/03-test-design.md for format

4. **APPROVE TESTS**: Present test design to human for approval
   - 🛑 STOP and wait for explicit human approval before proceeding
   - Human may approve, reject, or request modifications
   - If modifications requested → return to step 3
   - Only proceed to step 5 after explicit approval

5. **WRITE TESTS** via Code: Implement approved test designs as failing tests
   - Code mode implements ONLY the approved tests
   - Do not add, remove, or modify test scope without re-approval

6. **VERIFY FAIL**: Run tests, confirm they fail (proves tests are valid)

7. **IMPLEMENT** via Code: Write code to make tests pass

8. **REVIEW** via Ask: Critique implementation (read-only — no edits)
   - If 🔴 CRITICAL issues → proceed to step 9, then return to step 8 (max 2 cycles)
   - If only 🟡/🟢 issues → proceed to step 9, then skip to step 10
   - If no issues → skip to step 10

9. **FIX** via Code: Address issues found in review
   - After fixing 🔴 CRITICAL: re-review (step 8) scoped to fixed code only
   - After 2 review cycles without resolution: escalate to human

10. **VERIFY PASS**: Run tests, confirm they pass

11. **MANUAL TEST**: Output verification checklist, wait for human confirmation

12. **FINALIZE**: Update `.roo/status.md`
    - Verify file remains under 500 tokens after update
    - If update would exceed: prune old items first, then add new

## For Simple Fixes
Typos, obvious bugs, small tweaks — proceed directly in Code mode.

## Recognition
"Non-trivial" = new features, refactoring, multi-file changes, unfamiliar code areas.

## File Hygiene Rules

### Before Implementation
If planned changes touch more than 5 files:
→ Pause and confirm: "This task touches [N] files. Should I decompose into smaller subtasks?"

### During Implementation
If adding code to a file that exceeds 300 lines:
→ Flag: "This file is [N] lines. Consider extracting [component] to a new file."
→ Proceed only if user confirms or provides alternative

### New Features
Default to new files over extending existing ones when:
- The feature is logically independent
- The existing file already has a single clear responsibility
- Adding would require imports unrelated to existing functionality

## When to Start Fresh (Clean Slate Triggers)
Start a NEW Orchestrator task when:
- Switching to an unrelated area of the codebase
- A distinct feature or task is complete
- AI repeats previously rejected solutions
- AI contradicts its earlier analysis
- Responses become vague or generic instead of project-specific
- AI invents APIs, methods, or packages that don't exist

Do NOT try to "fix" a degraded conversation — start fresh with a summary of what was learned.

## Session Continuity
At task start: Check `.roo/status.md` for context from prior sessions.
At task end: Update `.roo/status.md` with completions and next steps.

Keep entries brief — this is a breadcrumb trail, not documentation.
