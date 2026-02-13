# Implementation Plan: Zustand DevTools Middleware

## Overview

Add `devtools` middleware from `zustand/middleware` to the existing `useGameStore`, label all 18 `set()` calls with action name strings, and create a root `README.md`. Dev-only, zero production impact, non-UI task.

## Spec Alignment Checklist

- [x] Plan aligns with `.docs/spec.md` requirements (command pattern already documented; devtools complements it)
- [x] Approach consistent with `.docs/architecture.md` (Zustand + Immer middleware stack)
- [x] Patterns follow `.docs/patterns/index.md` (no new visual/UI patterns needed)
- [x] No conflicts with `.docs/decisions/index.md` (no ADR contradicts this addition)
- [x] UI tasks: N/A (non-UI task)

## Files to Modify

| File                                                                    | Action | Description                                                         |
| ----------------------------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| `/home/bob/Projects/auto-battler/src/stores/gameStore.ts`               | MODIFY | Add devtools import, wrap store, add action names to 18 set() calls |
| `/home/bob/Projects/auto-battler/src/stores/gameStore-devtools.test.ts` | CREATE | Smoke test for devtools middleware integration                      |
| `/home/bob/Projects/auto-battler/README.md`                             | CREATE | Project README with install/run/debugging instructions              |

No other files require changes. The `GameStore` type in `gameStore-types.ts` does NOT need modification -- zustand's type system handles the devtools mutator chain transparently via `StoreMutatorIdentifier`.

## Deliverable 1: Wrap Store with DevTools Middleware

### Import Change

Add import of `devtools` from `zustand/middleware` at line 10 (alongside existing `immer` import from `zustand/middleware/immer`):

```typescript
import { devtools } from "zustand/middleware";
```

Note: `devtools` is exported from `zustand/middleware`, NOT `zustand/middleware/devtools`. Verified in `node_modules/zustand/middleware.d.ts`.

### Store Creation Change

Current (line 98-99):

```typescript
export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
```

Target:

```typescript
export const useGameStore = create<GameStore>()(
  devtools(
    immer((set, get) => ({
```

And the closing bracket changes from:

```typescript
  })),
);
```

to:

```typescript
    })),
    { name: 'curly-couscous', enabled: import.meta.env.DEV },
  ),
);
```

### Middleware Ordering Rationale

