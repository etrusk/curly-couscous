# Exploration Findings

## Task Understanding

Add three static analysis tools (Stryker Mutator, dependency-cruiser, knip) and consolidate two existing workflow timer files (`.deps-check-timestamp` and `.docs/last-meta-review.txt`) into a single `.workflow-timestamps.json` file. No source code changes -- only configuration, npm scripts, lint-staged wiring, and documentation updates.

## Relevant Files

### Vitest/Vite Configuration

- `/home/bob/Projects/auto-battler/vite.config.ts` - Dual project setup: `unit` (jsdom, `*.test.{ts,tsx}`, excludes `*.browser.test.*`) and `browser` (Playwright/Chromium, `*.browser.test.{ts,tsx}`). Stryker's vitest-runner must work with this `test.projects` array structure. Key details:
  - Unit project: jsdom environment, `setupFiles: ./src/test/setup.ts`, `fakeTimers: { shouldAdvanceTime: true }`
  - Browser project: Playwright provider, headless Chromium, separate setup file `./src/test/setup.browser.ts`
  - Both use `extends: true` (inherit root config)
  - React Compiler babel plugin configured at root level

### Package Configuration

- `/home/bob/Projects/auto-battler/package.json` - Key observations:
  - **Existing scripts**: `dev`, `build`, `build:verify`, `preview`, `test`, `test:unit`, `test:browser`, `test:watch`, `test:ui`, `test:critical`, `type-check`, `lint`, `format`, `security:check`, `security:scan`, `prepare`
  - **No existing** `mutate`, `validate:deps`, or `knip` scripts
  - **lint-staged config** (inline in package.json):
    ```json
    "lint-staged": {
      "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
      "*.{json,md,css}": ["prettier --write"]
    }
    ```
  - **Husky**: `"prepare": "husky"` script, `.husky/pre-commit` runs `npx lint-staged`
  - **Version**: `0.26.0`, `"type": "module"`
  - **Dependencies**: react, react-dom, immer, zustand
  - **DevDependencies**: vitest 4.0.18, vite 7.3.1, typescript 5.9.3, eslint 9.39.2, prettier 3.8.1, husky 9.1.7, lint-staged 16.2.7, playwright 1.58.2, and various eslint/testing-library packages

### Project Structure (for dependency-cruiser boundaries)

```
src/
  engine/       - Pure TypeScript game logic (NO React deps) -- ~40+ source files + tests
  stores/       - Zustand stores (gameStore.ts, accessibilityStore.ts, types, constants, helpers)
  hooks/        - Custom React hooks (useInterval.ts only)
  components/   - React components (BattleViewer/, CharacterPanel/, RuleEvaluations/, etc.)
  styles/       - CSS Modules + theme definitions (theme.css, tests)
  test/         - Test setup files (setup.ts, setup.browser.ts)
  utils/        - Utilities (letterMapping.ts only)
```

Layered architecture rules from `.docs/architecture.md`:

- `engine/` must NOT import from react, react-dom, zustand, immer, components, stores, hooks, styles
- `stores/` must NOT import from components, hooks
- `hooks/` must NOT import from components

### Timer Files (to consolidate)

- `/home/bob/Projects/auto-battler/.deps-check-timestamp` - Contains `2026-02-08T09:54:37Z` (ISO 8601 UTC). Referenced by:
  - `CLAUDE.md` (Session Start section: read and check if >14 days)
  - `.claude/commands/deps-check.md` (writes `date -u +%Y-%m-%dT%H:%M:%SZ` to this file)
  - `.gitignore` (listed under `# Dependency check`)

- `/home/bob/Projects/auto-battler/.docs/last-meta-review.txt` - Contains `2026-02-10` (YYYY-MM-DD, no time component). Referenced by:
  - `.claude/commands/tdd.md` (Meta-Housekeeping Timer section: reads file, checks if >30 days, writes YYYY-MM-DD on completion)
  - NOT in `.gitignore` (tracked in git)

### Workflow Consumer Files

