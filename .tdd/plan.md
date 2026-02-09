# Implementation Plan: React 18 to 19 Upgrade + React Compiler

## Decision: No New Tests Needed

**Rationale:** This is a dependency upgrade with configuration changes -- not new feature code. The codebase has 1434 existing tests across 150 files that comprehensively cover all components and game logic. These tests serve as the regression suite. The upgrade introduces zero new application code, zero new APIs, and zero behavioral changes. If the existing test suite passes after the upgrade, the migration is validated. Writing new tests for unchanged application code would not add value.

**Validation strategy:** All 1434 existing tests must pass. All quality gates (TypeScript, ESLint, build) must pass.

## Phase Strategy: Two Atomic Phases

The upgrade is split into two independent, committable phases. Phase 1 (React 19) must succeed before Phase 2 (React Compiler). If Phase 2 introduces issues, Phase 1 remains stable and committed.

---

## Phase 1: React 19 Upgrade

### Step 1: Update package.json Dependencies

**File:** `/home/bob/Projects/auto-battler/package.json`

Update dependencies:

| Package                  | From       | To         |
| ------------------------ | ---------- | ---------- |
| `react`                  | `^18.3.1`  | `^19.2.4`  |
| `react-dom`              | `^18.3.1`  | `^19.2.4`  |
| `@types/react`           | `^18.3.28` | `^19.2.13` |
| `@types/react-dom`       | `^18.3.7`  | `^19.2.3`  |
| `@testing-library/react` | `^14.3.1`  | `^16.3.2`  |

Note: `@types/react` and `@types/react-dom` still exist as separate packages for React 19. They are NOT bundled into the `react` package. The task context was incorrect on this point.

### Step 2: Run npm install

```bash
npm install
```

Resolve any peer dependency conflicts. Expected: clean install since all target versions have compatible peer deps. Zustand 4.5.7 supports `react >=16.8`. `@testing-library/react` v16 supports `react ^18 || ^19`.

### Step 3: Update ESLint Configuration

**File:** `/home/bob/Projects/auto-battler/eslint.config.js`

Change:

```js
settings: {
  react: {
    version: '18.2',
  },
},
```

To:

```js
settings: {
  react: {
    version: 'detect',
  },
},
```

Using `'detect'` auto-detects the installed React version, eliminating future manual updates.

### Step 4: Verify -- Run All Quality Gates

Run in sequence:

```bash
npm run type-check    # TypeScript compilation
npm run lint          # ESLint
npm run test          # All 1434 tests
npm run build         # Production build
```

**Expected:** All pass without changes. Justification:

- **TypeScript:** No deprecated APIs used. All `useRef` calls already pass arguments (verified: only 5 `useRef` calls in codebase, all with initial values). `React.FC` not used. No `forwardRef`. No class components.
- **ESLint:** Version setting change is the only modification needed.
- **Tests:** `@testing-library/react` v16 has the same API surface (`render`, `screen`, `renderHook`, `cleanup`, `waitFor`, `act`). The 3 explicit `act()` calls in `PlayControls.test.tsx` import `act` from `@testing-library/react` which re-exports from React -- this works in both React 18 and 19. Manual `cleanup()` in `src/test/setup.ts` remains harmless (RTL v16 may auto-cleanup, but double-cleanup is a no-op).
- **Build:** `createRoot` already used. JSX runtime (`react-jsx`) unchanged. Vite plugin compatible.

### Step 5: Handle Test Failures (If Any)

Potential issues and fixes:

1. **`act()` warnings become errors in React 19:** React 19 may convert act() warnings to errors. The `battle-viewer-tooltip.test.tsx` act() warning filter (line 306) may no longer fire, which is harmless. But if new act() errors appear, wrap the offending state updates in `act()`.

2. **`vi.advanceTimersByTime` without `act()` in PlayControls.test.tsx:** Lines 293 and 309 call `vi.advanceTimersByTime` without `act()` wrapping (unlike lines 343-345 and 445-447 which do wrap). If React 19 is stricter about this, wrap them in `act()`.

