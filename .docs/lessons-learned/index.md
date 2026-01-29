---
lessons:
  - id: "001"
    title: "Scope behavioral specs by mode/context"
    date: "2026-01-29"
    category: "specification"
    summary: "Specs should explicitly state scope of behavioral rules to prevent confusion when subsystems are replaced"
    file: "lesson-001-scope-behavioral-specs.md"

  - id: "002"
    title: "Exclude target from obstacles in pathfinding"
    date: "2026-01-29"
    category: "implementation"
    summary: "Both pathfinding entity and its target should be excluded from obstacle sets in combat pathfinding"
    file: "lesson-002-exclude-target-from-obstacles.md"

  - id: "003"
    title: "Verify CSS variable semantics across all theme modes"
    date: "2026-01-29"
    category: "ui-styling"
    summary: "CSS variable names can be misleading; always verify actual values across all theme modes before use"
    file: "lesson-003-verify-css-variables-across-themes.md"
---

# Lessons Learned Index

This directory captures important lessons from implementation work to prevent repeated mistakes and inform future decisions.

## Quick Reference

**By Category:**

- **Specification:** 001
- **Implementation:** 002
- **UI/Styling:** 003

## Usage

Agents should:

1. Read this index to find relevant lessons by category or keyword
2. Read specific lesson files only when applicable to current task
3. Append new lessons by creating `lesson-NNN-[slug].md` and updating this index

## Adding New Lessons

When documenting a new lesson:

1. Create new file: `.docs/lessons-learned/lesson-NNN-[descriptive-slug].md`
2. Use next sequential ID (current: 004)
3. Include: Date, Context, Lesson, Impact sections
4. Update YAML frontmatter in this index
5. Choose appropriate category: specification, implementation, ui-styling, testing, architecture, performance, security

Keep lessons focused and actionable.
