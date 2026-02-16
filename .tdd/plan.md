# Implementation Plan: Static Analysis Toolchain + Timer Consolidation

## Overview

Add Stryker Mutator, dependency-cruiser, and knip as dev tools. Consolidate workflow timers into `.workflow-timestamps.json`. No source code changes.

## Tests Needed?

**No tests needed.** This task is config/tooling only: config files, npm scripts, lint-staged wiring, and documentation. No runtime source code is created or modified. No behavioral logic to verify. The tools themselves are verified by running them (`npm run mutate`, `npm run validate:deps`, `npm run knip`) during implementation. The planner recommends skipping DESIGN_TESTS, TEST_DESIGN_REVIEW, and WRITE_TESTS phases.

## Implementation Order

Execute in 4 phases. Each phase is independently committable but we commit once at the end.

---

## Phase 1: Install Packages

### Step 1.1: Install devDependencies

```bash
npm install --save-dev @stryker-mutator/core@^9.5.1 @stryker-mutator/vitest-runner@^9.5.1 dependency-cruiser@^17.3.8 knip@^5.83.1
```

Verify all four appear in `package.json` devDependencies after install.

### Files modified

- `/home/bob/Projects/auto-battler/package.json` (devDependencies added by npm)

---

## Phase 2: Tool Configuration

### Step 2.1: Create `stryker.config.json`

Create `/home/bob/Projects/auto-battler/stryker.config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/stryker-mutator/stryker-js/master/packages/core/schema/stryker-core.schema.json",
  "testRunner": "vitest",
  "mutate": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!src/**/*.test.ts",
    "!src/**/*.test.tsx",
    "!src/**/*.browser.test.tsx",
    "!src/**/*-test-helpers.ts",
    "!src/test/**",
    "!src/main.tsx"
  ],
  "reporters": ["html", "clear-text", "progress"],
  "htmlReporter": {
    "fileName": "reports/mutation/mutation.html"
  },
  "incremental": false,
  "incrementalFile": ".stryker-tmp/incremental.json",
  "concurrency": 4,
  "tempDirName": ".stryker-tmp"
}
```

**Key decisions:**

- **`testRunner: "vitest"`**: The vitest-runner 9.5.1 supports vitest >=2.0.0 (project uses 4.0.18). It reads `vite.config.ts` automatically.
- **Dual Vitest projects**: The vitest-runner invokes vitest which reads the existing `vite.config.ts` with its `test.projects` array. Both unit and browser projects will run against mutants. If this causes issues (browser project slowness or failures), the fallback is to add `"vitest": { "configFile": "vite.config.ts", "project": "unit" }` to the Stryker config. Document this in a comment.
- **Mutate exclusions**: Excludes all test files (`*.test.ts`, `*.test.tsx`, `*.browser.test.tsx`), test helpers (`*-test-helpers.ts`), test setup (`src/test/**`), and trivial entry (`src/main.tsx`). Does NOT exclude `src/engine/types.ts` because it contains runtime functions (`isPluralTarget`, `positionsEqual`, `isValidPosition`, `hexDistance`).
- **No thresholds**: Reporting only (no `thresholds` key = no enforcement).
- **`incremental: false`**: The base config does NOT enable incremental. The `npm run mutate` script passes `--incremental` as a CLI flag override, so the full run (`npm run mutate:full`) gets a clean baseline.
- **`concurrency: 4`**: Conservative default; adjustable per machine.

### Step 2.2: Create `.dependency-cruiser.cjs`

Create `/home/bob/Projects/auto-battler/.dependency-cruiser.cjs`:

