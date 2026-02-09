# Phase 4 Browser Tests: SVG Markers and DOM-Dependent Behaviors

## Task Classification

**Non-UI task.** Test-only changes -- no source code modifications. REVIEW should use non-UI routing (code review only, no browser verification needed).

## Test File Organization

### File 1: `src/components/BattleViewer/IntentOverlay.browser.test.tsx`

SVG marker definitions, marker CSS variable color resolution, marker rendering pipeline, and marker-type-per-action correctness. Co-located with IntentOverlay.tsx per ADR-022 convention.

**5 tests planned.**

### File 2: `src/components/BattleViewer/Token.browser.test.tsx` (extend existing)

Add 1 test for enemy stripe pattern rendering to the existing Token browser test file.

**1 new test, extending existing describe block or adding a sibling describe.**

### File 3: `src/styles/theme.browser.test.tsx` (extend existing)

Add 1 test for WhiffOverlay inline `color-mix()` resolution. This tests CSS function resolution in an SVG fill context, which fits with the theme test file's focus on CSS variable resolution. Alternatively, if setup complexity warrants it, this could be a standalone `WhiffOverlay.browser.test.tsx`.

**1 new test.**

### File 4: `src/components/BattleViewer/CharacterTooltip.browser.test.tsx` (extend existing)

Add 1 test for tooltip fade-in animation properties.

**1 new test.**

**Total: 8 new browser tests (5 + 1 + 1 + 1).**

---

## Test Descriptions

### IntentOverlay.browser.test.tsx (New File)

#### Test 1: `all four marker definitions exist in rendered SVG defs`

**What it validates:** The 4 marker elements (`arrowhead-attack`, `cross-heal`, `circle-friendly`, `diamond-enemy`) are present in the SVG `<defs>` with correct child shape elements.

**Why browser-only:** While jsdom preserves DOM structure, this test validates that markers are present in a real SVG rendering context and queryable via standard DOM APIs in Chromium. Combined with the color tests below, this serves as the smoke test for the entire marker pipeline.

**Implementation approach:**

- Import `BattleViewer`, `useGameStore`, `createCharacter` (from `rule-evaluations-test-helpers`), and `theme.css`.
- Set up two characters (friendly + enemy) with `initBattle()`. No tick advancement needed -- markers are always in `<defs>` regardless of intents.
- Render `<BattleViewer />`.
- Query `document.querySelector('#arrowhead-attack')` (etc.) for each marker ID.
- Assert each marker exists and contains the expected child elements:
  - `arrowhead-attack`: 2 `<polygon>` children
  - `cross-heal`: 2 `<path>` children
  - `circle-friendly`: 2 `<circle>` children
  - `diamond-enemy`: 2 `<polygon>` children
- Assert marker attributes: `markerUnits="userSpaceOnUse"`, `overflow="visible"`, `orient="auto"`.

#### Test 2: `marker CSS variables resolve to correct action colors`

**What it validates:** CSS custom properties (`--action-attack`, `--action-heal`, `--action-move`, `--contrast-line`) used within SVG marker elements resolve to actual RGB color values in the browser.

**Why browser-only:** jsdom cannot resolve CSS custom properties. Existing unit tests only check attribute strings like `fill="var(--action-attack)"`. This test verifies the CSS engine resolves these to `rgb(213, 94, 0)` etc.

**Implementation approach:**