`devtools(immer(...))` -- devtools wraps immer so it observes the final produced state (after Immer's `produce`), not the draft proxy. This is the zustand-recommended ordering.

### Type Safety

The curried `create<GameStore>()` form works with the devtools+immer middleware chain. Zustand's type system chains `StoreMutatorIdentifier` entries: `['zustand/devtools', never]` and `['zustand/immer', never]`. The `GameStore` interface is preserved. The only type-level change is that `setState` gains an optional third parameter for action names -- this is additive and backward-compatible.

### import.meta.env.DEV Behavior

- Vite: `true` in dev, `false` in production builds (dead-code eliminated)
- Vitest: `true` during test runs (Vitest extends Vite's env)
- When `enabled: true` but no Redux DevTools extension is connected (test environment), the middleware is a no-op passthrough
- First usage of `import.meta.env` in this codebase; no config changes needed

## Deliverable 2: Action Name Strings for All 18 set() Calls

Each `set()` call gets two additional arguments: `false` (replace flag, preserves merge behavior) and the action name string matching the enclosing method name.

### Transformation Pattern

**Simple set() calls (15 calls):**

Before: `set((state) => { ... })`
After: `set((state) => { ... }, false, 'methodName')`

**Boolean-return methods (3 calls: `addCharacter`, `addCharacterAtPosition`, `moveCharacter`):**

Same transformation. These methods use `let success; set(...); return success;` -- only the `set()` call arguments change.

### Complete Set Call Inventory (18 calls)

| #   | Line | Method Name                | Action Name String           |
| --- | ---- | -------------------------- | ---------------------------- |
| 1   | 115  | `initBattle`               | `'initBattle'`               |
| 2   | 144  | `nextTick`                 | `'nextTick'`                 |
| 3   | 154  | `processTick`              | `'processTick'`              |
| 4   | 182  | `updateCharacter`          | `'updateCharacter'`          |
| 5   | 190  | `addEvent`                 | `'addEvent'`                 |
| 6   | 195  | `reset`                    | `'reset'`                    |
| 7   | 218  | `selectCharacter`          | `'selectCharacter'`          |
| 8   | 223  | `updateSkill`              | `'updateSkill'`              |
| 9   | 238  | `moveSkillUp`              | `'moveSkillUp'`              |
| 10  | 257  | `moveSkillDown`            | `'moveSkillDown'`            |
| 11  | 276  | `assignSkillToCharacter`   | `'assignSkillToCharacter'`   |
| 12  | 315  | `removeSkillFromCharacter` | `'removeSkillFromCharacter'` |
| 13  | 351  | `duplicateSkill`           | `'duplicateSkill'`           |
| 14  | 404  | `addCharacter`             | `'addCharacter'`             |
| 15  | 456  | `removeCharacter`          | `'removeCharacter'`          |
| 16  | 479  | `setSelectionMode`         | `'setSelectionMode'`         |
| 17  | 485  | `addCharacterAtPosition`   | `'addCharacterAtPosition'`   |
| 18  | 538  | `moveCharacter`            | `'moveCharacter'`            |

Each method has exactly one `set()` call. No ambiguity in naming.

### Implementation Notes

- The `false` second argument is the `replace` flag. When omitted, Zustand defaults to `false` (merge). It must be explicitly passed to use the third argument (action name).
- Without devtools middleware, the third argument would be silently ignored. With devtools, it labels the action in the Redux DevTools timeline.
- Line numbers are approximate and may shift by 1-2 lines after the devtools wrapper is added at the top of the store creation.

## Deliverable 3: README.md

Create `/home/bob/Projects/auto-battler/README.md` with:

1. **Project name**: Auto-Battler (or the repo name)
2. **One-line description**: A turn-based auto-battler game built with React and TypeScript
3. **Getting Started**: `npm install`, `npm run dev`
4. **Debugging section**: How to use Redux DevTools
   - Install the Redux DevTools browser extension
   - Open browser DevTools, find the "Redux" tab
   - Look for the store named `curly-couscous`
   - Mentions: time-travel debugging, action history with diffs, state tree inspection

Keep it minimal per requirements. No need to duplicate `.docs/` content.

## Test Strategy

### New Test: Smoke Test (1 test)

**File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-devtools.test.ts`

**Rationale for dedicated file**: Project pattern splits test files by concern (20 existing test files for the store). A dedicated devtools file is consistent with this convention.

**Test**: "store is created successfully with devtools middleware"

- Verify `useGameStore` exists and is callable
- Verify `getState()` returns an object with the expected shape (has `gameState`, `actions`)
- Verify basic action still works (e.g., `actions.selectCharacter(null)` does not throw)
- This proves the devtools+immer middleware chain is correctly configured

### Existing Tests (20 files -- must pass unchanged)

All 20 existing test files must pass without modification:

1. `/home/bob/Projects/auto-battler/src/stores/gameStore-integration.test.ts`
2. `/home/bob/Projects/auto-battler/src/stores/gameStore-characters.test.ts`
3. `/home/bob/Projects/auto-battler/src/stores/gameStore-debug-ui.test.ts`
4. `/home/bob/Projects/auto-battler/src/stores/gameStore-helpers.test.ts`
5. `/home/bob/Projects/auto-battler/src/stores/gameStore-reset.test.ts`
6. `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-default-skills.test.ts`
7. `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-evaluations.test.ts`
8. `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-faction-skills.test.ts`
9. `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-intent-filter.test.ts`
10. `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-intent-preview.test.ts`
11. `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-intent-targeting.test.ts`
12. `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-intent-ticks.test.ts`
13. `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-movement-intent.test.ts`
14. `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-movement-target.test.ts`
15. `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-movement-trigger.test.ts`
16. `/home/bob/Projects/auto-battler/src/stores/gameStore-skills-duplication.test.ts`
17. `/home/bob/Projects/auto-battler/src/stores/gameStore-skills-faction-exclusivity.test.ts`
18. `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
19. `/home/bob/Projects/auto-battler/src/stores/gameStore-slotPosition.test.ts`
20. `/home/bob/Projects/auto-battler/src/stores/accessibilityStore.test.ts`

The devtools middleware is transparent in test environments (no Redux DevTools extension present, acts as passthrough). The `false` replace argument preserves existing merge behavior. No test should need changes.

## Risks and Mitigations

| Risk                                        | Likelihood | Impact | Mitigation                                                                                                                                                                  |
| ------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type inference breaks with devtools layer   | Low        | Medium | Zustand 4.5.7 has well-tested devtools types with curried `create`. Verified type definitions in `node_modules`.                                                            |
| `import.meta.env.DEV` unavailable in tests  | Very Low   | Low    | Vitest natively supports `import.meta.env`. No existing usage in codebase, but Vite 7.3 config is already set up.                                                           |
| Existing tests fail after middleware change | Very Low   | High   | Devtools middleware is a documented no-op when extension is absent. Run full test suite after implementation.                                                               |
| File size of gameStore.ts increases         | Certain    | Low    | File already exceeds 400-line limit (581 lines, has eslint-disable). Adding ~20 lines (wrapper + action names) is marginal. Existing TODO to extract skill actions remains. |

## Implementation Order

1. Add `devtools` import to `gameStore.ts`
2. Wrap `immer(...)` with `devtools(...)` and configuration options
3. Add `false, 'actionName'` arguments to all 18 `set()` calls
4. Run `npm run type-check` to verify type safety
5. Run `npm run test` to verify all existing tests pass
6. Create smoke test in `gameStore-devtools.test.ts`
7. Run `npm run test` again to verify smoke test passes
8. Create `README.md` at project root
9. Run `npm run lint` and `npm run format` for code quality

## New Decision

No new architectural decision record needed. This is a standard middleware addition following zustand's documented API. The architecture doc already mentions "Command Pattern: State mutations via named actions for history/undo support" -- devtools middleware is a natural complement to this existing pattern.