```javascript
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // === Engine isolation ===
    {
      name: "engine-no-react",
      comment: "Engine must not import React or React DOM",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: ["react", "react-dom"] },
    },
    {
      name: "engine-no-state-mgmt",
      comment: "Engine must not import Zustand or Immer",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: ["zustand", "immer"] },
    },
    {
      name: "engine-no-components",
      comment: "Engine must not import from components",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: "^src/components/" },
    },
    {
      name: "engine-no-stores",
      comment: "Engine must not import from stores",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: "^src/stores/" },
    },
    {
      name: "engine-no-hooks",
      comment: "Engine must not import from hooks",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: "^src/hooks/" },
    },
    {
      name: "engine-no-styles",
      comment: "Engine must not import from styles",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: "^src/styles/" },
    },

    // === Store isolation ===
    {
      name: "stores-no-components",
      comment: "Stores must not import from components",
      severity: "error",
      from: { path: "^src/stores/" },
      to: { path: "^src/components/" },
    },
    {
      name: "stores-no-hooks",
      comment: "Stores must not import from hooks",
      severity: "error",
      from: { path: "^src/stores/" },
      to: { path: "^src/hooks/" },
    },

    // === Hooks isolation ===
    {
      name: "hooks-no-components",
      comment: "Hooks must not import from components",
      severity: "error",
      from: { path: "^src/hooks/" },
      to: { path: "^src/components/" },
    },

    // === Circular dependencies ===
    {
      name: "no-circular",
      comment: "No circular dependencies anywhere in src",
      severity: "error",
      from: { path: "^src/" },
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    exclude: {
      path: ["\\.(test|browser\\.test)\\.(ts|tsx)$", "-test-helpers\\.ts$"],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
```

**Key decisions:**

- **`.cjs` extension**: Required because project is `"type": "module"` and dependency-cruiser config uses CommonJS `module.exports`.
- **Boundary rules match architecture.md exactly**: engine must not import react/react-dom/zustand/immer/components/stores/hooks/styles; stores must not import components/hooks; hooks must not import components.
- **Circular deps**: Applied to all of `src/`.
- **Test exclusion**: Tests are excluded from validation since test files legitimately cross architectural boundaries.

### Step 2.3: Create `knip.json`

Create `/home/bob/Projects/auto-battler/knip.json`:

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": ["src/main.tsx"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": [
    "src/**/*.test.{ts,tsx}",
    "src/**/*.browser.test.{ts,tsx}",
    "src/**/*-test-helpers.ts",
    "src/test/**"
  ],
  "ignoreDependencies": [
    "babel-plugin-react-compiler",
    "@vitest/browser",
    "@vitest/browser-playwright",
    "playwright"
  ]
}
```

**Key decisions:**

- **Entry point**: `src/main.tsx` is the single application entry.
- **Project scope**: All `.ts` and `.tsx` files in `src/`.
- **Ignore patterns**: Test files, test helpers, and test setup (these have different dependency patterns).
- **ignoreDependencies**: Packages referenced only in config files (vite.config.ts, etc.) that knip cannot trace from source entry points. `babel-plugin-react-compiler` is used in vite.config.ts plugin array. `@vitest/browser`, `@vitest/browser-playwright`, and `playwright` are used in vite.config.ts test.projects config. These are legitimate dependencies that knip would incorrectly flag as unused.

### Files created

- `/home/bob/Projects/auto-battler/stryker.config.json`
- `/home/bob/Projects/auto-battler/.dependency-cruiser.cjs`
- `/home/bob/Projects/auto-battler/knip.json`

---

## Phase 3: npm Scripts, lint-staged, and .gitignore

### Step 3.1: Add npm scripts to `package.json`

Add to the `"scripts"` object:

```json
"mutate": "stryker run --incremental",
"mutate:full": "stryker run",
"validate:deps": "depcruise src --config .dependency-cruiser.cjs",
"knip": "knip"
```

### Step 3.2: Update lint-staged in `package.json`

Replace the current `lint-staged` config:

**Before:**

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,css}": [
    "prettier --write"
  ]
}
```

**After:**

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "depcruise --config .dependency-cruiser.cjs"
  ],
  "*.{json,md,css}": [
    "prettier --write"
  ]
}
```

**lint-staged wiring rationale:**

- **dependency-cruiser**: Added to `*.{ts,tsx}` glob. lint-staged passes staged files as arguments; depcruise validates each file's imports against the boundary rules. Per-file invocation is sufficient because depcruise checks each file's imports -- if a staged file adds a forbidden import, depcruise catches it regardless of whether the target file is staged. The 5s threshold should be met since depcruise processes individual files quickly.

- **knip: NOT wired into lint-staged.** knip analyzes the entire project for unused exports/dependencies/files -- it cannot meaningfully run on individual staged files. Running full-project knip in lint-staged would either (a) always run against the whole project regardless of staged files (ignoring the lint-staged file list), or (b) produce incorrect results on partial file lists. It is better as an explicit npm script (`npm run knip`) run periodically or in CI. This is the correct design -- knip is a project-level analyzer, not a per-file linter.

### Step 3.3: Update `.gitignore`

Add to `/home/bob/Projects/auto-battler/.gitignore`:

```
# Stryker
.stryker-tmp/
reports/

