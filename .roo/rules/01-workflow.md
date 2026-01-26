# Workflow Rules

## For Non-Trivial Tasks

Use Orchestrator mode. **Orchestrator's role is orchestration only** — it delegates all file operations to specialized modes (Architect, Code, Ask, Debug). Orchestrator never directly modifies files.

### TDD Workflow Steps

0. **SESSION INIT** via Code: Update `.docs/current-task.md` at task start
   - Replace "Current Focus" with: goal, scope, files, approach, constraints
   - Provide enough context for a fresh session to continue

1. **EXPLORE** via Architect: Read files, understand context

2. **PLAN** via Architect: Propose approach in markdown
   - Apply file hygiene rules (see below)

3. **DESIGN TESTS** via Architect: Propose test cases
   - Output UNABRIDGED complete list with justifications
   - See rules-architect/03-test-design.md for format
   - 🛑 STOP and wait for explicit human approval before proceeding

4. **WRITE TESTS** via Code: Implement approved test designs as failing tests
   - Implement ONLY the approved tests—no scope changes without re-approval

5. **VERIFY FAIL** via Code: Run tests, confirm they fail
   - If tests unexpectedly pass → escalate to Debug (10-exchange budget)

6. **IMPLEMENT** via Code: Write code to make tests pass
   - **Quality Gate:** Run `npm run lint` and `npm run type-check`
   - If gates fail → attempt fix; if stuck after 2 attempts → escalate to Debug

7. **VERIFY** via Code: Visual verification + review trigger
   - **Visual** (when changes affect components/CSS): Launch browser, verify visual correctness, screenshot issues
   - **Review trigger**: Proceed to Ask mode for code review

8. **REVIEW** via Ask: Critique implementation (read-only)
   - Categorize: 🔴 CRITICAL | 🟡 IMPORTANT | 🟢 MINOR
   - ALL issues are mandatory to address
   - If 🔴 found → proceed to FIX, then re-review (max 2 cycles)

9. **FIX** via Code: Address ALL review issues
   - Provide checklist: "✅ Addressed: [list each issue fixed]"
   - After 2 review cycles without 🔴 resolution → escalate to human

10. **VERIFY PASS** via Code: Run tests, confirm they pass
    - If regression detected → escalate to Debug (10-exchange budget)

11. **SYNC DOCS** via Code: Verify and update documentation
    - Compare implementation against `.docs/spec.md`
    - Update spec if behavior changed during development
    - Move "Current Focus" to "Recent Completions" in `current-task.md`
    - Keep `current-task.md` under 500 tokens (prune oldest completions if needed)

12. **COMMIT & PUSH** via Code: Git operations
    - `git add -A && echo "DONE"`
    - `git commit -m "type(scope): description" && echo "DONE"`
    - `git push && echo "DONE"`
    - 🛑 Do NOT use `attempt_completion` until pushed
    - Include commit hash in completion message

**Todo list format**: `[ ]` pending, `[-]` in progress, `[x]` done — NO dashes, NO nesting.

## For Simple Fixes

Typos, obvious bugs, small tweaks — proceed directly in Code mode.

## Debug Escalation Protocol

Debug mode is an expensive specialist—use only when Code is stuck.

**Route to Debug when:**

- Tests fail after 2+ Code implementation attempts
- Root cause of failure is unclear
- Regression in unrelated tests
- Visual behavior doesn't match expectations
- Tests pass unexpectedly (step 5)

**Debug has 10-exchange hard limit.** If unresolved:

- Handback with findings, hypothesis, ruled-out causes
- Route to Architect (design issue) or human (needs direction)

**Do NOT route to Debug for:**

- Missing requirements (route to human)
- Architecture decisions (route to Architect)
- Simple typos/obvious bugs (Code handles directly)

## Workflow Adaptation

### Full TDD (Steps 0-12)

Use for: new features, behavior-changing fixes, unfamiliar code areas.

### Refactoring Adaptation

For pure refactoring (behavior unchanged):

- **Step 3-ALT** via Code: Verify existing tests cover refactored code
- If coverage sufficient → skip to Step 6; else return to Step 3

### Non-Negotiable in ALL Workflows

- Step 10 (VERIFY PASS): All tests must pass
- Steps 11-12 (SYNC DOCS → COMMIT): Always execute

### Architect Mode Handback

Architect MUST return to Orchestrator via `attempt_completion`:

- Step 1: Context summary
- Step 2: Design document
- Step 3: Test specifications

Architect NEVER spawns Code subtasks or implements code.

## File Hygiene Rules

**Before implementation:**

- If >5 files affected → confirm decomposition with human

**During implementation:**

- If file exceeds 300 lines → flag for extraction

**New features:**

- Default to new files when feature is logically independent

## Code Mode Exchange Limits

- **15 exchanges**: Self-assessment checkpoint
- **20 exchanges**: Soft limit—must hand back unless completion imminent
- **25 exchanges**: Hard limit—mandatory handback

When Code hands back ⚠️ Degraded → Orchestrator asks human for direction.

## Clean Slate Triggers

Start a NEW task when:

- Distinct task is complete
- AI contradicts earlier analysis or invents non-existent APIs
- Responses become vague or generic
- Same rejected solution suggested again

Do NOT try to "fix" a degraded conversation—start fresh with summary.

## Session Continuity

At task start: Code checks `current-task.md` for prior context.
At task end: Code updates `current-task.md` with completions.

Keep entries brief—breadcrumb trail, not documentation.
