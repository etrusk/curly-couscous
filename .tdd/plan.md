# Implementation Plan: Vitest Browser Mode for SVG/Component Test Subset

## Summary

Configure a Vitest workspace with two projects -- `unit` (jsdom, existing tests) and `browser` (Playwright, new browser-mode tests) -- to enable real DOM/SVG rendering for tooltip positioning tests. Start with infrastructure and a single proof-of-concept browser test, then create new `.browser.test.tsx` files for the 3 tooltip test files that benefit most from real `getBoundingClientRect`.

## Decision: Keep Existing Tests, Add Browser Variants Alongside

**Decision**: Create new `.browser.test.tsx` files alongside existing jsdom tests rather than migrating them.

**Context**: The existing jsdom tests validate content, ARIA, callbacks, and mocked positioning. They run fast (~14s for all 1448 tests) and provide regression coverage. Browser tests are slower and primarily add value for layout/positioning verification that jsdom cannot provide (real `getBoundingClientRect`, real `getComputedStyle`).

**Consequences**: Slight test count increase, but clear separation of concerns. jsdom tests remain the fast feedback loop. Browser tests validate visual correctness. The jsdom workaround in `CharacterTooltip.tsx` (lines 255-256, zero-rect fallback) should NOT be removed yet -- it stays until browser tests prove the positioning works without it, at which point a follow-up task can remove it.

---

## Step 1: Install Dependencies

**Files**: `package.json`, `package-lock.json`

Install `@vitest/browser` and `playwright` as dev dependencies:

```bash
npm install --save-dev @vitest/browser playwright
```

- `@vitest/browser` is the Vitest 4.x browser mode provider
- `playwright` provides the Chromium browser engine
- After install, run `npx playwright install chromium` to download the browser binary

**Verification**: `npx playwright install chromium` exits cleanly.

## Step 2: Create Vitest Workspace Configuration

**Files to create**: `/home/bob/Projects/auto-battler/vitest.workspace.ts`

**Files to modify**: `/home/bob/Projects/auto-battler/vite.config.ts` (remove `test` block)

### 2a. Create `vitest.workspace.ts`

Define two projects:

```typescript
// vitest.workspace.ts
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    // Unit tests - jsdom (existing behavior, unchanged)
    extends: "./vite.config.ts",
    test: {
      name: "unit",
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      include: ["src/**/*.test.{ts,tsx}"],
      exclude: ["node_modules", ".archive", "src/**/*.browser.test.{ts,tsx}"],
    },
  },
  {
    // Browser tests - Playwright (new, targets tooltip/SVG positioning)
    extends: "./vite.config.ts",
    test: {
      name: "browser",
      globals: true,
      setupFiles: "./src/test/setup.browser.ts",
      css: true,
      include: ["src/**/*.browser.test.{ts,tsx}"],
      browser: {
        enabled: true,
        provider: "playwright",
        instances: [{ browser: "chromium" }],
      },
    },
  },
]);
```

Key design choices:

- Both projects extend `vite.config.ts` to inherit React plugin, CSS modules, and React Compiler config
- Unit project explicitly excludes `*.browser.test.*` files
- Browser project only includes `*.browser.test.*` files
- Convention-based file naming provides clear separation

### 2b. Remove `test` block from `vite.config.ts`

Remove lines 19-25 from `vite.config.ts` (the `test: { ... }` block). The workspace config now owns all test configuration. The `vite.config.ts` keeps only build-related config (plugins, css modules).

**Risk**: If `test` block remains alongside workspace config, Vitest may log warnings or exhibit undefined behavior. The workspace config must be the sole source of test configuration.

## Step 3: Create Browser-Mode Test Setup File

**File to create**: `/home/bob/Projects/auto-battler/src/test/setup.browser.ts`

The browser setup file differs from the jsdom setup in two ways:

1. No `window.matchMedia` mock (browser has native `matchMedia`)
2. Still imports `@testing-library/jest-dom` for DOM matchers
3. Still calls `cleanup()` after each test

```typescript
// src/test/setup.browser.ts
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// No matchMedia mock needed - real browser has native matchMedia

// Cleanup after each test case
afterEach(() => {
  cleanup();
});
```

## Step 4: Update TypeScript Configuration

**File to modify**: `/home/bob/Projects/auto-battler/tsconfig.json`

Add `@vitest/browser/providers/playwright` to the `types` array so browser-mode test files get correct type checking:

```json
"types": ["vite/client", "vitest/globals", "@testing-library/jest-dom", "@vitest/browser/providers/playwright"]
```

