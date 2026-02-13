# Test Designs: Zustand DevTools Middleware Integration

## Overview

This document specifies tests for adding `devtools` middleware to `useGameStore`. The plan calls for a single dedicated test file: `src/stores/gameStore-devtools.test.ts`. Tests are scoped to three concerns: (1) the devtools middleware integration itself (smoke test), (2) action name labeling on `set()` calls, and (3) confirmation that existing store behavior is unaffected.

The devtools middleware is a no-op in the test environment (jsdom/Node, no Redux DevTools extension connected). Tests cannot verify actual Redux DevTools communication. Instead, they verify the middleware does not break store creation, state shape, or action execution.

---

### Test: store is created and returns correct state shape

- **File**: `src/stores/gameStore-devtools.test.ts`
- **Type**: integration
- **Verifies**: The `useGameStore` hook, after being wrapped with `devtools(immer(...))`, is callable and returns a state object matching the `GameStore` interface shape.
- **Setup**: Import `useGameStore` from `./gameStore`. No mocks needed. Call `useGameStore.getState().actions.reset()` in `beforeEach` per project convention.
- **Assertions**:
  1. `useGameStore.getState()` is not null/undefined (store was created successfully)
  2. `useGameStore.getState().gameState` is an object (top-level state slice exists)
  3. `useGameStore.getState().gameState.tick` is a number (nested state property accessible)
  4. `useGameStore.getState().gameState.characters` is an array (nested state property accessible)
  5. `useGameStore.getState().actions` is an object (actions namespace exists)
  6. `useGameStore.getState().selectedCharacterId` is `null` (initial UI state correct)
  7. `useGameStore.getState().selectionMode` is `'idle'` (initial UI state correct)
- **Justification**: This is the primary smoke test required by the acceptance criteria ("one integration test verifies the store is created successfully with devtools middleware"). If the middleware wrapping breaks the store creation (wrong argument order, type mismatch, or runtime error), this test catches it immediately. Checking multiple state shape properties proves the middleware is transparent and the full state tree is accessible.

---

### Test: actions execute without errors through devtools middleware

- **File**: `src/stores/gameStore-devtools.test.ts`
- **Type**: integration
- **Verifies**: Store actions can be called through the devtools middleware layer without throwing, and state updates correctly.
- **Setup**: Import `useGameStore` from `./gameStore` and `createCharacter` from `./gameStore-test-helpers`. Call `actions.reset()` in `beforeEach`.
- **Assertions**:
  1. Calling `actions.selectCharacter(null)` does not throw
  2. After calling `actions.addCharacter('friendly')`, the characters array length increases by 1
  3. After adding a character and calling `actions.reset()`, the state returns to initial shape (`gameState.characters` is empty, `gameState.tick` is 0)
- **Justification**: The smoke test above only verifies state shape at rest. This test exercises the `set()` call path through the devtools middleware. If the devtools middleware incorrectly intercepts `set()` calls (e.g., swallows the state update or throws on the action name argument), this test catches it. Tests a chain of actions to verify state mutation round-trips through `devtools(immer(...))`.

---

### Test: all 18 set() calls include action name strings

- **File**: `src/stores/gameStore-devtools.test.ts`
- **Type**: unit
- **Verifies**: Every `set()` call in `gameStore.ts` passes a third argument (the action name string) so that Redux DevTools shows descriptive labels instead of "anonymous".
- **Setup**: Read the source of `gameStore.ts` at test time via `fs.readFileSync`. This is a static code analysis test, not a runtime behavior test. Import `readFileSync` from `node:fs`, `resolve` and `dirname` from `node:path`, and `fileURLToPath` from `node:url`. Locate the file using `resolve(dirname(fileURLToPath(import.meta.url)), 'gameStore.ts')` (not `__dirname`, which is unavailable in ESM/Vitest).
- **Assertions**:
  1. Count all occurrences of the pattern `set((state)` in the source file -- should be exactly 18
  2. Count all occurrences of the pattern `false, '` followed by an identifier and `')` (i.e., the action name argument pattern `false, 'someActionName')`) -- should also be exactly 18. This is simpler and more robust than trying to match the full multiline `set()` call because the callback body spans many lines. The `false, 'actionName')` pattern only appears in `set()` call closings and is sufficient to verify the action name argument is present.
  3. Assert counts from (1) and (2) are equal, confirming all `set()` calls have action names and none are anonymous.
- **Justification**: Action name labeling is a key acceptance criterion ("All 18 set() calls pass an action name as the third argument"). Without this test, a developer could add a new `set()` call without an action name, and it would silently appear as "anonymous" in DevTools. This static analysis test creates a regression guard. Using source code analysis is appropriate because verifying action name passthrough at runtime would require mocking the Redux DevTools extension, which adds complexity without value -- the middleware simply forwards the string.

---

### Test: devtools middleware is configured with correct store name

