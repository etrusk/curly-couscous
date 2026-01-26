# Auto-Battler Project Configuration

<!-- TOKEN BUDGET: Keep under 800 tokens. Loads on EVERY prompt. -->

## Project Overview

A turn-based auto-battler game built with React and TypeScript. Features AI-controlled characters with configurable behavior rules, visual battle simulation, and comprehensive rule evaluation transparency.

## Tech Stack

- Language: TypeScript 5.3
- Runtime: Node.js (latest LTS)
- Framework: React 18.2 with Vite 7.3
- State Management: Zustand 4.4 with Immer
- Testing: Vitest 4.0 with Testing Library
- Linting: ESLint 9.39 with TypeScript ESLint
- Formatting: Prettier 3.1

## Key Commands

```bash
npm run build         # TypeScript compile + Vite build
npm run test          # Run all tests with Vitest
npm run test:watch    # TDD mode
npm run lint          # Run ESLint with auto-fix
npm run type-check    # TypeScript type checking
npm run format        # Format with Prettier
```

## Documentation Structure

This project maintains documentation in `.docs/`:

- **spec.md**: Requirements and acceptance criteria
- **architecture.md**: System design and key decisions
- **patterns/index.md**: Implementation patterns and conventions
- **decisions/index.md**: Architectural Decision Records (ADRs)
- **current-task.md**: Current focus and recent completions (breadcrumb trail)

**Agents MUST read relevant `.docs/` files before making changes.**

## Critical Constraints

- NEVER hardcode secrets, API keys, or credentials
- All new code requires tests (TDD workflow)
- Max 400 lines per file—flag for extraction if exceeded
- Verify packages exist before importing
- Follow patterns established in `.docs/patterns/index.md`
- Maintain TypeScript strict mode compliance
- Follow accessibility guidelines (shape redundancy, contrast ratios)

## TDD Workflow

Non-trivial tasks use `/tdd [task description]`:

1. Architect reads `.docs/` and explores codebase
2. Architect creates plan referencing spec and patterns
3. Architect designs tests with justifications
4. Coder implements tests (red)
5. Coder implements code (green)
6. Reviewer validates against spec and patterns
7. Coder commits with conventional commit

## Session State

- Workflow state: `.tdd/session.md`
- Project knowledge: `.docs/`

Read `.tdd/session.md` at workflow start for continuity.

## Project-Specific Patterns

- Components use CSS modules (`.module.css`)
- State management via Zustand stores in `src/stores/`
- Game logic in `src/game-logic/`
- Tests co-located with components (`*.test.tsx`)
- Use Testing Library best practices (user-centric queries)
- Husky pre-commit hooks enforce lint-staged checks