# Workflow timers (machine-specific)
.workflow-timestamps.json
```

Also update the existing `# Dependency check` section: replace `.deps-check-timestamp` with the new `.workflow-timestamps.json` entry (remove the old line since the new entry covers it under a new heading).

### Files modified

- `/home/bob/Projects/auto-battler/package.json` (scripts + lint-staged)
- `/home/bob/Projects/auto-battler/.gitignore` (add Stryker dirs + workflow file, remove old timestamp entry)

---

## Phase 4: Timer Consolidation + Documentation Updates

### Step 4.1: Create `.workflow-timestamps.json`

Create `/home/bob/Projects/auto-battler/.workflow-timestamps.json` with migrated values:

```json
{
  "deps-check": "2026-02-08T09:54:37Z",
  "meta-review": "2026-02-10T00:00:00Z",
  "mutation-test": null
}
```

**Migration notes:**

- `deps-check`: Exact value from current `.deps-check-timestamp` (`2026-02-08T09:54:37Z`)
- `meta-review`: Value from `.docs/last-meta-review.txt` (`2026-02-10`) with `T00:00:00Z` appended to standardize on ISO 8601 with time
- `mutation-test`: `null` (no prior run; first `npm run mutate` sets this)

### Step 4.2: Delete old timer files

After creating the consolidated file:

- Delete `/home/bob/Projects/auto-battler/.deps-check-timestamp`
- Delete `/home/bob/Projects/auto-battler/.docs/last-meta-review.txt`

**Semantic change note:** `.docs/last-meta-review.txt` was tracked in git; `.workflow-timestamps.json` is gitignored (machine-specific). This is intentional -- timer values are per-developer and should not be shared.

### Step 4.3: Update `CLAUDE.md` -- Session Start section

Replace lines 96-102 of `/home/bob/Projects/auto-battler/CLAUDE.md`:

**Before:**

```markdown
## Session Start

Read `.deps-check-timestamp` (repo root, ISO 8601 UTC date). Calculate days since that date. If >14 days or file missing, print:

> **Dependency check overdue** ({N} days since last check). Run `/project:deps-check` to update.

Then continue normal session setup.
```

**After:**

```markdown
## Session Start

Read `.workflow-timestamps.json` (repo root). For each key, calculate days since value (ISO 8601 UTC). If file missing, treat all as overdue. Report all overdue items (>14 days or null) at once:

> **Overdue workflow checks:**
>
> - **Dependency check** overdue ({N} days). Run `/project:deps-check`.
> - **Meta-review** overdue ({N} days). Run `/tdd` to trigger.
> - **Mutation testing** overdue ({N} days). Run `npm run mutate`.

If none overdue, proceed without mention.
```

### Step 4.4: Update `CLAUDE.md` -- Key Commands section

Add the new scripts to the Key Commands code block (after `security:check`):

```bash
npm run mutate        # Incremental mutation testing (Stryker)
npm run mutate:full   # Full mutation testing (no cache)
npm run validate:deps # Validate module boundaries (dependency-cruiser)
npm run knip          # Detect unused code/exports/dependencies
```

### Step 4.5: Update `.claude/commands/tdd.md` -- Meta-Housekeeping Timer

Replace lines 21-29 of `/home/bob/Projects/auto-battler/.claude/commands/tdd.md`:

**Before:**

```markdown
## Meta-Housekeeping Timer

At session start, read `.docs/last-meta-review.txt`. If the file is missing or the date inside is >30 days ago, output:

> ⏰ Monthly meta-review due. Review or "skip" to proceed.

On either review completion or skip, write today's date (YYYY-MM-DD) to `.docs/last-meta-review.txt` and log a one-line summary to `.docs/meta-review-log.md`.

If ≤30 days, proceed without mention.
```

