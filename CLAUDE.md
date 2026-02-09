# Auto-Battler Project Configuration

<!-- TOKEN BUDGET: Keep under 800 tokens. Loads on EVERY prompt. -->

## Project Overview

A turn-based auto-battler game built with React and TypeScript. Features AI-controlled characters with configurable behavior rules, visual battle simulation, and comprehensive rule evaluation transparency.

**Version:** 0.21.2 (follows SemVer: MAJOR.MINOR.PATCH)

## Tech Stack

- Language: TypeScript 5.9
- Runtime: Node.js (latest LTS)
- Framework: React 19.2 with Vite 7.3
- State Management: Zustand 4.5 with Immer
- Testing: Vitest 4.0 with Testing Library
- Linting: ESLint 9.39 with TypeScript ESLint
- Formatting: Prettier 3.8

## Key Commands

```bash
npm run build         # TypeScript compile + Vite build
npm run test          # Run all tests with Vitest
npm run test:watch    # TDD mode
npm run lint          # Run ESLint with auto-fix
npm run type-check    # TypeScript type checking
npm run format        # Format with Prettier
npm run security:check # Security scan (audit + lint with security rules)
```

## Documentation Structure

This project maintains documentation in `.docs/`:

- **spec.md**: Requirements and acceptance criteria
- **architecture.md**: System design and key decisions
- **patterns/index.md**: LLM-optimized index of patterns (details in `patterns/*.md`)
- **decisions/index.md**: LLM-optimized index of ADRs (details in `decisions/*.md`)
- **investigations/index.md**: LLM-optimized index of debugging sessions (details in `investigations/*.md`)
- **lessons-learned/index.md**: LLM-optimized index of lessons (details in `lessons-learned/*.md`)
- **current-task.md**: Project status (shared by both Roo and Claude Code workflows)

**Index files are lightweight pointers. Read specific detail files (e.g., `patterns/collapsible-section.md`) when needed.**

**Agents MUST read relevant `.docs/` files before making changes.**

### `.docs/current-task.md` Format

Both Roo and Claude Code workflows use this file:

- **Current Focus**: Active task description, workflow identifier, start timestamp
- **Recent Completions**: Last 3-5 completed tasks with outcomes
- **Next Steps**: Planned improvements

No mid-task switching between workflows.

## Versioning

Project follows Semantic Versioning (SemVer):

- **MAJOR**: Breaking changes to game mechanics or API
- **MINOR**: New features (new character types, rule systems)
- **PATCH**: Bug fixes, performance improvements, documentation

Update `package.json` version when merging changes. Use conventional commits.

## Critical Constraints

- NEVER hardcode secrets, API keys, or credentials
- All new code requires tests (TDD workflow)
- Max 400 lines per file—flag for extraction if exceeded
- Verify packages exist before importing
- Follow patterns established in `.docs/patterns/index.md`
- Maintain TypeScript strict mode compliance
- Follow accessibility guidelines (shape redundancy, contrast ratios)
- Prefer Claude CLI tools (Read, Write, Edit, Grep, Glob) over bash equivalents where appropriate

## TDD Workflow

Non-trivial tasks use `/tdd [task description]`:

1. Architect reads `.docs/` and explores codebase
2. Architect creates plan referencing spec and patterns
3. Architect designs tests with justifications
4. Coder implements tests (red)
5. Coder implements code (green)
6. Reviewer validates against spec and patterns
7. Coder commits with conventional commit

## Session Start

Read `.deps-check-timestamp` (repo root, ISO 8601 UTC date). Calculate days since that date. If >14 days or file missing, print:

> **Dependency check overdue** ({N} days since last check). Run `/project:deps-check` to update.

Then continue normal session setup.

## Session State

- **Long-term project status**: `.docs/current-task.md` (shared with Roo workflow)
- **Workflow-specific ephemeral state**: `.tdd/session.md` (deleted after commit)
- **Project knowledge**: `.docs/` (version controlled)

Read `.docs/current-task.md` and `.tdd/session.md` at workflow start for continuity.

## Compaction Rules

When compacting (auto or manual), ALWAYS preserve:

- Current TDD phase from `.tdd/session.md`
- Full list of modified files
- All human approval decisions
- Test commands (`npm run test`, etc.)
- Review cycle count and any review findings
- Unresolved blockers

## Project-Specific Patterns

- Components use CSS modules (`.module.css`)
- State management via Zustand stores in `src/stores/`
- Game logic in `src/game-logic/`
- Tests co-located with components (`*.test.tsx`)
- Use Testing Library best practices (user-centric queries)
- Husky pre-commit hooks enforce lint-staged checks
