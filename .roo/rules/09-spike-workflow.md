# Spike Workflow

## Purpose

Spikes are time-boxed exploration to answer specific technical questions through throwaway code.

**Core principle:** Spike code is disposable. Output is knowledge, not implementation.

## When Human Says "Spike"

Follow this protocol:

### 1. Declare (in `.docs/current-task.md`)

```markdown
## Spike: [name]

**Question:** [What uncertainty does this resolve?]
**Timebox:** [1-4h, default 2h]
```

### 2. Branch

```bash
git checkout -b spike/[kebab-case-name]
```

### 3. Vibe Code

Rules change completely:

- ✅ AI vibe coding (accept-all mode)
- ✅ No tests required
- ✅ Quick and dirty is correct
- ✅ Hardcoded values, duplication fine

Focus on answering the question.

### 3a. Human Verification Protocol (for multi-option spikes)

When exploring multiple approaches:

1. **After each option**: Use `ask_followup_question` to show the result and ask human to verify
   - Include screenshot or description of visual result
   - Note any issues or trade-offs observed
2. **After all options explored**: Present comparison and ask human to select preferred approach
   - List all approaches tried with pros/cons
   - Recommend best option with rationale
   - Wait for human selection before proceeding

### 4. Capture (3-5 bullets in `.docs/current-task.md`)

```markdown
## Spike Learnings

- [Key insight]
- [What worked/didn't]
- [Recommended approach]
```

### 5. Hard Reset (ALWAYS)

```bash
git checkout main
git branch -D spike/[name]
```

No exceptions. Do not merge spike code.

### 6. Transition Gate

**"Can I write a failing test for this?"**

- Yes → Proceed to 12-step TDD workflow
- No → Suggest narrower spike

## Integration with TDD Workflow

Spikes are Phase 0 (before 12-step workflow):

```
Phase 0: SPIKE (when human says "spike")
  ↓
Step 1: EXPLORE via Architect (check current-task.md for learnings)
  ↓
... (rest unchanged)
```

## Git Conventions

- `spike/*` — Temporary (always deleted)
- `feat/*` — Permanent (TDD commits)
- `fix/*` — Permanent (TDD commits)

## Anti-Patterns

❌ Keeping spike code (defeats purpose)
❌ Indefinite exploration (respect timebox)
❌ Skipping transition gate
❌ Over-documenting (breadcrumbs, not docs)