**After:**

```markdown
## Meta-Housekeeping Timer

At session start, read `.workflow-timestamps.json` key `"meta-review"`. If the file is missing, the key is null, or the date is >14 days ago, output:

> Meta-review due. Review or "skip" to proceed.

On either review completion or skip, update `"meta-review"` in `.workflow-timestamps.json` to current ISO 8601 UTC timestamp and log a one-line summary to `.docs/meta-review-log.md`.

If <=14 days, proceed without mention.
```

### Step 4.6: Update `.claude/commands/deps-check.md` -- Post-Update Timestamp

Replace line 99 of `/home/bob/Projects/auto-battler/.claude/commands/deps-check.md`:

**Before:**

```bash
date -u +%Y-%m-%dT%H:%M:%SZ > .deps-check-timestamp
```

**After:**

Replace the entire "Update Timestamp" subsection (lines 96-100):

**Before:**

````markdown
### Update Timestamp

```bash
date -u +%Y-%m-%dT%H:%M:%SZ > .deps-check-timestamp
```
````

````

**After:**
```markdown
### Update Timestamp

Update `"deps-check"` in `.workflow-timestamps.json` to current ISO 8601 UTC timestamp. If the file does not exist, create it:

```bash
node -e "
const fs = require('fs');
const f = '.workflow-timestamps.json';
const data = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
data['deps-check'] = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
fs.writeFileSync(f, JSON.stringify(data, null, 2) + '\n');
"
````

```

### Step 4.7: Update `.gitignore` -- Remove old entry

In the `.gitignore`, remove:
```

# Dependency check

.deps-check-timestamp

````

This is already covered by Step 3.3 which adds `.workflow-timestamps.json` under a new heading. The old `.deps-check-timestamp` line should be removed since the file no longer exists.

### Step 4.8: Integrate mutation testing into `/tdd` workflow

Add `npm run mutate` as a post-test step in the IMPLEMENT phase. In `.claude/commands/tdd.md`, update the IMPLEMENT phase:

**Current (line ~406):**
```yaml
  IMPLEMENT:
    agent: tdd-coder
    budget: tdd-coder_implement
    inputs: [".tdd/test-designs.md", ".tdd/plan.md"]
    actions:
      - Write code to pass tests
      - Run quality gates (lint, type-check)
      - UI changes: browser verification (MCP tools only)
    gate_order: "tests pass (green) → lint → type-check → REVIEW"
    next: REVIEW
````

**Updated:**

```yaml
IMPLEMENT:
  agent: tdd-coder
  budget: tdd-coder_implement
  inputs: [".tdd/test-designs.md", ".tdd/plan.md"]
  actions:
    - Write code to pass tests
    - Run quality gates (lint, type-check)
    - Run incremental mutation testing (npm run mutate) — non-blocking, report-only
    - UI changes: browser verification (MCP tools only)
  gate_order: "tests pass (green) → lint → type-check → mutate (report-only) → REVIEW"
  next: REVIEW
