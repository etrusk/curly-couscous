# Exploration Findings: React 18 to 19 Upgrade + React Compiler Adoption

## Task Understanding

Upgrade from React 18.3.1 to React 19 and adopt the React Compiler (babel plugin). This involves updating React/ReactDOM packages, type definitions, testing libraries, Vite plugin configuration, ESLint config, and verifying all existing patterns are compatible with React 19's changes. The React Compiler would automatically handle memoization, potentially replacing manual `useMemo`/`useCallback` calls.

## Current State

### Package Versions (Installed)

| Package                     | Installed | package.json Range             |
| --------------------------- | --------- | ------------------------------ |
| react                       | 18.3.1    | ^18.3.1                        |
| react-dom                   | 18.3.1    | ^18.3.1                        |
| @types/react                | 18.3.28   | ^18.3.28                       |
| @types/react-dom            | 18.3.7    | ^18.3.7                        |
| @vitejs/plugin-react        | 4.7.0     | ^4.7.0                         |
| @testing-library/react      | 14.3.1    | ^14.3.1                        |
| @testing-library/jest-dom   | 6.9.1     | ^6.9.1                         |
| @testing-library/user-event | 14.6.1    | ^14.6.1                        |
| eslint-plugin-react-hooks   | 5.2.0     | ^5.2.0                         |
| eslint-plugin-react         | 7.37.5    | ^7.37.5                        |
| eslint-plugin-react-refresh | 0.5.0     | ^0.5.0                         |
| zustand                     | 4.5.7     | ^4.5.7 (peerDep: react >=16.8) |
| immer                       | 10.2.0    | ^10.2.0                        |
| jsdom                       | 23.2.0    | ^23.2.0                        |
| vitest                      | 4.0.18    | ^4.0.18                        |
| vite                        | 7.3.1     | ^7.3.1                         |
| typescript                  | 5.9.3     | ^5.9.3                         |

### App Bootstrap

- **Entry point**: `/home/bob/Projects/auto-battler/src/main.tsx`
- Uses `ReactDOM.createRoot()` (React 18+ concurrent API) -- already compatible with React 19
- Wrapped in `<React.StrictMode>` -- compatible with React 19
- No `ReactDOM.render()` (legacy API) usage anywhere

### Component Architecture

- **All functional components** -- zero class components found (`extends Component` / `extends React.Component` search returned 0 results)
- **No `forwardRef` usage** -- search returned 0 results. All refs are local `useRef` hooks (`tooltipRef`, `gridContainerRef`, `hoverTimeoutRef`, `savedCallback`, `lastEvaluationsRef`). This is excellent for React 19, which makes ref a regular prop and deprecates `forwardRef`.
- **No `React.lazy` or `Suspense`** -- search returned 0 results
- **No deprecated APIs**: No `findDOMNode`, `createFactory`, string refs, `this.refs`, `defaultProps` on functions, `propTypes`, `contextTypes`, or `childContextTypes`
- **No React 19 new hooks** yet: No `useId`, `useSyncExternalStore`, `useInsertionEffect`, `useDeferredValue`, `useTransition`

### Hook Usage Summary

| Hook              | Files Using It                                                                       |
| ----------------- | ------------------------------------------------------------------------------------ |
| `useState`        | BattleViewer.tsx, CharacterTooltip.tsx, PlayControls.tsx, RuleEvaluations.tsx        |
| `useEffect`       | App.tsx, PlayControls.tsx, useInterval.ts                                            |
| `useLayoutEffect` | CharacterTooltip.tsx (portal tooltip positioning)                                    |
| `useRef`          | BattleViewer.tsx, CharacterTooltip.tsx, PriorityTab.tsx, useInterval.ts              |
| `useCallback`     | Cell.tsx, BattleViewer.tsx                                                           |
| `useMemo`         | RuleEvaluations.tsx, Token.tsx, Grid.tsx, useWhiffIndicators.ts, useDamageNumbers.ts |
| `createPortal`    | CharacterTooltip.tsx                                                                 |

### Manual Memoization (React Compiler Targets)

These are candidates the React Compiler would auto-optimize:

1. **`/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx:347`** -- `useMemo` for `characterMap`
2. **`/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx:109`** -- `useMemo` for `letter` computation
3. **`/home/bob/Projects/auto-battler/src/components/BattleViewer/Grid.tsx:38`** -- `useMemo` for `viewBox` computation
4. **`/home/bob/Projects/auto-battler/src/components/BattleViewer/Grid.tsx:41`** -- `useMemo` for `allHexes` generation
5. **`/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.tsx:39`** -- `useCallback` for `handleClick`
6. **`/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.tsx:99`** -- `useCallback` for `handleBackgroundClick`
7. **`/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useWhiffIndicators.ts:30`** -- `useMemo` for whiff data transformation
8. **`/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useDamageNumbers.ts:37`** -- `useMemo` for damage number transformation

### Build Configuration

- **Vite config**: `/home/bob/Projects/auto-battler/vite.config.ts` -- uses `@vitejs/plugin-react` (Babel-based). The React Compiler is a Babel plugin that integrates into this same plugin.
- **TSConfig**: `"jsx": "react-jsx"` (automatic runtime) -- compatible with React 19
- **Lockfile**: npm (package-lock.json)

### ESLint Configuration

- **File**: `/home/bob/Projects/auto-battler/eslint.config.js` (flat config format)
- `eslint-plugin-react` v7.37.5 with `settings.react.version: '18.2'` -- needs update to `'19'` or `'detect'`
- `eslint-plugin-react-hooks` v5.2.0 -- React 19 requires a different approach: the React Compiler has its own ESLint plugin (`eslint-plugin-react-compiler`) that replaces the hooks plugin's exhaustive-deps rule
- `eslint-plugin-react-refresh` v0.5.0 -- should remain compatible

### Test Infrastructure

- **Test runner**: Vitest 4.0.18 with jsdom 23.2.0
- **Test setup**: `/home/bob/Projects/auto-battler/src/test/setup.ts` -- manual `cleanup()` after each test (React Testing Library 14.x pattern; RTL 15+ for React 19 has auto-cleanup)
- **Test count**: 150 test files, 1434 tests, all passing
- **`act()` usage**: Found in `/home/bob/Projects/auto-battler/src/components/PlayControls/PlayControls.test.tsx` (3 direct `act()` calls for timer-based state updates)
- **`act()` warning suppression**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/battle-viewer-tooltip.test.tsx` filters out `"not wrapped in act"` console warnings
- **`renderHook` usage**: 3 test files use `renderHook` from `@testing-library/react` (useInterval.test.ts, useWhiffIndicators.test.ts, useDamageNumbers.test.ts)
- **`defaultProps` pattern in tests**: Multiple test files use `const defaultProps = {...}` as a test utility pattern (not React's deprecated `Component.defaultProps`) -- this is safe and unaffected

## Relevant Files

### Core Files to Modify

- `/home/bob/Projects/auto-battler/package.json` - Update react, react-dom, @types/react, @types/react-dom, @testing-library/react versions; add react-compiler babel plugin
- `/home/bob/Projects/auto-battler/vite.config.ts` - Add React Compiler babel plugin to the @vitejs/plugin-react config
- `/home/bob/Projects/auto-battler/eslint.config.js` - Update react version setting, add eslint-plugin-react-compiler, potentially remove react-hooks exhaustive-deps
- `/home/bob/Projects/auto-battler/tsconfig.json` - Potentially update @types/react reference
- `/home/bob/Projects/auto-battler/src/main.tsx` - Verify createRoot compatibility (likely no changes needed)

### Files with Manual Memoization (Compiler Targets)

- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx` - useMemo
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx` - useMemo
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Grid.tsx` - 2x useMemo
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.tsx` - useCallback
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.tsx` - useCallback
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useWhiffIndicators.ts` - useMemo
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useDamageNumbers.ts` - useMemo

### Test Files Potentially Affected

- `/home/bob/Projects/auto-battler/src/test/setup.ts` - May need cleanup() changes for RTL 15+
- `/home/bob/Projects/auto-battler/src/components/PlayControls/PlayControls.test.tsx` - Uses act() directly
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/battle-viewer-tooltip.test.tsx` - Suppresses act() warnings
- All 3 `renderHook` test files - May need import path changes if RTL API changes

### Portal Usage

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.tsx` - Uses createPortal from react-dom (unchanged in React 19)

