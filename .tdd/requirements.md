# TDD Spec: Add Static Analysis Toolchain (Stryker, dependency-cruiser, knip)

Created: 2026-02-16

## Goal

Add three static analysis tools to the dev toolchain — Stryker Mutator (mutation testing), dependency-cruiser (module boundary enforcement), and knip (dead code detection) — plus consolidate scattered workflow timers into a single file. These tools close the gap between high line coverage (98.8%) and actual behavioral verification, enforce the layered architecture at CI time, and catch dead exports/dependencies that ESLint's within-file rules miss.

## Acceptance Criteria

### Stryker Mutator

- [ ] `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` installed as devDependencies
- [ ] `stryker.config.json` configured to mutate full `src/` tree (excluding test files, test helpers, type-only files)
- [ ] `npm run mutate` runs `stryker run --incremental` (fast, for `/tdd` workflow use)
- [ ] `npm run mutate:full` runs `stryker run` (full cache reset, for periodic use)
- [ ] No enforced thresholds initially — reporting only (HTML + clear-text reporters)
- [ ] Stryker works with the dual Vitest project setup (unit + browser) in `vite.config.ts`
- [ ] `.stryker-tmp/` added to `.gitignore`
- [ ] `reports/` (Stryker HTML output) added to `.gitignore`
- [ ] Incremental run (`npm run mutate`) integrated into `/tdd` workflow as a post-test step

### dependency-cruiser

- [ ] `dependency-cruiser` installed as devDependency
- [ ] `.dependency-cruiser.cjs` config with these boundary rules:
  - `src/engine/**` must NOT import from `react`, `react-dom`, `zustand`, `immer`, `src/components/**`, `src/stores/**`, `src/hooks/**`, `src/styles/**`
  - `src/stores/**` must NOT import from `src/components/**`, `src/hooks/**`
  - `src/hooks/**` must NOT import from `src/components/**`
  - No circular dependencies (all of `src/`)
- [ ] `npm run validate:deps` runs dependency-cruiser on `src/`
- [ ] Wired into `lint-staged` in `package.json` (runs on every commit for staged `.ts`/`.tsx` files)

### knip

- [ ] `knip` installed as devDependency
- [ ] `knip.json` config targeting `src/` with appropriate entry points and project files
- [ ] `npm run knip` runs dead code/export/dependency analysis
- [ ] Wired into `lint-staged` in `package.json` (runs on every commit)

### Centralized Workflow Timers

- [ ] New `.workflow-timestamps.json` file consolidating all periodic checks:
  ```json
  {
    "deps-check": "2026-02-08T09:54:37Z",
    "meta-review": "2026-02-10T00:00:00Z",
    "mutation-test": null
  }
  ```
- [ ] `.deps-check-timestamp` removed (migrated into centralized file)
- [ ] `.docs/last-meta-review.txt` removed (migrated into centralized file)
- [ ] All three timers use 14-day cadence
- [ ] `CLAUDE.md` session start section updated: read `.workflow-timestamps.json`, report all overdue items at once
- [ ] `/tdd` workflow (`.claude/commands/tdd.md`) updated: read meta-review timer from `.workflow-timestamps.json` instead of `.docs/last-meta-review.txt`

### Documentation

- [ ] `CLAUDE.md` key commands section updated with new npm scripts (`mutate`, `mutate:full`, `validate:deps`, `knip`)
- [ ] `CLAUDE.md` session start section references `.workflow-timestamps.json` instead of `.deps-check-timestamp`

## Approach

Install and configure three tools independently, then wire them into existing automation:

1. Stryker: config + npm scripts + `/tdd` integration + timer entry
2. dependency-cruiser: config with layered architecture rules + npm script + lint-staged
3. knip: config + npm script + lint-staged
4. Consolidate timers: migrate two existing files into `.workflow-timestamps.json`, update all consumers

## Scope Boundaries

- **In scope**: Package installation, config files, npm scripts, lint-staged wiring, `/tdd` workflow integration, timer consolidation, CLAUDE.md updates
- **Out of scope**: Setting mutation score thresholds (baseline first), CI pipeline setup, fixing any issues the new tools discover (dead code, boundary violations, surviving mutants), changes to game engine/components/stores

## Assumptions

- Stryker's `@stryker-mutator/vitest-runner` supports Vitest 4.x and the dual-project config. If it doesn't, we fall back to unit-project-only mutation testing and document the limitation.
- dependency-cruiser and knip are fast enough for lint-staged without noticeably slowing commits. If either takes >5s on staged files, we move it to npm script only and document why.
- The `/tdd` workflow file (`.claude/commands/tdd.md`) is the only consumer of `.docs/last-meta-review.txt`. If other files reference it, they need updating too.

## Constraints

- All packages must exist on npm (verify before installing)
- No changes to source code, tests, or game logic
- Must maintain TypeScript strict mode compliance
- Must not break existing pre-commit hook (`lint-staged` runs ESLint + Prettier)
- Config files follow project convention (root-level dotfiles)
- Lesson 005 context: Stryker is specifically valuable here because tests that manually construct state (rather than simulating producer output) will show as surviving mutants even with 98.8% line coverage