```

Also update the mutation-test timestamp after a successful mutate run. Add to the IMPLEMENT actions or COMMIT phase: update `"mutation-test"` in `.workflow-timestamps.json` to current ISO 8601 UTC timestamp.

### Files modified

- `/home/bob/Projects/auto-battler/.workflow-timestamps.json` (created)
- `/home/bob/Projects/auto-battler/CLAUDE.md` (Session Start + Key Commands sections)
- `/home/bob/Projects/auto-battler/.claude/commands/tdd.md` (Meta-Housekeeping Timer + IMPLEMENT phase)
- `/home/bob/Projects/auto-battler/.claude/commands/deps-check.md` (Update Timestamp section)
- `/home/bob/Projects/auto-battler/.gitignore` (remove old `.deps-check-timestamp` entry)

### Files deleted

- `/home/bob/Projects/auto-battler/.deps-check-timestamp`
- `/home/bob/Projects/auto-battler/.docs/last-meta-review.txt`

---

## Complete File Manifest

### Files to CREATE (4)

1. `/home/bob/Projects/auto-battler/stryker.config.json`
2. `/home/bob/Projects/auto-battler/.dependency-cruiser.cjs`
3. `/home/bob/Projects/auto-battler/knip.json`
4. `/home/bob/Projects/auto-battler/.workflow-timestamps.json`

### Files to MODIFY (4)

1. `/home/bob/Projects/auto-battler/package.json` -- devDependencies, scripts, lint-staged
2. `/home/bob/Projects/auto-battler/.gitignore` -- add Stryker/workflow entries, remove old timestamp entry
3. `/home/bob/Projects/auto-battler/CLAUDE.md` -- Key Commands + Session Start sections
4. `/home/bob/Projects/auto-battler/.claude/commands/tdd.md` -- Meta-Housekeeping Timer + IMPLEMENT phase
5. `/home/bob/Projects/auto-battler/.claude/commands/deps-check.md` -- Update Timestamp section

### Files to DELETE (2)

1. `/home/bob/Projects/auto-battler/.deps-check-timestamp`
2. `/home/bob/Projects/auto-battler/.docs/last-meta-review.txt`

**Total: 4 created + 5 modified + 2 deleted = 11 file operations**

---

## Open Questions Resolved

### Stryker with dual Vitest projects

The vitest-runner invokes Vitest which reads the existing `vite.config.ts` and its `test.projects` array. Both unit and browser projects should run. If the browser project causes issues (Playwright overhead, flaky failures), the fallback is to add `"vitest": { "project": "unit" }` to `stryker.config.json`. The coder should attempt the default (both projects) first and fall back if needed.

### dependency-cruiser in lint-staged

Per-file invocation is appropriate. When lint-staged passes staged `.ts`/`.tsx` files to depcruise, each file's imports are checked against boundary rules. This catches forbidden imports at commit time. Performance should be well under 5s for individual files.

### knip in lint-staged

**Not wired into lint-staged.** knip is a project-level analyzer that needs the full dependency graph. Per-file invocation would be meaningless. It remains as `npm run knip` for periodic use or CI.

### Timer cadence

All three timers use 14-day cadence (changed from 30 days for meta-review per requirements). The `CLAUDE.md` session start checks all three at once. The `tdd.md` meta-housekeeping timer checks only meta-review.

### Stryker mutation scope

`src/main.tsx` is excluded (trivial React entry point with no logic). `src/test/setup.ts` and `src/test/setup.browser.ts` are excluded via the `!src/test/**` glob. `src/engine/types.ts` is NOT excluded because it contains runtime functions.

---

## New Architectural Decision

**Decision**: knip is not wired into lint-staged; it remains an npm script for periodic/CI use only.

**Context**: knip analyzes entire project dependency graphs for unused exports, files, and dependencies. This requires whole-project analysis, not per-file checking. lint-staged passes individual staged files, which is incompatible with knip's analysis model.

**Consequences**: Unused exports/dependencies are caught by periodic `npm run knip` runs or CI, not at commit time. This is acceptable because unused code is a quality issue, not a correctness issue -- it does not need pre-commit enforcement.

**Recommend adding to `.docs/decisions/index.md`** as ADR-025 during doc-sync phase.

---

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` requirements (no source code changes, architecture boundaries match)
- [x] Approach consistent with `.docs/architecture.md` (layered architecture rules exactly match dep-cruiser boundaries)
- [x] Patterns follow `.docs/patterns/index.md` (root-level dotfiles, co-located config)
- [x] No conflicts with `.docs/decisions/index.md`
- [x] UI tasks: N/A (no UI changes)

**Note**: Requirements say knip should be "wired into lint-staged." This plan deviates because knip cannot meaningfully analyze individual staged files. The deviation is documented and justified above. The coder should confirm this with a test: run `knip` on a single file and verify it produces no useful output.

---

## Verification Steps (for coder)

After implementation, verify each tool works:

1. `npm run validate:deps` -- should exit 0 (no boundary violations)
2. `npm run knip` -- should run and report any dead code (may find issues; do not fix in this task)
3. `npm run mutate` -- should start mutation testing (may take several minutes; verify it starts correctly)
4. `git add -A && npx lint-staged --dry-run` -- verify lint-staged runs depcruise on staged files without error
5. Verify `.workflow-timestamps.json` has correct structure and values
6. Verify `.deps-check-timestamp` and `.docs/last-meta-review.txt` are deleted
