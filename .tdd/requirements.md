# TDD Spec: Add Zustand DevTools Middleware

Created: 2026-02-13

## Goal

Wrap the existing Zustand game store with `devtools` middleware to enable Redux DevTools browser extension integration. This provides state tree inspection, action history with diffs, and time-travel debugging — complementing the project's existing command pattern architecture. Dev-only; zero impact on production.

## Acceptance Criteria

- [ ] `useGameStore` is wrapped with `devtools` middleware in the correct order: `devtools(immer(...))`
- [ ] DevTools middleware is configured with `name: 'curly-couscous'` for identification
- [ ] DevTools middleware is gated to dev mode only via `enabled: import.meta.env.DEV`
- [ ] All existing store tests pass without modification (middleware is transparent)
- [ ] Type safety is preserved — `GameStore` type works correctly with the added middleware layer
- [ ] One integration test verifies the store is created successfully with devtools middleware (smoke test)
- [ ] All 18 `set()` calls in `gameStore.ts` pass an action name as the third argument (e.g., `set(fn, false, 'initBattle')`) so actions appear with descriptive labels in the DevTools timeline instead of "anonymous"
- [ ] Action names match the method name they appear in (e.g., `processTick`, `addCharacter`, `removeCharacter`)
- [ ] A `README.md` exists at the project root with: project name, one-line description, how to install and run (`npm install`, `npm run dev`), and a "Debugging" section explaining how to access state via Redux DevTools (install extension, open DevTools, find the "curly-couscous" store, mentions time-travel and action diffs)

## Approach

Three deliverables in `src/stores/gameStore.ts` and project root: (1) import `devtools` from `zustand/middleware` and wrap the existing `immer(...)` call with `devtools(...)` with config options; (2) add action name strings to all `set()` calls so the DevTools timeline shows descriptive labels; (3) create a minimal `README.md` with setup and debugging instructions.

## Scope Boundaries

- In scope: Adding `devtools` middleware wrapper to `useGameStore` in `gameStore.ts`
- In scope: Adding action name arguments to all `set()` calls in the store
- In scope: Creating a minimal `README.md` with debugging instructions
- Out of scope: In-app debug panel, custom state logging, or any UI changes

## Assumptions

- `zustand/middleware` exports `devtools` (it does — same package, no additional install needed)
- `import.meta.env.DEV` is available via Vite and is `true` in dev, `false` in production builds
- Redux DevTools browser extension is the user's responsibility to install

## Constraints

- Middleware ordering must be `devtools(immer(...))` — devtools must wrap immer, not the reverse, so devtools sees the final state after Immer produces it
- No runtime cost in production (`enabled: false` means the middleware is a no-op)