3. **StrictMode double-rendering changes:** React 19 may change double-render behavior for effects. The `useInterval` hook pattern (ref + two effects) is resilient to this. Monitor for flaky tests.

### Step 6: Commit Phase 1

```
feat(deps): upgrade React 18 to 19

- react, react-dom: ^18.3.1 -> ^19.2.4
- @types/react: ^18.3.28 -> ^19.2.13
- @types/react-dom: ^18.3.7 -> ^19.2.3
- @testing-library/react: ^14.3.1 -> ^16.3.2
- ESLint react version: '18.2' -> 'detect'
```

---

## Phase 2: React Compiler Adoption

### Step 7: Install React Compiler Packages

**File:** `/home/bob/Projects/auto-battler/package.json`

Add new devDependencies:

| Package                        | Version        | Purpose                                 |
| ------------------------------ | -------------- | --------------------------------------- |
| `babel-plugin-react-compiler`  | `^1.0.0`       | Babel plugin for automatic memoization  |
| `eslint-plugin-react-compiler` | `^19.1.0-rc.2` | ESLint rules for compiler compatibility |

```bash
npm install --save-dev babel-plugin-react-compiler eslint-plugin-react-compiler
```

Note: `eslint-plugin-react-compiler` is at RC status (19.1.0-rc.2). This is the latest available version and is the recommended approach from the React team. The RC status is acceptable because (a) it only affects linting, not runtime, and (b) the React Compiler itself (`babel-plugin-react-compiler`) is at 1.0.0 stable.

### Step 8: Configure Vite for React Compiler

**File:** `/home/bob/Projects/auto-battler/vite.config.ts`

Change:

```ts
plugins: [react()],
```

To:

```ts
plugins: [
  react({
    babel: {
      plugins: [["babel-plugin-react-compiler"]],
    },
  }),
],
```

This integrates the React Compiler into the existing Babel-based Vite plugin. The compiler runs during the Babel transform phase, automatically inserting memoization where beneficial.

### Step 9: Configure ESLint for React Compiler

**File:** `/home/bob/Projects/auto-battler/eslint.config.js`

Add import:

```js
import reactCompiler from "eslint-plugin-react-compiler";
```

Add to plugins object:

```js
'react-compiler': reactCompiler,
```

Add rule:

```js
'react-compiler/react-compiler': 'error',
```

Keep `eslint-plugin-react-hooks` -- it provides `rules-of-hooks` enforcement which is complementary to the compiler plugin. The compiler plugin validates that code is compatible with automatic memoization (no mutations during render, etc.). The hooks plugin validates hook call order. Both are useful.

### Step 10: Verify -- Run All Quality Gates

```bash
npm run type-check    # Should be unaffected
npm run lint          # Verify react-compiler rule passes
npm run test          # All 1434 tests must pass (compiler should not change behavior)
npm run build         # Production build with compiler
```

**Expected:** All pass. The React Compiler's output is semantically equivalent to the input -- it only adds memoization. If the lint rule flags any violations, they indicate Rules of React violations that should be fixed (these would be pre-existing bugs, not regressions).

### Step 11: Handle Compiler Lint Violations (If Any)

If `react-compiler/react-compiler` reports errors:

1. Identify the flagged code
2. Determine if it is a genuine Rules of React violation (mutation during render, side effect in render path)
3. Fix the violation -- this improves code correctness regardless of the compiler
4. If a false positive, add `// eslint-disable-next-line react-compiler/react-compiler` with a justification comment

### Step 12: Commit Phase 2

```
feat(build): adopt React Compiler for automatic memoization

- Add babel-plugin-react-compiler ^1.0.0
- Add eslint-plugin-react-compiler ^19.1.0-rc.2
- Configure Vite plugin-react with compiler babel plugin
- Configure ESLint with react-compiler rule
```

---

## Files Modified (Exhaustive List)