Note: Vitest 4.x browser mode may require additional type setup. Check `@vitest/browser` docs for exact type import path. If the types conflict with jsdom globals, a separate `tsconfig.browser.json` may be needed -- but try the simple approach first.

## Step 5: Create Proof-of-Concept Browser Test

**File to create**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.browser.test.tsx`

This file contains a focused subset of the CharacterTooltip positioning tests that specifically validate real browser behavior. It does NOT duplicate all tests from `CharacterTooltip.test.tsx` -- only the ones that gain value from a real browser.

### Tests to include:

1. **"tooltip gets real dimensions from getBoundingClientRect"** -- Render CharacterTooltip, call `getBoundingClientRect()` on the tooltip element, assert `width > 0` and `height > 0`. This is the core validation that browser mode provides real geometry. In jsdom, this always returns zeros.

2. **"tooltip positions correctly relative to anchor without zero-rect fallback"** -- Render with a known anchor rect, verify the tooltip's computed `left` and `top` style values use actual tooltip dimensions (not the 300/150 fallback values from the jsdom workaround).

3. **"tooltip repositions when viewport is constrained"** -- Use Playwright's viewport API (or `page.setViewportSize`) to create a narrow viewport, render tooltip, verify it flips to left side. This tests real viewport constraint behavior.

### What NOT to duplicate:

- Content rendering tests (these work identically in jsdom)
- ARIA attribute tests (work identically in jsdom)
- Hover callback tests (work identically in jsdom)
- Portal rendering tests (work identically in jsdom)

### Test structure:

```typescript
// CharacterTooltip.browser.test.tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CharacterTooltip } from "./CharacterTooltip";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createTarget,
} from "../RuleEvaluations/rule-evaluations-test-helpers";
// No createMockRect needed -- we test with real rects
// No mockViewport needed -- real browser viewport

describe("CharacterTooltip - Browser Positioning", () => {
  // ... setup, 2-3 focused tests
});
```

## Step 6: Create Browser Test for Token Hover (Optional, Phase 2)

**File to create**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-hover.browser.test.tsx`

A small test file that validates `getBoundingClientRect` returns real SVG geometry when hovering a Token `<g>` element. This is the behavior noted in ADR-008 ("getBoundingClientRect() on SVG `<g>` returns tight bounding box").

### Tests to include:

1. **"Token getBoundingClientRect returns non-zero dimensions for SVG group"** -- Render a Token in an SVG, hover it, verify the rect passed to `onMouseEnter` has `width > 0` and `height > 0`.

This is lower priority than CharacterTooltip browser tests and can be deferred to Phase 2.

## Step 7: Create Browser Test for Battle Viewer Tooltip z-index (Optional, Phase 2)

**File to create**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/battle-viewer-tooltip.browser.test.tsx`

A focused test that validates `getComputedStyle` returns the actual z-index value for the tooltip. The existing jsdom test at line 227 of `battle-viewer-tooltip.test.tsx` already tests this, but jsdom's `getComputedStyle` may not resolve CSS Module values correctly.

### Tests to include:

1. **"tooltip z-index resolves correctly from CSS Modules"** -- Render BattleViewer, hover a token, verify `getComputedStyle(tooltip).zIndex` returns a real numeric value.

This is Phase 2 scope.

## Step 8: Update npm Scripts

**File to modify**: `/home/bob/Projects/auto-battler/package.json`

Update and add scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run --project unit",
    "test:browser": "vitest run --project browser",
    "test:unit:watch": "vitest --project unit"
  }
}
```

- `npm run test` runs both unit and browser projects (workspace default)
- `npm run test:unit` runs only jsdom tests (fast feedback)
- `npm run test:browser` runs only browser tests (slower, needs Chromium)
- `npm run test:unit:watch` watches only unit tests (TDD mode)

The existing `test:ui`, `test:critical` scripts should continue to work with the workspace.

## Step 9: Verify All Existing Tests Pass

Run the full test suite to verify zero regressions:

```bash
npm run test        # Both projects
npm run test:unit   # Just jsdom (should show 1448 tests passing)
npm run test:browser # Just browser (should show 2-3 new tests passing)
```

Verify:

- All 1448 existing tests pass in the `unit` project
- New browser tests pass in the `browser` project
- No test file runs in both projects (the include/exclude patterns are mutually exclusive)
- Total test count = 1448 + N browser tests

## Step 10: Documentation Updates

### 10a. Create ADR-022: Vitest Browser Mode for Real DOM Testing

**File to create**: `/home/bob/Projects/auto-battler/.docs/decisions/adr-022-vitest-browser-mode.md`

Contents:

- **Decision**: Use Vitest Browser Mode with Playwright for tests requiring real DOM/SVG rendering
- **Context**: jsdom returns zero-values for `getBoundingClientRect`, `getComputedStyle` does not resolve CSS Module values, SVG geometry is not computed
- **Options**: (1) Continue mocking, (2) Browser mode for subset, (3) Cypress/Playwright E2E
- **Rationale**: Browser mode integrates with existing Vitest workflow, runs only the tests that need real rendering, no separate E2E framework needed
- **Consequences**: Requires Playwright + Chromium in CI, slightly slower for browser tests, `.browser.test.tsx` naming convention

### 10b. Update ADR Index

**File to modify**: `/home/bob/Projects/auto-battler/.docs/decisions/index.md`

Add row:

```
| ADR-022 | Vitest Browser Mode for Real DOM Testing | 2026-02-09 | Accepted | [adr-022-vitest-browser-mode.md](./adr-022-vitest-browser-mode.md) |
```

### 10c. Update Architecture Doc

**File to modify**: `/home/bob/Projects/auto-battler/.docs/architecture.md`

Update the Testing Guidelines section (around line 127) to mention browser mode:

```markdown
## Testing Guidelines

- Unit tests for engine logic: Pure functions, no React
- Component tests: React Testing Library, user-centric
- Browser tests (`.browser.test.tsx`): Real DOM rendering via Vitest Browser Mode + Playwright for tests requiring `getBoundingClientRect`, `getComputedStyle`, or SVG geometry
- No mocking game engine in component tests (use real engine)
- Test accessibility settings via class/attribute assertions
- Hex coordinates in tests must satisfy: `max(|q|, |r|, |q+r|) <= 5`
```

---

## Phasing Summary

### Phase 1 (This Task -- Minimum Viable)

- Steps 1-5, 8-10: Install deps, create workspace config, create browser setup, create proof-of-concept CharacterTooltip browser test, update scripts, verify, document
- **Deliverables**: Working browser mode infrastructure + 2-3 browser tests proving real `getBoundingClientRect`

### Phase 2 (Follow-Up Task)

- Steps 6-7: Token hover browser test, BattleViewer tooltip z-index browser test
- Evaluate whether the zero-rect fallback in `CharacterTooltip.tsx` (lines 255-256) can be removed
- Consider additional SVG geometry tests if Phase 1 proves valuable

---

## Risk Assessment

| Risk                                                         | Likelihood | Impact | Mitigation                                                                    |
| ------------------------------------------------------------ | ---------- | ------ | ----------------------------------------------------------------------------- |
| `@vitest/browser` 4.x API differs from docs                  | Medium     | High   | Check actual installed package docs/types before coding                       |
| Playwright Chromium download fails in CI                     | Low        | High   | Add `npx playwright install chromium` to CI setup step                        |
| `@testing-library/react` behaves differently in browser mode | Low        | Medium | Use same render/screen/waitFor APIs; test one file first                      |
| tsconfig types conflict between jsdom and browser globals    | Medium     | Medium | Try unified tsconfig first; split to tsconfig.browser.json if conflicts arise |
| CSS Modules not processed in browser mode                    | Low        | Medium | Both projects `extends: './vite.config.ts'` which has CSS module config       |
| React Compiler plugin not applied in browser mode            | Low        | Low    | `extends` inherits all Vite plugins including React Compiler                  |
| Workspace config breaks `vitest --ui`                        | Low        | Low    | Test `npm run test:ui` after setup; may need `--project unit` flag            |

## Files Summary

### Created

- `/home/bob/Projects/auto-battler/vitest.workspace.ts` -- Workspace config with unit + browser projects
- `/home/bob/Projects/auto-battler/src/test/setup.browser.ts` -- Browser-mode test setup (no matchMedia mock)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.browser.test.tsx` -- Proof-of-concept browser positioning tests
- `/home/bob/Projects/auto-battler/.docs/decisions/adr-022-vitest-browser-mode.md` -- ADR for browser mode decision

### Modified

- `/home/bob/Projects/auto-battler/vite.config.ts` -- Remove `test` block (moved to workspace)
- `/home/bob/Projects/auto-battler/package.json` -- Add deps, add `test:unit`/`test:browser` scripts
- `/home/bob/Projects/auto-battler/tsconfig.json` -- Add browser type definitions
- `/home/bob/Projects/auto-battler/.docs/decisions/index.md` -- Add ADR-022 row
- `/home/bob/Projects/auto-battler/.docs/architecture.md` -- Add browser test guideline

### Unchanged

- All 150 existing test files remain unchanged
- `src/test/setup.ts` remains unchanged (jsdom setup)
- `CharacterTooltip.tsx` remains unchanged (zero-rect workaround stays for now)