- Use the CSS variable probe element pattern (documented in `.docs/patterns/css-variable-probe-element.md`).
- Create `resolveColorVar()` helper (same as in `theme.browser.test.tsx`) or import/reuse it.
- Resolve `--action-attack`, `--action-heal`, `--action-move`, `--contrast-line`.
- Assert expected values:
  - `--action-attack` -> `rgb(213, 94, 0)` (#d55e00)
  - `--action-heal` -> `rgb(0, 158, 115)` (#009e73)
  - `--action-move` -> `rgb(0, 114, 178)` (#0072b2)
  - `--contrast-line` -> `rgb(255, 255, 255)` (#ffffff)

**Note:** This test validates marker color variables globally. It does not require rendering IntentOverlay -- it directly tests the CSS variables that markers reference. This is intentional: reading `getComputedStyle` on elements inside `<marker>` is unreliable because markers are in `<defs>` and not part of the render tree until referenced.

#### Test 3: `intent line with marker-end produces non-zero visual extent`

**What it validates:** When an IntentOverlay renders an intent line with a `marker-end` attribute, the SVG `<line>` element has non-zero bounding geometry in the browser.

**Why browser-only:** jsdom SVG elements always return zero-dimension bounding rects. This validates the full marker rendering pipeline: `<defs>` marker -> `marker-end` reference on `<line>` -> browser renders marker at line endpoint.

**Implementation approach:**

- Set up a friendly character at `{q: 0, r: 0}` with a `currentAction` of type `attack` targeting `{q: 2, r: 0}`, `startedAtTick: 0`, `resolvesAtTick: 2`. Set up an enemy at `{q: 2, r: 0}`.
- Call `initBattle()` with both characters. (The character has a pre-set `currentAction`, so `nextTick()` is not needed.)
- Render `<BattleViewer />` with `page.viewport(1280, 720)`.
- Query for `line` elements within the IntentOverlay SVG. The intent line should have `marker-end="url(#arrowhead-attack)"`.
- Call `getBoundingClientRect()` on the main line element (second `<line>` in the `<g>`).
- Assert the line has non-zero width and height (the marker extends the visual bounds).

**Risk:** SVG line bounding rect behavior varies. The bounding rect of a `<line>` may or may not include the marker geometry depending on the browser. Mitigation: test for non-zero extent on the line itself, which should hold regardless of marker inclusion. If `getBoundingClientRect` on `<line>` returns zero in SVG context, fall back to querying the parent `<g>` element.

#### Test 4: `attack intent uses arrowhead marker, heal uses cross marker`

**What it validates:** Correct marker-type-per-action-type mapping in a real rendered context: attack lines get `arrowhead-attack`, heal lines get `cross-heal`.

**Why browser-only:** Complements the jsdom attribute tests by verifying that the `marker-end` URL actually references an existing `<marker>` in the rendered SVG DOM. jsdom tests only check the attribute string value.

**Implementation approach:**

- Create a friendly character at `{q: 0, r: 0}` with an attack `currentAction` targeting `{q: 2, r: 0}`, `resolvesAtTick: 2`.
- Create an enemy healer at `{q: 4, r: 0}` with a heal `currentAction` targeting a wounded ally at `{q: 3, r: 0}`, `resolvesAtTick: 2`. The healer needs a heal skill and heal action type.
- Create additional characters as needed for valid game state.
- `initBattle()`, render `<BattleViewer />`.
- Query all `<line>` elements. Identify attack line (stroke = `var(--action-attack)`) and heal line (stroke = `var(--action-heal)`).
- Assert attack line has `marker-end` containing `arrowhead-attack`.
- Assert heal line has `marker-end` containing `cross-heal`.
- Verify that both referenced markers exist in the DOM via `document.getElementById()`.

#### Test 5: `friendly and enemy movement intents use different marker shapes`

**What it validates:** Movement markers are faction-dependent: friendly uses `circle-friendly`, enemy uses `diamond-enemy`.

**Why browser-only:** Same rationale as Test 4. Validates the marker reference chain is complete in a real SVG context.

**Implementation approach:**

- Create a friendly character at `{q: -2, r: 0}` with a move `currentAction` (type `move`) targeting `{q: -1, r: 0}`, `resolvesAtTick: 1`.
- Create an enemy character at `{q: 2, r: 0}` with a move `currentAction` targeting `{q: 1, r: 0}`, `resolvesAtTick: 1`.
- `initBattle()`, render `<BattleViewer />`.
- Query lines. Identify the two main lines (those with `marker-end` attributes).
- One should have `marker-end` containing `circle-friendly`, the other `diamond-enemy`.
- Verify both referenced markers exist in the DOM.

---

### Token.browser.test.tsx (Extend Existing)

#### Test 6: `enemy token has SVG pattern definition with diagonal stripe`

**What it validates:** Enemy tokens render a `<pattern>` element with `patternTransform="rotate(45)"` and the diamond `<path>` references it via `fill="url(#stripe-enemy-...)"`.

**Why browser-only:** jsdom parses SVG patterns as DOM but does not render them. This test validates the pattern is in the real SVG DOM and the fill reference is valid (the referenced pattern exists in the same document).

**Implementation approach:**

- Set up enemy character, render `<BattleViewer />`.
- Query for `pattern[id^="stripe-enemy-"]` -- should find at least one.
- Assert pattern has `patternTransform` attribute containing `rotate(45)`.
- Assert pattern has `width="4"` and `height="4"`.
- Query the diamond `<path>` within the enemy token.
- Assert its `fill` attribute starts with `url(#stripe-enemy-`.
- Verify the pattern element referenced by the fill URL exists: extract the ID from the URL and `document.getElementById(id)`.

---

### theme.browser.test.tsx OR WhiffOverlay.browser.test.tsx (Extend Existing / New)

#### Test 7: `WhiffOverlay color-mix() inline fill resolves to semi-transparent color`

**What it validates:** The `color-mix(in srgb, var(--action-attack) 20%, transparent)` inline fill on whiff polygon elements resolves to an actual semi-transparent color in the browser, not a raw CSS function string.

**Why browser-only:** jsdom cannot resolve `color-mix()` or nested `var()` in SVG fill attributes. The fill would remain as the raw function text in jsdom.

**Implementation approach:**

**Decision: Create a standalone test using probe element technique** rather than rendering the full WhiffOverlay component with game state. Rendering WhiffOverlay requires generating `WhiffEvent`s through the game engine, which requires multiple `nextTick()` calls with specific character setups where attacks miss. This complexity is disproportionate to the test's value.

Instead, use the probe element pattern to verify that `color-mix(in srgb, var(--action-attack) 20%, transparent)` resolves correctly:

- Create a probe div with `background-color: color-mix(in srgb, var(--action-attack) 20%, transparent)`.
- Append to document, read `getComputedStyle(probe).backgroundColor`, remove.
- Parse the color and assert:
  - It is not empty or the raw function string.
  - It has an alpha channel ~0.2.
  - RGB channels approximate `#d55e00` (213, 94, 0).
- Repeat for `--action-heal` variant.

This validates the exact CSS expression used by WhiffOverlay without needing full component rendering. Add this test to `theme.browser.test.tsx` since it tests CSS function resolution (fits alongside the existing `color-mix` test for `--faction-friendly-bg`).

---

### CharacterTooltip.browser.test.tsx (Extend Existing)

#### Test 8: `tooltip has active fade-in animation`

**What it validates:** The tooltip's `@keyframes fadeIn` animation properties are applied by the real CSS engine: `animationDuration: "150ms"`, `animationName` is not `"none"`, timing function is `"ease-out"`.

**Why browser-only:** jsdom does not compute CSS animation properties from stylesheets. `getComputedStyle(el).animationName` returns `"none"` in jsdom regardless of the CSS rules.

**Implementation approach:**

- Reuse the existing `beforeEach` setup in the CharacterTooltip browser test.
- Render a `CharacterTooltip` with a valid `anchorRect` and `characterId`.
- Query the tooltip element via `screen.getByRole("tooltip")`.
- Read `getComputedStyle(tooltip)` properties:
  - `animationDuration` should be `"0.15s"` (150ms normalized).
  - `animationName` should not be `"none"` (CSS Modules will mangle the name, so do not check exact name).
  - `animationTimingFunction` should be `"ease-out"`.
  - `animationFillMode` should be `"forwards"` (from `animation: fadeIn 150ms ease-out forwards`).

---

## Shared Utilities

### `resolveColorVar()` helper

The probe element pattern is already implemented in `theme.browser.test.tsx` as a local function. For Phase 4:

- **IntentOverlay.browser.test.tsx** needs the same `resolveColorVar()` for Test 2.
- **Option A:** Duplicate the function in the new test file (simple, each file is self-contained).
- **Option B:** Extract to a shared browser test utility file.

**Decision:** Use Option A (duplicate). The function is 6 lines. Extracting to a shared file is premature optimization for 2 usages. If Phase 5 needs it again, extract then.

### `parseColor()` helper

Needed for Test 7 (WhiffOverlay color-mix assertion). Already exists in `theme.browser.test.tsx`. Same decision as above -- duplicate in the test file that needs it, or add the test to `theme.browser.test.tsx` directly (preferred, avoids duplication).

---

## Test Setup Pattern

All tests follow the established browser test pattern:

```
1. beforeEach: reset game store via actions.initBattle([]), selectCharacter(null)
2. page.viewport(1280, 720) where layout matters
3. Set up characters with createCharacter() + initBattle()
4. Optionally set currentAction on characters for intent lines
5. render(<BattleViewer />) or render(<CharacterTooltip .../>)
6. Query DOM elements and assert computed styles / bounding rects
```

Import requirements per file:

- `vitest`: `describe, it, expect, beforeEach`
- `@testing-library/react`: `render, screen`
- `vitest/browser`: `page` (only if viewport control needed)
- `../../stores/gameStore`: `useGameStore`
- `../RuleEvaluations/rule-evaluations-test-helpers`: `createCharacter`
- `../../styles/theme.css`: CSS variable resolution
- `../../engine/game-test-helpers`: `createCharacter, createSkill` (for action setup with the engine helper version)

**Important:** The IntentOverlay tests need characters with `currentAction` set. The `createCharacter` from `game-test-helpers.ts` (engine version) accepts `currentAction` in overrides and does not add default skills, which is cleaner for intent line setup. The `createCharacter` from `rule-evaluations-test-helpers.ts` (component version) adds default skills. Use the engine version for IntentOverlay tests where we need precise action control. Use the component version for Token/tooltip tests that go through BattleViewer (needs skills for intent data selector to work).

---

## Risks and Mitigations

1. **SVG `<marker>` bounding rect:** `getBoundingClientRect()` on elements inside `<defs>` returns zero because they are not rendered until referenced. Test 3 addresses this by measuring the `<line>` element that references the marker, not the marker itself.

2. **CSS Modules class name mangling:** Marker IDs are plain strings (`id="arrowhead-attack"`), not CSS Module classes, so they are not mangled. Safe to query by ID directly.

3. **Intent line rendering requires valid game state:** Characters must have `currentAction` with appropriate `startedAtTick`/`resolvesAtTick` values relative to the current tick (0). The `selectIntentData` selector filters by `ticksRemaining >= 0`.

4. **`getComputedStyle` on SVG elements inside `<marker>`:** Reading computed styles on shapes inside `<marker>` may not resolve CSS variables because the element is in `<defs>`. Test 2 uses the probe element technique on the CSS variables themselves rather than reading styles from marker children.

5. **WhiffOverlay game state complexity:** Setting up whiff events requires the full game tick pipeline. The plan avoids this by using the probe element technique for the CSS expression instead.

6. **Animation property normalization:** Browsers may normalize `150ms` to `0.15s`. Tests should accept either format.

---

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md`: Tests validate intent line visual encoding (action colors, faction markers), whiff indicator opacity, tooltip animation -- all spec'd behaviors.
- [x] Approach consistent with `.docs/architecture.md`: Uses Vitest Browser Mode + Playwright per ADR-022, co-located test files, same test helpers.
- [x] Patterns follow `.docs/patterns/index.md`: Uses CSS variable probe element pattern, `.browser.test.tsx` naming convention.
- [x] No conflicts with `.docs/decisions/index.md`: Aligns with ADR-022 (browser test strategy), ADR-008 (SVG rendering), ADR-021 (CSS theming).

No misalignments found.

## New Decisions

None. This plan uses existing patterns and infrastructure established in Phases 1-3. No new architectural decisions needed.

---

## Summary

| #   | Test                                          | File                              | jsdom Gap                      |
| --- | --------------------------------------------- | --------------------------------- | ------------------------------ |
| 1   | 4 marker defs exist with correct structure    | IntentOverlay.browser.test.tsx    | SVG marker rendering context   |
| 2   | Marker CSS vars resolve to correct colors     | IntentOverlay.browser.test.tsx    | CSS custom property resolution |
| 3   | Intent line with marker has non-zero extent   | IntentOverlay.browser.test.tsx    | SVG getBoundingClientRect      |
| 4   | Attack uses arrowhead, heal uses cross        | IntentOverlay.browser.test.tsx    | marker-end reference chain     |
| 5   | Friendly/enemy movement use different markers | IntentOverlay.browser.test.tsx    | marker-end reference chain     |
| 6   | Enemy token has diagonal stripe pattern       | Token.browser.test.tsx            | SVG pattern rendering          |
| 7   | WhiffOverlay color-mix resolves to RGBA       | theme.browser.test.tsx            | inline color-mix() resolution  |
| 8   | Tooltip has fade-in animation                 | CharacterTooltip.browser.test.tsx | CSS animation properties       |

**Expected outcome:** 8 new browser tests, bringing total from 22 to 30. All existing 1470 tests (1448 unit + 22 browser) continue to pass.