## Existing Patterns

- **Zustand selector pattern** - Components subscribe to store via selectors (`useGameStore(selectFoo)`). Zustand 4.5.7 supports React 19 (peerDep: react >=16.8). No changes needed.
- **CSS Modules** - No React version dependency. Unaffected.
- **Portal tooltip positioning** - Uses `useLayoutEffect` + `createPortal`. Both remain in React 19 unchanged.
- **Local state for UI** (ADR-004) - `useState`/`useRef` for transient UI state. Unchanged in React 19.
- **Custom hooks** - `useInterval` uses `useEffect` + `useRef`. Compatible with React 19.
- **Functional-only components** - No class components to migrate. Clean codebase.
- **Automatic JSX runtime** (`"jsx": "react-jsx"` in tsconfig) - Compatible with React 19.

## Dependencies

### Direct React Dependencies

- `react` and `react-dom` must be upgraded together to ^19.0.0
- `@types/react` and `@types/react-dom` must be upgraded to React 19-compatible versions (built into `react` in React 19 if using the `@types/react@npm:types-react@rc` approach, but standard `@types/react@19.x` is the stable path)

### Testing Library Chain

- `@testing-library/react` v14.x supports React 18. React 19 requires `@testing-library/react` v16+ (v15 added React 19 support, v16 is latest)
- `@testing-library/jest-dom` v6.x -- likely unchanged, no React dependency
- `@testing-library/user-event` v14.x -- likely unchanged, no direct React dependency

### Build Tool Chain

- `@vitejs/plugin-react` v4.7.0 -- already supports React 19 (peerDep: vite 4-7). The React Compiler babel plugin (`babel-plugin-react-compiler`) would be added as a Babel plugin option.
- `vite` v7.3.1 -- no direct React dependency, unaffected

### ESLint Chain

- `eslint-plugin-react-compiler` (new dependency) -- the React Compiler's ESLint plugin for validating rules of React
- `eslint-plugin-react-hooks` v5.2.0 -- should still work but compiler plugin may supersede some rules
- `eslint-plugin-react` v7.37.5 -- update `settings.react.version` from `'18.2'` to `'detect'` or `'19'`

## Constraints Discovered

1. **No deprecated API usage** -- The codebase is clean. No class components, no forwardRef, no string refs, no legacy context. This is an ideal migration candidate.

2. **Zustand compatibility** -- Zustand 4.5.7 has a permissive React peer dependency (>=16.8). No Zustand upgrade needed for React 19 itself.

3. **useLayoutEffect in CharacterTooltip** -- This hook still exists in React 19 but its behavior is unchanged. Portal-based tooltip positioning should work identically.

4. **act() usage in tests** -- React 19 improves `act()` behavior (auto-batching removes many cases where `act()` was needed). The 3 explicit `act()` calls in PlayControls.test.tsx may no longer be necessary, and the act() warning suppression in battle-viewer-tooltip.test.tsx may be removable.

5. **Test cleanup pattern** -- The manual `afterEach(() => { cleanup(); })` in setup.ts is a React Testing Library pattern. RTL v16 for React 19 may auto-cleanup, making this redundant but not harmful.

6. **React Compiler requirements** -- The React Compiler requires:
   - React 19
   - Babel-based build (already using `@vitejs/plugin-react` which is Babel-based)
   - No violation of the "Rules of React" (pure render functions, no mutations during render)

7. **Manual memoization (8 instances)** -- After the React Compiler is working, the 5 `useMemo` and 2 `useCallback` calls become redundant. They can be removed in a follow-up cleanup task (the compiler will simply skip them if they exist, so removal is optional for correctness).

8. **React 19 type changes** -- React 19 types remove implicit `children` from `React.FC`. This codebase does not use `React.FC` (components are plain functions with explicit props), so this is a non-issue.