| File                                                | Phase | Changes                                                       |
| --------------------------------------------------- | ----- | ------------------------------------------------------------- |
| `/home/bob/Projects/auto-battler/package.json`      | 1 + 2 | Update deps (Phase 1), add compiler deps (Phase 2)            |
| `/home/bob/Projects/auto-battler/package-lock.json` | 1 + 2 | Auto-generated by npm install                                 |
| `/home/bob/Projects/auto-battler/eslint.config.js`  | 1 + 2 | Update react version (Phase 1), add compiler plugin (Phase 2) |
| `/home/bob/Projects/auto-battler/vite.config.ts`    | 2     | Add compiler babel plugin config                              |

### Files NOT Modified

- `/home/bob/Projects/auto-battler/src/main.tsx` -- Already uses `createRoot` + `StrictMode`
- `/home/bob/Projects/auto-battler/tsconfig.json` -- `jsx: "react-jsx"` unchanged, `@types/react` still a separate package
- `/home/bob/Projects/auto-battler/src/test/setup.ts` -- Manual `cleanup()` is harmless, keep for explicitness
- All component files -- No deprecated API usage to migrate
- All test files -- `@testing-library/react` v16 API is compatible
- Manual memoization files (8 useMemo/useCallback sites) -- Deferred to follow-up cleanup task

---

## Risk Assessment

### Low Risk

- **Zustand compatibility:** Zustand 4.5.7 peerDep is `react >=16.8`. No issue.
- **CSS Modules:** No React version dependency.
- **Game engine:** Pure TypeScript, no React dependency.
- **Portal (createPortal):** API unchanged in React 19.
- **useLayoutEffect:** Unchanged in React 19.
- **useRef:** All 5 calls already pass arguments. No `useRef()` without args.

### Medium Risk

- **`act()` behavior changes:** React 19 improves batching which may change when `act()` is needed. The 3 explicit `act()` calls in PlayControls.test.tsx and the act warning filter in battle-viewer-tooltip.test.tsx may need adjustment. Mitigation: run tests first, fix only if failures occur.
- **`eslint-plugin-react-compiler` at RC:** Acceptable risk since it only affects linting, not runtime. Pin to specific version. Can be updated when stable.

### Low-to-None Risk

- **React Compiler output:** The compiler produces semantically equivalent code. It cannot break behavior -- it only adds memoization. The 1434 test suite validates this.
- **StrictMode changes:** React 19 StrictMode still double-renders in dev. Effect cleanup behavior may be slightly different but the codebase uses standard patterns.

## Rollback Strategy

1. **Phase 1 rollback:** Revert the Phase 1 commit. Run `npm install`. All packages return to React 18 versions.
2. **Phase 2 rollback:** Revert the Phase 2 commit. Phase 1 (React 19) remains intact. The compiler is cleanly separable.
3. **Partial rollback (compiler only):** Remove `babel` config from `vite.config.ts` and compiler rules from `eslint.config.js`. The compiler packages in `package.json` become unused devDependencies (harmless).

---

## Follow-Up Tasks (Not Part of This Upgrade)

1. **Remove manual memoization:** After confirming the compiler works, the 8 `useMemo`/`useCallback` calls become redundant. They are harmless (compiler skips them) but removing them simplifies code. This is a cosmetic cleanup, not urgent.
2. **Clean up act() warning filter:** The filter in `battle-viewer-tooltip.test.tsx` (line 306) may no longer be needed with React 19. Verify and remove in a follow-up.
3. **Evaluate `eslint-plugin-react-compiler` stable release:** Monitor for stable (non-RC) release and update.

---

## New Decision

**Decision:** Adopt React Compiler as a Babel plugin alongside existing manual memoization, deferring cleanup of useMemo/useCallback to a follow-up task.

**Context:** The React Compiler automatically handles memoization, making explicit `useMemo`/`useCallback` redundant. The question is whether to remove them during the upgrade or defer.

**Consequences:** The compiler coexists with manual memoization (it skips already-memoized values). Keeping them temporarily adds no runtime cost and reduces upgrade risk. Recommend recording as ADR-020 if the team wants to track this decision.

## Version Bump

Update `package.json` version from `0.19.0` to `0.20.0` (minor version bump -- new capability via React Compiler, no breaking changes). Apply in Phase 2 commit.