- `/home/bob/Projects/auto-battler/CLAUDE.md` - Session Start section (lines 96-102):

  ```
  Read `.deps-check-timestamp` (repo root, ISO 8601 UTC date). Calculate days since that date.
  If >14 days or file missing, print:
  > **Dependency check overdue** ({N} days since last check). Run `/project:deps-check` to update.
  ```

  Also Key Commands section (lines ~27-36) listing `build`, `test`, `test:watch`, `lint`, `type-check`, `format`, `security:check`.

- `/home/bob/Projects/auto-battler/.claude/commands/tdd.md` - Meta-Housekeeping Timer section (lines 22-27):

  ```
  At session start, read `.docs/last-meta-review.txt`. If the file is missing or the date inside
  is >30 days ago, output: "Monthly meta-review due..."
  On either review completion or skip, write today's date (YYYY-MM-DD) to `.docs/last-meta-review.txt`
  ```

- `/home/bob/Projects/auto-battler/.claude/commands/deps-check.md` - Post-Update section writes to `.deps-check-timestamp` (line 99).

### .gitignore

- `/home/bob/Projects/auto-battler/.gitignore` - Current entries include: `node_modules`, `dist`, `coverage`, `__screenshots__/`, `.env*`, `.claude/settings.local.json`, `CLAUDE.local.md`, `.deps-check-timestamp`. Needs additions:
  - `.stryker-tmp/` (Stryker working directory)
  - `reports/` (Stryker HTML output)
  - `.workflow-timestamps.json` (replaces `.deps-check-timestamp` entry)

### Test File Patterns

- **Unit tests**: `*.test.ts` and `*.test.tsx` (no `*.spec.*` files exist in the project)
- **Browser tests**: `*.browser.test.tsx` (3 files)
- **Test helper files** (not tests, should be excluded from mutation):
  - `src/engine/combat-test-helpers.ts`
  - `src/engine/game-test-helpers.ts`
  - `src/engine/selectors-test-helpers.ts`
  - `src/engine/triggers-test-helpers.ts`
  - `src/stores/gameStore-test-helpers.ts`
  - `src/components/RuleEvaluations/rule-evaluations-test-helpers.ts`
- **Test setup files**: `src/test/setup.ts`, `src/test/setup.browser.ts`

### Type-Only / Constants Files

- **No `.d.ts` files** exist in `src/`
- Type-heavy files that should likely be excluded from Stryker (mostly type exports, minimal runtime code):
  - `src/engine/types.ts` (396 lines -- mostly interfaces/types, but has a few runtime functions: `isPluralTarget`, `positionsEqual`, `isValidPosition`, `hexDistance`)
  - `src/stores/gameStore-types.ts` (86 lines)
  - `src/stores/gameStore-constants.ts` (57 lines)

## Existing Patterns

- **CSS Modules pattern** - Components use `*.module.css` co-located files
- **Co-located tests** - Tests live alongside source files (e.g., `hex.test.ts` next to `hex.ts`)
- **Test helper convention** - Helper files named `*-test-helpers.ts` (6 files)
- **Browser test convention** - `*.browser.test.tsx` for real DOM tests (ADR-022)
- **Inline lint-staged** - Config embedded in `package.json`, not a separate file
- **Root-level dotfiles** - Config files follow project convention (`.gitignore`, `.deps-check-timestamp`)
- **No existing `*.config.json` for tools** - ESLint uses flat config (implicit), Prettier likely defaults

## Dependencies

- **Stryker needs**: `@stryker-mutator/core`, `@stryker-mutator/vitest-runner` as devDependencies
- **dependency-cruiser needs**: `dependency-cruiser` as devDependency
- **knip needs**: `knip` as devDependency
- **Stryker vitest-runner compatibility**: Must verify it supports Vitest 4.x and the `test.projects` dual-project config. The requirements note a fallback: if dual-project is not supported, use unit-project-only mutation testing.
- **lint-staged additions**: dependency-cruiser and knip need to be wired into the existing `*.{ts,tsx}` lint-staged array

## Applicable Lessons

- **Lesson 005** - "Tests masking bugs by manually aligning state" -- Directly relevant. The requirements note this: Stryker is specifically valuable because tests that manually construct state will show as surviving mutants even with 98.8% line coverage. This validates the tool's value proposition.
- No other lessons from the index (001-004) are relevant to this tooling/configuration task.

