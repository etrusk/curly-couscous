# Smoke Test Agent Instructions

## Purpose

Validate that the application loads, renders, and handles core interactions after every successful TDD implementation phase. This exists because passing unit tests, lint, and type-check does not guarantee the app loads in a browser.

## Operational Rules

These rules enforce sublinear token scaling as the check count grows. Follow them exactly.

### Rule 1: Tiered Verification

Classify every check before execution.

| Tier                       | Method                              | Screenshot   | When to use                                                                                      |
| -------------------------- | ----------------------------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| T1 — App loads             | Navigate + verify DOM exists        | 1 screenshot | Always runs first, alone. If T1 fails, skip everything else.                                     |
| T2 — Interaction contracts | JS evaluation only via test harness | Never        | Check can be expressed as a JS assertion returning structured data. Default tier for new checks. |
| T3 — Visual verification   | JS evaluation + screenshot          | Yes, capped  | Check requires visual confirmation that JS cannot verify (layout, rendering, visual state).      |

Default to T2. A check is T3 only if the verification cannot be expressed as a JS assertion. "I want to see it" is not sufficient justification for T3.

### Rule 2: Session Token Budget

Each smoke test session must not exceed 40K input tokens.

Before executing the next check, estimate whether it will push the session past 40K. If yes: end the session. Emit the results summary (Rule 5). Start a new session carrying only the summary object.

This cap is non-negotiable. It prevents the quadratic cost growth caused by compounding conversation context.

### Rule 3: Stateless Check Design

Every check must be independently executable.

Each check programmatically sets up its own preconditions, runs its assertion, and tears down. No check may depend on state produced by a prior check. Checks may execute in any order within a session.

This is what makes session partitioning (Rule 2) possible. If a check requires sequential state from a prior check, refactor it into a self-contained setup + assert + teardown sequence.

### Rule 4: Screenshot Budget

Maximum 5 screenshots per session.

- T1 gets exactly 1 screenshot (app load verification).
- Remaining 4 are reserved for T3 checks.
- If a session contains more than 4 T3 checks, split into multiple sessions.
- Never take a screenshot for a T2 check.

### Rule 5: Summary-Only Context Carry

Between sessions, carry forward only a structured results object:

```json
{
  "session": 2,
  "passed": ["01-app-load", "02-place-character"],
  "failed": [],
  "partial": [],
  "skipped": ["05-compound-trigger"],
  "remaining": ["08-attack", "09-adjacency"]
}
```

Do not carry conversation history, screenshots, JS output, or diagnostic details across sessions.

### Rule 6: Execution Order

1. T1 first, alone. If T1 fails, report failure and stop.
2. T2 checks in batches within the session token budget. JS evaluation only. No screenshots.
3. T3 checks last, respecting the screenshot budget.

Within each tier, execute checks in manifest order.

### Rule 7: Check Classification at Creation Time

When adding a new check to `.docs/smoke-tests.yaml`, assign a tier. If a check has a `verify_js` field, it is T2 unless explicitly overridden. The `tier` field is the source of truth.

### Rule 8: Adaptive Effort

| Tier | Effort | Rationale                                             |
| ---- | ------ | ----------------------------------------------------- |
| T1   | Low    | Binary pass/fail                                      |
| T2   | Low    | JS assertions return structured data                  |
| T3   | Medium | Visual verification requires interpreting screenshots |

Do not use high or max effort for smoke test checks.

### Rule 9: Failure Reporting

For each check, report exactly one line:

```
PASS: 01-app-load — Grid renders, 7 hex cells visible
FAIL: 03-move-character — Character remained at origin hex after move command
SKIP: 05-compound-trigger — Feature not implemented
```

Do not use PARTIAL. If the check expectation is wrong, report PASS with a note to update the manifest.

### Rule 10: Final Summary Format

```
═══ SMOKE TEST RESULTS ═══
Checks: [N] total ([T1: n] [T2: n] [T3: n])
Passed: [N]  Failed: [N]  Skipped: [N]
Sessions: [N] (est. ~[X]K total tokens)

Failures:
  - [id]: [one-line description]

Manifest updates needed:
  - [id]: [correction to expectation]
══════════════════════════
```
