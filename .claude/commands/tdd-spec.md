---
name: tdd-spec
description: Clarify requirements and produce a spec for /tdd. Run before /tdd for non-trivial tasks.
---

# TDD Spec — Requirement Clarification

Structured conversation to agree on scope before implementation. Output: `.tdd/spec.md` consumed by `/tdd`.

**Budget**: Maximum 8 exchanges. If requirements still unclear, document unknowns as assumptions and finalize.

---

## Process

### 1. State Understanding

Read `.docs/spec.md` and `.docs/architecture.md` for project context.

Present your understanding of the request:

- **Goal**: What needs to be done (1-2 sentences)
- **Scope**: Where changes will occur (files, modules, layers)
- **Complexity**: Simple fix / feature / architectural change
- **Dependencies**: What this touches or depends on

### 2. Identify Gaps

List specific unknowns. Ask questions ONE batch at a time — group related questions, don't drip-feed.

Focus on:

- Missing acceptance criteria (what does "done" look like?)
- Unclear boundaries (what's explicitly out of scope?)
- Edge cases not addressed
- Constraints the human hasn't stated (performance, compatibility, existing patterns)

If the request is already clear and detailed, say so and skip to step 4.

### 3. Explore Approaches (if multiple valid options exist)

Present 2-3 approaches with concrete trade-offs:

```
Option A: [name]
  → Pros: [specific benefits]
  → Cons: [specific costs]
  → Fits if: [when to choose this]

Option B: [name]
  → Pros: [specific benefits]
  → Cons: [specific costs]
  → Fits if: [when to choose this]
```

Make a recommendation. State why.

Skip this step if there's one obvious approach.

### 4. Confirm and Write Spec

After agreement, create `.tdd/spec.md`:

```markdown
# TDD Spec: [Task Title]

Created: [date]

## Goal

[2-4 sentences: what, why, where]

## Acceptance Criteria

- [ ] [Criterion 1 — specific and testable]
- [ ] [Criterion 2 — specific and testable]
- [ ] [Criterion 3 — specific and testable]

## Approach

[1-3 sentences: chosen approach and key decisions]

## Scope Boundaries

- In scope: [what will be changed]
- Out of scope: [what will NOT be changed]

## Assumptions

- [Any unresolved unknowns documented as working assumptions]

## Constraints

- [Technical constraints, pattern requirements, performance targets]
```

### 5. Handoff

Print:

```
✓ Spec written to .tdd/spec.md
  → [task title]
  → [N] acceptance criteria
  → Approach: [1-liner]

Ready for: /tdd [task description]
```

---

## Rules

- Do NOT write code, create tests, or modify source files
- Do NOT spawn subagents
- Do NOT create session.md — that's /tdd's job
- If `.tdd/spec.md` already exists, show it and ask: update or start fresh?
- Acceptance criteria must be specific enough to write a failing test from
- If human provides a fully detailed spec with clear criteria, write the file and skip Q&A
- These acceptance criteria override `.docs/spec.md` if they conflict — document the conflict in Assumptions