9. **`@vitejs/plugin-react` vs `@vitejs/plugin-react-swc`** -- The current setup uses the Babel-based plugin, which is required for the React Compiler (it's a Babel plugin). SWC plugin would NOT work with the React Compiler. Current setup is correct.

## React 19 Breaking Changes Checklist

| Change                                   | Impact | Status                                               |
| ---------------------------------------- | ------ | ---------------------------------------------------- |
| `forwardRef` deprecated (ref is a prop)  | None   | No forwardRef usage found                            |
| Class component changes                  | None   | No class components                                  |
| `defaultProps` on functions deprecated   | None   | Not used on components                               |
| String refs removed                      | None   | Not used                                             |
| Legacy context removed                   | None   | Not used                                             |
| `findDOMNode` removed                    | None   | Not used                                             |
| `createFactory` removed                  | None   | Not used                                             |
| `act()` import from `react`              | Minor  | 3 uses in tests import from `@testing-library/react` |
| `React.FC` no longer includes `children` | None   | Not used                                             |
| `useRef` requires argument               | Check  | All useRef calls already pass arguments              |
| Cleanup functions in refs                | N/A    | New feature, no migration needed                     |

## Testing Impact

1. **`@testing-library/react` upgrade** -- Must go from v14 to v16+. API is largely stable; `render`, `screen`, `renderHook`, `cleanup`, `waitFor` should all work. But the import of `act` may change (React 19 re-exports it from `react` directly).

2. **`act()` behavior** -- React 19's auto-batching may eliminate some act() wrapping needs. The 3 explicit act() calls in PlayControls.test.tsx (for `vi.advanceTimersByTime`) may need testing.

3. **StrictMode double-rendering** -- React 19 continues strict mode double-rendering in dev but with some changes to effect cleanup. Need to verify useInterval hook behavior under React 19 strict mode.

4. **Console warning suppression** -- The act() warning filter in battle-viewer-tooltip.test.tsx may no longer trigger (React 19 may not produce these warnings). Harmless if left in place.

5. **Baseline**: 150 test files, 1434 tests, all passing. This is the validation target.

## Open Questions

1. **Should manual memoization be removed after React Compiler adoption?** -- The compiler can coexist with explicit useMemo/useCallback (it skips already-memoized values). Removing them is a cosmetic cleanup, not a functional requirement. Recommend deferring to a follow-up task.

2. **React 19 types package approach** -- Should we use `@types/react@19.x` (standard) or the new built-in types? Standard `@types/react` v19 is the safer path.

3. **Should the `act()` warning suppression be cleaned up as part of this migration?** -- It is harmless if left, but React 19 may not produce these warnings. Could be cleaned up in a follow-up.

4. **Zustand middleware compatibility** -- While Zustand 4.5.7 supports React >=16.8, should we verify the immer middleware specifically under React 19 strict mode double-rendering? (Likely fine since the game engine is pure logic, but worth a smoke test.)

5. **Should we update `eslint-plugin-react-hooks` or replace it with `eslint-plugin-react-compiler`?** -- The React Compiler plugin provides stronger validation. The hooks plugin is still useful for non-compiler projects. Recommend adding the compiler plugin alongside the existing hooks plugin.

6. **Phase strategy** -- Should this be done as a single task (upgrade React 19 + add compiler) or two separate tasks? Recommend two phases: (1) React 19 upgrade with all tests passing, (2) React Compiler adoption as a separate task. This isolates potential issues.

## Recommended Approach (Order of Operations)

### Phase 1: React 19 Upgrade

1. Update `react`, `react-dom` to ^19.0.0
2. Update `@types/react`, `@types/react-dom` to React 19-compatible versions
3. Update `@testing-library/react` to v16+
4. Update `eslint.config.js` react version setting to `'detect'`
5. Run `npm install` to resolve dependency tree
6. Run full test suite -- fix any failures
7. Run `npm run build` -- verify production build
8. Run `npm run lint` -- fix any new warnings

### Phase 2: React Compiler Adoption

1. Install `babel-plugin-react-compiler` and `eslint-plugin-react-compiler`
2. Add compiler babel plugin to `vite.config.ts` plugin-react config
3. Add compiler ESLint plugin to `eslint.config.js`
4. Run full test suite -- compiler should not change behavior
5. (Optional follow-up) Remove redundant useMemo/useCallback calls
