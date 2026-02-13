# Exploration Findings

## Task Understanding

Add Zustand DevTools middleware to the existing game store (`useGameStore`) to enable Redux DevTools browser extension integration. Three deliverables: (1) wrap `immer(...)` with `devtools(...)`, (2) add action name strings to all 18 `set()` calls, (3) create a root `README.md` with debugging instructions.

## Relevant Files

### Primary (will be modified)

- `/home/bob/Projects/auto-battler/src/stores/gameStore.ts` - The store file. Currently uses `create<GameStore>()(immer((set, get) => ({...})))`. Contains 18 `set()` calls, none of which currently pass an action name string. Needs `devtools` import from `zustand/middleware` and wrapping. Line 98: store creation. Line 9-10: existing imports.
- `/home/bob/Projects/auto-battler/README.md` - Does NOT exist yet. Must be created with project info and debugging section.

### Types and Supporting Modules

- `/home/bob/Projects/auto-battler/src/stores/gameStore-types.ts` - `GameStore` interface (87 lines). Defines all action signatures. No changes needed unless type inference breaks with devtools layer.
- `/home/bob/Projects/auto-battler/src/stores/gameStore-constants.ts` - `initialGameState`, `MAX_SKILL_SLOTS`, `HEX_RADIUS`, `positionKey`, `getNextCharacterIdCounter`. No changes needed.
- `/home/bob/Projects/auto-battler/src/stores/gameStore-helpers.ts` - `findNextAvailablePosition`, `calculateBattleStatus`. No changes needed.
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors.ts` - All selector functions. No changes needed.
- `/home/bob/Projects/auto-battler/src/stores/gameStore-test-helpers.ts` - `createCharacter`, `createSkill` test helpers.

### Test Files (20 files - must all pass unchanged)

- `/home/bob/Projects/auto-battler/src/stores/gameStore-integration.test.ts` - Engine-store integration tests. The new devtools smoke test could be added here or in a new dedicated file.
- `/home/bob/Projects/auto-battler/src/stores/gameStore-characters.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-debug-ui.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-helpers.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-reset.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-default-skills.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-evaluations.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-faction-skills.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-intent-filter.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-intent-preview.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-intent-targeting.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-intent-ticks.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-movement-intent.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-movement-target.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-movement-trigger.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-skills-duplication.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-skills-faction-exclusivity.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-slotPosition.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/accessibilityStore.test.ts`

### Package Config

- `/home/bob/Projects/auto-battler/package.json` - zustand `^4.5.7`, immer `^10.2.0`. No additional dependencies needed (`devtools` is part of `zustand/middleware`).

## Existing Patterns

### Store Creation Pattern

Current pattern (line 98-99 of `gameStore.ts`):

```typescript
export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // ...state and actions
  })),
);
```

Target pattern:

```typescript
export const useGameStore = create<GameStore>()(
  devtools(
    immer((set, get) => ({
      // ...state and actions
    })),
    { name: "curly-couscous", enabled: import.meta.env.DEV },
  ),
);
```

### Import Pattern

Current: `import { immer } from "zustand/middleware/immer";`
New: `import { devtools } from "zustand/middleware";` (note: `devtools` is at `zustand/middleware`, NOT `zustand/middleware/devtools`)

### set() Call Inventory (18 calls, all in gameStore.ts)

Each `set()` call needs a third argument: action name string. The `set()` signature with devtools becomes `set(fn, replace?, actionName?)`.

| #   | Line | Method Name                | Action Name to Add           |
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

### set() Call Signatures

Two patterns exist:

1. **Simple (15 calls):** `set((state) => { ... })` -- needs `set((state) => { ... }, false, 'actionName')`
2. **Boolean-return (3 calls):** `addCharacter`, `addCharacterAtPosition`, `moveCharacter` use `let success; set((state) => { ... }); return success;` -- same change, just add `false, 'actionName'` args.

The second argument (`false`) is the "replace" flag; `false` means merge (default behavior, same as omitting it). It must be explicitly passed when using the third argument.

### Command Pattern (Architecture)

Architecture doc notes "Command Pattern: State mutations via named actions for history/undo support." DevTools middleware directly complements this by exposing these actions in the Redux DevTools timeline.

## Dependencies

- `zustand` `^4.5.7` (already installed) - `devtools` exported from `zustand/middleware`
- Vite `import.meta.env.DEV` for dev-gating (already used by the project via Vite 7.3)
- No new npm packages needed

## Applicable Lessons

- **Lesson 005** - "Tests masking bugs with aligned state" - Marginally relevant: the existing test suite manually constructs state. The middleware should be transparent, but this lesson reminds us to verify tests still exercise real store behavior rather than bypassing the middleware layer.
- No other lessons directly apply (this is a middleware/tooling task, not UI/specification/pathfinding).

## Constraints Discovered

1. **Middleware ordering:** `devtools` MUST wrap `immer`, not vice versa. The zustand docs and type definitions confirm this pattern: `devtools(immer(...))`. This is because devtools needs to see the final (produced) state, not the draft.

2. **TypeScript generics:** The `create<GameStore>()` call uses the curried form. With devtools added, the type parameter should still work because zustand's type system uses `StoreMutatorIdentifier` chaining. The devtools type definition (`middleware/devtools.d.ts`) shows it preserves the inner type `T` and just adds `WithDevtools<S>` to `setState`. No changes to `GameStore` interface expected.

3. **`set()` third argument:** The devtools middleware modifies `set` to accept an optional third argument (action name string or `{type: string}` object). Without devtools, the third argument is silently ignored by immer's `set`. With devtools, it labels the action in the timeline.

4. **Test environment:** Redux DevTools extension will not be present in the test environment (jsdom/Node). The `devtools` middleware gracefully handles this -- when no extension is detected (or `enabled: false`), it acts as a passthrough. All 20+ existing test files should pass without modification.

5. **File line limit:** `gameStore.ts` is currently 581 lines (already has an eslint-disable for `max-lines`). Adding devtools wrapper and action name strings will add ~20 lines. The file already exceeds the 400-line project limit with an existing TODO comment to extract skill actions.

6. **`import.meta.env.DEV` in tests:** Vitest supports `import.meta.env.DEV` and it is `true` during test runs. The devtools middleware will be "enabled" in tests, but without the extension connected, it is a no-op.

## DevTools Type Signature Reference

From `node_modules/zustand/middleware/devtools.d.ts`:

```typescript
export interface DevtoolsOptions extends Config {
  name?: string;
  enabled?: boolean;
  anonymousActionType?: string;
  store?: string;
}

export declare const devtools: Devtools;
// Devtools type wraps StateCreator and adds ['zustand/devtools', never] to mutator chain
```

The `setState` is augmented to accept an optional action name:

```typescript
setState<A extends string | { type: string }>(...a: [...a: TakeTwo<Sa>, action?: A]): Sr;
```

## Open Questions

1. **Smoke test location:** Should the devtools integration smoke test go in the existing `gameStore-integration.test.ts` or a new `gameStore-devtools.test.ts` file? The requirements say "one integration test verifies the store is created successfully with devtools middleware." Given the project's pattern of splitting test files by concern, a dedicated file may be cleaner.

2. **Action name for boolean-return methods:** The `addCharacter`, `addCharacterAtPosition`, and `moveCharacter` methods each have a single `set()` call. The action name should just be the method name (e.g., `'addCharacter'`). No ambiguity here since each method has exactly one `set()` call.

3. **README.md content scope:** Requirements specify minimal content: project name, one-line description, install/run instructions, and a "Debugging" section. Should it reference any other project docs or keep it minimal? The requirements are clear -- keep it minimal.
