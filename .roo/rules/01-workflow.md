# Workflow Rules

## For Non-Trivial Tasks

Use Orchestrator mode. It will:

0. **HEALTH CHECK**: Verify `.docs/current-task.md` is under 500 tokens
   - Run: `wc -w .docs/current-task.md` (multiply by 1.3 for token estimate)
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
   - If tests pass when they should fail → **5a. INVESTIGATE via Debug**: Determine if test is wrong or code already implements behavior (10 exchange budget)

6. **IMPLEMENT** via Code: Write code to make tests pass

6a. **INVESTIGATE** via Debug: If tests still fail after 2 Code mode attempts - Root cause analysis (15-20 exchange budget) - Handback to Code mode with findings OR escalate to Architect if design flaw detected

7. **REVIEW** via Ask: Critique implementation (read-only — no edits)
   - Categorize issues: 🔴 CRITICAL (security, data integrity, major bugs), 🟡 IMPORTANT (performance, maintainability, edge cases), 🟢 MINOR (style, naming, documentation)
   - **ALL issues are mandatory** — every 🔴, 🟡, and 🟢 must be addressed
   - If 🔴 CRITICAL issues found → proceed to step 8, then return to step 7 (max 2 cycles)
   - If only 🟡/🟢 issues found → proceed to step 8, then skip to step 9 (Code self-verifies)
   - If no issues → skip to step 9

8. **FIX** via Code: Address ALL issues found in review
   - **Mandatory implementation**: Fix every 🔴, 🟡, and 🟢 issue — none are optional
   - Provide checklist confirmation: "✅ Addressed: [list each issue fixed]"
   - After fixing 🔴 CRITICAL: re-review (step 7) scoped to fixed code only
   - After fixing only 🟡/🟢: self-verify all items addressed, then proceed to step 9
   - After 2 review cycles without 🔴 resolution: escalate to human

9. **VERIFY PASS**: Run tests, confirm they pass
   - If unrelated tests fail (regression) → **9a. REGRESSION DEBUG via Debug**: Systematic analysis (15 exchange budget)

10. **COMMIT**: Git commit operations while files are fresh in context
    - Stage all changes: `git add -A && echo "DONE"`
    - Commit with conventional format: `git commit -m "type(scope): description" && echo "DONE"`
      - Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
      - Example: `git commit -m "feat(combat): add dodge mechanics" && echo "DONE"`
    - **Husky + lint-staged**: Pre-commit hook automatically runs ESLint + Prettier on staged files
    - **Note**: The `&& echo "DONE"` suffix ensures terminal completion detection in VS Code

11. **PUSH**: Push to remote: `git push && echo "DONE"`
    - Verify push succeeded (no conflicts or errors)
    - 🛑 **Do NOT use `attempt_completion` until changes are committed and pushed**
    - Include commit hash in completion message

12. **FINALIZE**: Update `.docs/current-task.md`
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

## Code Mode Exchange Limits

Code mode enforces context health via hard limits:

- **15 exchanges**: Self-assessment checkpoint
- **20 exchanges**: Soft limit — must hand back unless completion imminent
- **25 exchanges**: Hard limit — mandatory handback, no exceptions

See `.roo/rules-code/03-context-health.md` for full protocol.

When Code hands back with ⚠️ Degraded:
→ Orchestrator asks human for direction via `ask_followup_question`
→ Human decides: fresh task, Architect review, guidance, or defer

## Debug Escalation Protocol

Route to Debug mode (instead of immediate human escalation) when:

- Tests fail after 2+ Code mode implementation attempts
- Root cause of failure is unclear
- Regression detected in unrelated tests
- Visual/UI behavior doesn't match expectations

Debug mode has 20-exchange hard limit. If Debug cannot resolve:

- Handback with findings, hypothesis, and ruled-out causes
- Orchestrator routes to Architect (if design issue) or human (if needs direction)

**Do NOT route to Debug for:**

- Missing requirements (route to human)
- Architecture decisions (route to Architect)
- Simple typos/obvious bugs (Code handles directly)

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