- **File**: `src/stores/gameStore-devtools.test.ts`
- **Type**: unit
- **Verifies**: The devtools middleware configuration includes `name: 'curly-couscous'` as required by the acceptance criteria.
- **Setup**: Same source file reading setup as the action name tests (read `gameStore.ts` as text).
- **Assertions**:
  1. The source contains the string `name: 'curly-couscous'` (or `name: "curly-couscous"`) -- verifying the store is identifiable in Redux DevTools
- **Justification**: The acceptance criterion explicitly requires "DevTools middleware is configured with `name: 'curly-couscous'` for identification." Without this test, the store name could be changed or omitted and the error would only be caught by manual browser inspection. This is a simple one-line source analysis check that complements the existing source analysis tests.

---

### Test: action names match their enclosing method names

- **File**: `src/stores/gameStore-devtools.test.ts`
- **Type**: unit
- **Verifies**: Each action name string passed to `set()` matches the method name it appears in (e.g., the `set()` inside `initBattle` uses `'initBattle'`, not some other string).
- **Setup**: Same source file reading setup as above. Parse the source to extract method-name/action-name pairs.
- **Assertions**:
  1. For each of the 18 known methods (`initBattle`, `nextTick`, `processTick`, `updateCharacter`, `addEvent`, `reset`, `selectCharacter`, `updateSkill`, `moveSkillUp`, `moveSkillDown`, `assignSkillToCharacter`, `removeSkillFromCharacter`, `duplicateSkill`, `addCharacter`, `removeCharacter`, `setSelectionMode`, `addCharacterAtPosition`, `moveCharacter`), the action name string in the corresponding `set()` call matches the method name exactly
- **Justification**: The acceptance criteria state "Action names match the method name they appear in." A mismatch (e.g., pasting a `set()` call from one method into another and forgetting to update the name) would produce misleading DevTools output. This test makes that class of copy-paste error detectable.

---

### Test: devtools middleware does not break existing store contract (selective action verification)

- **File**: `src/stores/gameStore-devtools.test.ts`
- **Type**: integration
- **Verifies**: A representative cross-section of store actions still produce correct state transitions with the devtools middleware wrapping.
- **Setup**: Import `useGameStore` from `./gameStore`, `createCharacter` and `createSkill` from `./gameStore-test-helpers`. Call `actions.reset()` in `beforeEach`.
- **Assertions**:
  1. `initBattle` with two characters sets `gameState.characters` length to 2 and `battleStatus` to `'active'`
  2. `processTick` after `initBattle` increments `gameState.tick` by 1
  3. `selectCharacter('char1')` sets `selectedCharacterId` to `'char1'`
  4. `selectCharacter(null)` sets `selectedCharacterId` back to `null`
  5. `setSelectionMode('placing-friendly')` sets `selectionMode` to `'placing-friendly'`
- **Justification**: While the 20 existing test files exercise the full store contract (and the plan requires all to pass unchanged), this test provides a focused regression guard specifically in the devtools test file. If someone were to run only this file (e.g., during development), it would still catch middleware-induced breakage in common state transitions. The test exercises different action categories (battle lifecycle, UI state, selection) to ensure the devtools middleware does not selectively interfere with any category.

---

## Test File Structure

```
src/stores/gameStore-devtools.test.ts
  describe('DevTools Middleware Integration')
    it('store is created and returns correct state shape')
    it('actions execute without errors through devtools middleware')
  describe('Action Name Labeling')
    it('all 18 set() calls include action name strings')
    it('devtools middleware is configured with correct store name')
    it('action names match their enclosing method names')
  describe('Middleware Transparency')
    it('devtools middleware does not break existing store contract')
```

## Notes for Implementation

1. **No mocking of Redux DevTools**: The devtools middleware gracefully handles the absence of the browser extension. In jsdom/Node, `window.__REDUX_DEVTOOLS_EXTENSION__` is undefined, so the middleware acts as a pure passthrough. No mock is needed.

2. **Source file analysis tests**: Tests 3, 4, and 5 read `gameStore.ts` as a text file. This is a pragmatic approach because:
   - Verifying action names at runtime would require intercepting the internal devtools communication channel
   - Source analysis directly verifies the developer-facing requirement (strings present in code)
   - The regex patterns should be robust but not over-engineered -- match `false, 'methodName')` at line endings rather than trying to span the full multiline `set()` call
   - **ESM compatibility**: Use `import.meta.url` with `fileURLToPath`/`dirname` to resolve file paths, not `__dirname` (which is unavailable in ESM/Vitest)

3. **Existing test suite**: The plan explicitly requires all 20 existing test files to pass without modification. This is verified by running `npm run test` during implementation, not by a specific test case. The existing tests serve as the comprehensive regression suite; these new tests focus on devtools-specific concerns.

4. **`import.meta.env.DEV`**: In Vitest, this is `true`, so the devtools middleware will be "enabled" during tests. However, without the extension connected, it is a no-op passthrough. No test needs to verify this value.
