# Workflow Rules

## For Non-Trivial Tasks

Use Orchestrator mode. **Orchestrator's role is orchestration only** — it delegates all file operations (reading, writing, editing) to specialized modes (Architect, Code, Ask, Debug). Orchestrator never directly modifies files.

It will:

0. **SESSION INIT** via Code: Update `.docs/current-task.md` at task start
   - Delegate to Code mode to replace "Current Focus" section with detailed task description
   - Include: Goal, scope, files involved, approach, constraints
   - Provide enough context for a fresh session to understand the task completely

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
   - **Quality Gate:** Run `npm run type-check` to ensure tests compile

5. **VERIFY FAIL** via Code: Run tests, confirm they fail (proves tests are valid)
   - If tests pass when they should fail → **5a. INVESTIGATE via Debug**: Determine if test is wrong or code already implements behavior (10-exchange budget)

6. **IMPLEMENT** via Code: Write code to make tests pass
   - **Quality Gate:** After implementation, run:
     - `npm run lint` — catch style and potential bugs
     - `npm run type-check` — verify type safety
   - If quality gates fail → fix immediately, do not proceed to Step 7 (REVIEW)

6a. **INVESTIGATE** via Debug: If tests still fail after 2 Code mode attempts - Root cause analysis (10-exchange budget) - Handback to Code mode with findings OR escalate to Architect if design flaw detected

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

9. **VERIFY PASS** via Code: Run tests, confirm they pass
   - If unrelated tests fail (regression) → **9a. REGRESSION DEBUG via Debug**: Systematic analysis (10-exchange budget)

10. **SYNC DOCS** via Code: Verify and update documentation before commit
    - **MANDATORY Spec Verification** (execute every time):
      1. Delegate to Code: Read `.docs/current-task.md` "Current Focus" section for task context
      2. Delegate to Code: Compare implemented behavior against `.docs/spec.md`
      3. Orchestrator checks if ANY of these occurred:
         - Human feedback changed requirements or behavior
         - Implementation revealed spec incompleteness (missing edge cases, unclear rules)
         - Behavioral details were clarified/added during development
         - Game mechanics were refined based on testing
         - Features implemented differently than originally designed
         - Architectural decisions deviated from documented spec
      4. **If YES to any** → Delegate updates to Code mode:
         - `.docs/spec.md` — behavioral changes, clarifications, new rules
         - `.docs/architecture.md` — design deviations
         - `.docs/patterns/` or `.docs/decisions/` — new patterns/decisions
         - Orchestrator escalates to Architect if changes are substantial
      5. **If NO** → Orchestrator confirms in Code handback: "Verified spec.md alignment—no updates needed"
    - **Session state** (`.docs/current-task.md`):
      - Delegate to Code mode to move "Current Focus" entry to "Recent Completions" with completion note
      - Keep completion entries concise but informative (what was done + outcome)
      - **Token budget check**: Orchestrator verifies file remains under 500 tokens after update
        - Delegate to Code: `wc -w .docs/current-task.md` (multiply by 1.3 for token estimate)
        - ✅ Under 500 → proceed to commit
        - ⚠️ 500-650 → Code prunes oldest "Recent Completions" items, then adds new
        - 🛑 Over 650 → Code prunes aggressively before commit
      - If update would exceed: Code prunes oldest items first, then adds new

11. **COMMIT** via Code: Git commit operations while files are fresh in context
    - **MANDATORY**: `.docs/current-task.md` must be included in every commit
    - Delegate staging: `git add -A && echo "DONE"`
    - Delegate commit: `git commit -m "type(scope): description" && echo "DONE"`
      - Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
      - Example: `git commit -m "feat(combat): add dodge mechanics" && echo "DONE"`
    - **Husky + lint-staged**: Pre-commit hook automatically runs ESLint + Prettier on staged files
    - **Note**: The `&& echo "DONE"` suffix ensures terminal completion detection in VS Code

12. **PUSH** via Code: Push to remote
    - Delegate: `git push && echo "DONE"`
    - Verify push succeeded (no conflicts or errors)
    - 🛑 **Do NOT use `attempt_completion` until changes are committed and pushed**
    - Include commit hash in completion message

**Todo list format**: `[ ]` pending, `[-]` in progress, `[x]` done — NO leading dashes, NO nesting, one item per line.

## For Simple Fixes

Typos, obvious bugs, small tweaks — proceed directly in Code mode.

## Workflow Adaptation

Orchestrator may adapt the 12-step workflow based on task context:

### When to Use Full 12-Step TDD Workflow

**Use Steps 0-12 verbatim for:**

- New features (new behavior, new APIs, new components)
- Bug fixes that change behavior
- Any change where correctness is uncertain
- Unfamiliar code areas where tests provide safety

### When to Adapt for Refactoring

**For pure refactoring (behavior unchanged, structure improved):**

Orchestrator may compress Steps 3-5 (DESIGN TESTS → WRITE TESTS → VERIFY FAIL) into:

- **Step 3-ALT** via Code: Verify existing tests cover refactored code
- Orchestrator proceeds to Step 6 (IMPLEMENT via Code) if coverage is sufficient
- If coverage gaps exist, Orchestrator returns to Step 3 (DESIGN TESTS) for missing cases

**Refactoring examples:**

- File decomposition (splitting large files)
- Extract helper functions
- Rename for clarity
- Reorganize module structure

**Non-negotiable in ALL workflows:**

- Step 9 (VERIFY PASS): All tests must pass before commit
- Steps 10-12 (SYNC DOCS → COMMIT → PUSH): Always execute

### Architect Mode Handback (MANDATORY)

**Architect mode MUST ALWAYS return to Orchestrator via `attempt_completion`.**

Architect mode handback deliverables:

- Step 1 (EXPLORE): Context summary in markdown
- Step 2 (PLAN): Design document in markdown
- Step 3 (DESIGN TESTS): Test specifications in markdown

**Architect NEVER:**

- Spawns Code subtasks directly
- Creates/modifies `.ts`, `.tsx`, `.js`, `.jsx` files
- Implements code from designs

**Orchestrator responsibility:**

- Review Architect's design deliverable
- Request human approval if needed (especially Step 3 test designs)
- Delegate implementation to Code mode (Steps 4-6)

**Rationale**: Architect designs must pass through Orchestrator approval gate. Direct Architect→Code delegation bypasses this control point and loses design context.

## Recognition

"Non-trivial" = new features, refactoring, multi-file changes, unfamiliar code areas.

## File Hygiene Rules

### Before Implementation

If planned changes touch more than 5 files:
→ Orchestrator pauses and confirms with human: "This task touches [N] files. Should I decompose into smaller subtasks?"

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

Debug mode is an expensive senior‑dev resource—use only when Code is stuck.

Route to Debug mode (instead of immediate human escalation) when:

- Tests fail after 2+ Code mode implementation attempts
- Root cause of failure is unclear
- Regression detected in unrelated tests
- Visual/UI behavior doesn't match expectations

Debug mode has 10-exchange hard limit. If Debug cannot resolve:

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

At task start: Orchestrator delegates to Code to check `current-task.md` for context from prior sessions.
At task end: Orchestrator delegates to Code to update `current-task.md` with completions and next steps.

Keep entries brief — this is a breadcrumb trail, not documentation.
