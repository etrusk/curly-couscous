# Workflow Rules

## For Non-Trivial Tasks
Use Orchestrator mode. It will:

0. **HEALTH CHECK**: Verify `current-task.md` is under 500 tokens
   - Run: `wc -w current-task.md` (multiply by 1.3 for token estimate)
   - ✅ Under 500 → proceed to step 1
   - ⚠️ 500-650 → warn user, recommend pruning, may proceed if user confirms
   - 🛑 Over 650 → STOP. Output pruning guidance. Do not proceed until fixed.

1. **EXPLORE** via Architect: Read files, understand context

2. **PLAN** via Architect: Propose approach in markdown
   - Apply file hygiene rules (see below)

3. **DESIGN TESTS** via Architect: Propose test cases for the planned behavior
   - Output UNABRIDGED complete list of tests with justifications (no summaries or ellipses)
   - See rules-architect/03-test-design.md for format
   - Architect uses `ask_followup_question` to present tests and request approval
   - 🛑 STOP and wait for explicit human approval before signaling completion
   - Human may approve, reject, or request modifications
   - If modifications requested → revise and re-request approval
   - Architect signals completion only after approval received

4. **WRITE TESTS** via Code: Implement approved test designs as failing tests
   - Code mode implements ONLY the approved tests
   - Do not add, remove, or modify test scope without re-approval

5. **VERIFY FAIL**: Run tests, confirm they fail (proves tests are valid)

6. **IMPLEMENT** via Code: Write code to make tests pass

7. **REVIEW** via Ask: Critique implementation (read-only — no edits)
   - If 🔴 CRITICAL issues → proceed to step 8, then return to step 7 (max 2 cycles)
   - If only 🟡/🟢 issues → proceed to step 8, then skip to step 9
   - If no issues → skip to step 9

8. **FIX** via Code: Address issues found in review
   - After fixing 🔴 CRITICAL: re-review (step 7) scoped to fixed code only
   - After 2 review cycles without resolution: escalate to human

9. **VERIFY PASS**: Run tests, confirm they pass

10. **MANUAL TEST**: Output verification checklist, wait for human confirmation

11. **FINALIZE**: Update `current-task.md`
   - Verify file remains under 500 tokens after update
   - If update would exceed: prune old items first, then add new

12. **COMMIT & PUSH**: Git operations are MANDATORY before completion
    - Stage all changes: `git add -A && echo "DONE"`
    - Commit with conventional format: `git commit -m "type(scope): description" && echo "DONE"`
      - Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
      - Example: `git commit -m "feat(combat): add dodge mechanics" && echo "DONE"`
    - Push to remote: `git push && echo "DONE"`
    - Verify push succeeded (no conflicts or errors)
    - 🛑 **Do NOT use `attempt_completion` until changes are committed and pushed**
    - Include commit hash in completion message
    - **Note**: The `&& echo "DONE"` suffix ensures terminal completion detection in VS Code

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
At task start: Check `current-task.md` for context from prior sessions.
At task end: Update `current-task.md` with completions and next steps.

Keep entries brief — this is a breadcrumb trail, not documentation.