## Constraints Discovered

1. **Stryker + dual Vitest projects**: The `vite.config.ts` uses `test.projects` with two project definitions. Stryker's vitest-runner may need special config or may only support a single project. The requirements anticipate this and provide a fallback (unit-only mutation testing).

2. **lint-staged performance**: dependency-cruiser and knip added to lint-staged must not noticeably slow commits (>5s threshold per requirements). If they do, they should be npm-script-only.

3. **Timer format mismatch**: `.deps-check-timestamp` uses ISO 8601 with time (`2026-02-08T09:54:37Z`) while `.docs/last-meta-review.txt` uses date-only (`2026-02-10`). The consolidated `.workflow-timestamps.json` should standardize on ISO 8601 with time for all entries.

4. **Timer cadence change**: `.deps-check-timestamp` currently uses 14-day cadence in `CLAUDE.md`. `.docs/last-meta-review.txt` uses 30-day cadence in `tdd.md`. The requirements specify all three timers use 14-day cadence, so the meta-review cadence changes from 30 to 14 days.

5. **`.workflow-timestamps.json` in .gitignore**: The existing `.deps-check-timestamp` is in `.gitignore`. The new consolidated file should also be in `.gitignore` (since timestamps are machine-specific). The old `.docs/last-meta-review.txt` is NOT in `.gitignore` (tracked). This is a semantic change worth noting.

6. **deps-check.md also writes to `.deps-check-timestamp`**: The `deps-check` command (`.claude/commands/deps-check.md`, line 99) writes `date -u +%Y-%m-%dT%H:%M:%SZ > .deps-check-timestamp`. This must be updated to write to `.workflow-timestamps.json` instead.

7. **No changes to source code**: The requirements explicitly state no changes to source code, tests, or game logic. Only config files, scripts, and documentation.

8. **File line limit**: 400-line max per file is a project constraint, but config files should be well under this.

9. **`stryker.config.json` naming**: The requirements specify `stryker.config.json` (not `stryker.config.mjs` or `.js`). Since the project is `"type": "module"`, a JSON config avoids ESM/CJS issues.

10. **dependency-cruiser config naming**: Requirements specify `.dependency-cruiser.cjs`. The `.cjs` extension is needed because the project is `"type": "module"` and dependency-cruiser's config uses CommonJS `module.exports`.

## Open Questions

1. **Stryker vitest-runner dual-project support**: Does `@stryker-mutator/vitest-runner` work with Vitest's `test.projects` config? If not, can it be configured to target only the `unit` project? This should be verified during implementation.

2. **knip entry points**: knip needs to know the project's entry points. The main entry is `src/main.tsx`. The test setup files (`src/test/setup.ts`, `src/test/setup.browser.ts`) and vite config should be auto-detected. Are there other entry points?

3. **dependency-cruiser on staged files only**: The `lint-staged` config runs commands on staged files only. `dependency-cruiser` typically validates the whole dependency graph. Running it on individual staged files may not catch all boundary violations (e.g., a new import in a staged file that pulls in a forbidden dependency). Need to verify if per-file invocation is sufficient or if the full `src/` scan is needed.

4. **knip on staged files**: Similar to dependency-cruiser -- knip analyzes the whole project for dead exports/dependencies. Running on staged files alone may not be meaningful. May need to run on full project in lint-staged (or move to npm script only if too slow).

5. **Stryker mutation scope**: The requirements say "mutate full `src/` tree (excluding test files, test helpers, type-only files)". Should `src/test/setup.ts` and `src/test/setup.browser.ts` also be excluded? They are test infrastructure. Should `src/main.tsx` be excluded (trivial React entry point)?

6. **`.workflow-timestamps.json` initial creation**: When the file does not exist, all consumers need to handle graceful creation. The `CLAUDE.md` session start section already handles "file missing" case for `.deps-check-timestamp`.

7. **Mutation testing in `/tdd` workflow**: The requirements say "Incremental run (`npm run mutate`) integrated into `/tdd` workflow as a post-test step." Where exactly in the TDD workflow does this go? After IMPLEMENT (post-green)? After REVIEW? The `tdd.md` state machine would need a new step or an addition to an existing phase.
