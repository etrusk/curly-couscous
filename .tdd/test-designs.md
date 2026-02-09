# Phase 4 Browser Test Designs: SVG Markers and DOM-Dependent Behaviors

**Reviewed 2026-02-09 -- 3 minor clarifications applied, no structural changes needed.**

- [REVIEW CHANGE] Test 4: clarified faction assignments for healer/wounded-ally setup
- [REVIEW CHANGE] Test 5: noted preview intent risk from default skills on characters with currentAction
- [REVIEW CHANGE] Test 6: clarified CSS Modules class name mangling for shape query

8 tests across 4 files. All tests run in Vitest Browser Mode (Playwright/Chromium).

---

## File 1: `src/components/BattleViewer/IntentOverlay.browser.test.tsx` (NEW)

Top-level describe: `"IntentOverlay - SVG Markers (Browser)"`

### Shared Setup

```
beforeEach:
  - useGameStore.getState().actions.initBattle([])
  - useGameStore.getState().actions.selectCharacter(null)
  - document.documentElement.removeAttribute("data-theme")
```

Imports:

- `vitest`: `describe, it, expect, beforeEach`
- `@testing-library/react`: `render`
- `vitest/browser`: `page`
- `./BattleViewer`: `BattleViewer`
- `../../stores/gameStore`: `useGameStore`
- `../RuleEvaluations/rule-evaluations-test-helpers`: `createCharacter` (component version, includes default skills for intent selector)
- `../RuleEvaluations/rule-evaluations-test-helpers`: `createAttackAction`, `createMoveAction`
- `../../styles/theme.css`: CSS variable resolution

Utility function (duplicate from theme.browser.test.tsx):

```
function resolveColorVar(name: string): string {
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(${name})`;
  document.documentElement.appendChild(probe);
  const resolved = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return resolved;
}
```

---

### Test 1: `all four marker definitions exist in rendered SVG defs`

- **File**: `src/components/BattleViewer/IntentOverlay.browser.test.tsx`
- **Type**: integration
- **Verifies**: The 4 SVG `<marker>` elements (`arrowhead-attack`, `cross-heal`, `circle-friendly`, `diamond-enemy`) are present in the rendered DOM with correct child shape elements and marker attributes.
- **Why jsdom cannot test this**: While jsdom preserves SVG DOM structure, this test validates that markers exist and are queryable in a real Chromium SVG rendering context. Combined with Test 2 (color resolution), this forms the smoke test for the entire marker rendering pipeline. Additionally, marker attributes like `markerUnits`, `overflow`, and `orient` are rendering hints that only matter in a real browser.
- **Setup**:
  - Create a friendly character at `{q: 0, r: 0}` and an enemy character at `{q: 2, r: 0}` using `createCharacter` from `rule-evaluations-test-helpers`.
  - Call `initBattle([friendly, enemy])`.
  - No tick advancement needed -- marker `<defs>` are always rendered regardless of whether intents exist.
  - `page.viewport(1280, 720)`.
  - `render(<BattleViewer />)`.
- **Assertions**:
  1. `document.getElementById("arrowhead-attack")` is not null
  2. `document.getElementById("cross-heal")` is not null
  3. `document.getElementById("circle-friendly")` is not null
  4. `document.getElementById("diamond-enemy")` is not null
  5. `arrowhead-attack` marker has exactly 2 `<polygon>` children (contrast outline + colored main)
  6. `cross-heal` marker has exactly 2 `<path>` children (contrast outline cross + colored main cross)
  7. `circle-friendly` marker has exactly 2 `<circle>` children (contrast outline + colored main)
  8. `diamond-enemy` marker has exactly 2 `<polygon>` children (contrast outline + colored main)
  9. All 4 markers have `markerUnits="userSpaceOnUse"` attribute
  10. All 4 markers have `overflow="visible"` attribute
  11. All 4 markers have `orient="auto"` attribute
- **Justification**: Validates the structural completeness of the marker definitions in a real SVG rendering context. If a marker ID changes or a child shape is accidentally removed, this test catches it. The existing jsdom unit tests only check `marker-end` attribute strings on lines, not the marker definitions themselves.
- **Implementation notes**:
  - Query child elements with `marker.querySelectorAll("polygon")`, `marker.querySelectorAll("path")`, `marker.querySelectorAll("circle")`.
  - Use `getAttribute("markerUnits")` for marker attribute checks.
  - Markers are always in the IntentOverlay SVG `<defs>` regardless of game state, so minimal game setup is required (just need 2 characters for BattleViewer to render).

---

### Test 2: `marker CSS variables resolve to correct action colors`

- **File**: `src/components/BattleViewer/IntentOverlay.browser.test.tsx`
- **Type**: integration
- **Verifies**: CSS custom properties `--action-attack`, `--action-heal`, `--action-move`, and `--contrast-line` used by SVG markers resolve to their expected RGB color values in the browser.
- **Why jsdom cannot test this**: jsdom cannot resolve CSS custom properties. Existing unit tests only verify attribute strings like `fill="var(--action-attack)"`. This test confirms the CSS engine resolves these variables to actual color values.
- **Setup**:
  - No component rendering needed. Uses the CSS variable probe element pattern.
  - Theme CSS is imported at file level (`import "../../styles/theme.css"`).
  - Default dark theme (no `data-theme` attribute).
- **Assertions**:
  1. `resolveColorVar("--action-attack")` equals `"rgb(213, 94, 0)"` (vermillion #d55e00)
  2. `resolveColorVar("--action-heal")` equals `"rgb(0, 158, 115)"` (green #009e73)
  3. `resolveColorVar("--action-move")` equals `"rgb(0, 114, 178)"` (blue #0072b2)
  4. `resolveColorVar("--contrast-line")` equals `"rgb(255, 255, 255)"` (white #ffffff)
- **Justification**: Markers reference these CSS variables for fill and stroke colors. If theme variable definitions change or are removed, marker colors silently break. This test verifies the CSS resolution pipeline that jsdom cannot exercise.
- **Implementation notes**:
  - Uses the `resolveColorVar()` helper (probe element pattern) defined locally in this file.
  - Does NOT read `getComputedStyle` on elements inside `<marker>` because elements in `<defs>` are not part of the render tree until referenced, making `getComputedStyle` unreliable on them.
  - This approach was documented in the plan as the preferred strategy over reading styles from marker children.

---

### Test 3: `intent line with marker-end produces non-zero visual extent`

- **File**: `src/components/BattleViewer/IntentOverlay.browser.test.tsx`
- **Type**: integration
- **Verifies**: When an IntentOverlay renders an intent line with a `marker-end` attribute, the SVG `<line>` element has non-zero bounding geometry in the real browser, proving the marker rendering pipeline is functional.
- **Why jsdom cannot test this**: jsdom SVG elements always return zero-dimension bounding rects from `getBoundingClientRect()`. This test validates the full rendering pipeline: `<defs>` marker -> `marker-end` reference on `<line>` -> browser renders line with marker at endpoint.
- **Setup**:
  - Create a friendly character at `{q: 0, r: 0}` with `currentAction` set to an attack action targeting `{q: 2, r: 0}`, `startedAtTick: 0`, `resolvesAtTick: 2`. Use `createCharacter` with `createAttackAction("light-punch", "Light Punch", {q: 2, r: 0}, null, 0, 2)` passed as `currentAction` override.
  - Create an enemy character at `{q: 2, r: 0}` with `skills: []`.
  - `initBattle([friendly, enemy])`.
  - `page.viewport(1280, 720)`.
  - `render(<BattleViewer />)`.
- **Assertions**:
  1. Query all `<line>` elements that have a `marker-end` attribute. At least one exists.
  2. The line with `marker-end` containing `"arrowhead-attack"` exists.
  3. Call `getBoundingClientRect()` on the parent `<g>` element of the intent line. Width is greater than 0.
  4. Call `getBoundingClientRect()` on the parent `<g>` element of the intent line. Height is greater than 0.
- **Justification**: Validates that the entire marker rendering chain produces visible geometry. If marker definitions are malformed or the `marker-end` URL reference is broken, the line would render but the marker would not. Measuring bounding geometry proves the browser processed both line and marker.
- **Implementation notes**:
  - The `selectIntentData` selector filters intents by `ticksRemaining >= 0`. With `startedAtTick: 0`, `resolvesAtTick: 2`, and tick at 0, `ticksRemaining = 2`, so the intent line renders.
  - The intent line SVG structure is: `<g>` containing outline `<line>` (no marker) + main `<line>` (with `marker-end`) + optional `<text>`. Query the `<line>` with `marker-end` attribute, then get its parent `<g>` for bounding rect.
  - Risk mitigation: SVG `<line>` bounding rect behavior varies across browsers. If `getBoundingClientRect()` on the `<line>` itself returns zero height (horizontal lines have zero height), fall back to measuring the parent `<g>` element which includes marker geometry. The plan recommends this fallback. Design the assertion on the `<g>` parent from the start.

---

### Test 4: `attack intent uses arrowhead marker, heal uses cross marker`

- **File**: `src/components/BattleViewer/IntentOverlay.browser.test.tsx`
- **Type**: integration
- **Verifies**: The correct marker-type-per-action-type mapping in a real rendered context: attack lines get `arrowhead-attack` marker, heal lines get `cross-heal` marker.
- **Why jsdom cannot test this**: Complements the jsdom attribute tests by verifying that the `marker-end` URL actually references an existing `<marker>` element in the rendered SVG DOM. jsdom tests only check the attribute string value but cannot confirm the referenced marker exists and is renderable.
- **Setup**:
  - Create 4 characters for a valid game state:
    1. Friendly attacker at `{q: -2, r: 0}` with `currentAction`: attack targeting `{q: 2, r: 0}`, `startedAtTick: 0`, `resolvesAtTick: 2`. Use `createAttackAction("light-punch", "Light Punch", {q: 2, r: 0}, null, 0, 2)`.
    2. Enemy target at `{q: 2, r: 0}` with `skills: []`, no `currentAction`.
    3. Enemy healer at `{q: 4, r: 0}` with `currentAction`: heal targeting `{q: 3, r: 0}`, `startedAtTick: 0`, `resolvesAtTick: 1`. Construct heal action manually: `{ type: "heal", skill: { id: "heal", instanceId: "heal", name: "Heal", actionType: "heal", tickCost: 1, range: 2, healing: 15, behavior: "", enabled: true, trigger: { scope: "friendly", condition: "always" }, target: "friendly", criterion: "nearest" }, targetCell: {q: 3, r: 0}, targetCharacter: null, startedAtTick: 0, resolvesAtTick: 1 }`.
    4. [REVIEW CHANGE] Wounded enemy at `{q: 3, r: 0}` with `hp: 50`, `skills: []`, `faction: "enemy"`. Must be same faction as healer (enemy) so the heal relationship is logically consistent, even though `currentAction` bypass means the selector does not check targeting validity. Using correct faction avoids confusion during implementation.
  - `initBattle([attacker, target, healer, woundedAlly])`.
  - `page.viewport(1280, 720)`.
  - `render(<BattleViewer />)`.
- **Assertions**:
  1. Query all `<line>` elements with a `marker-end` attribute. At least 2 exist.
  2. At least one line has `marker-end` attribute containing `"arrowhead-attack"`.
  3. At least one line has `marker-end` attribute containing `"cross-heal"`.
  4. `document.getElementById("arrowhead-attack")` is not null (referenced marker exists in DOM).
  5. `document.getElementById("cross-heal")` is not null (referenced marker exists in DOM).
- **Justification**: Validates the marker reference chain end-to-end. A broken marker ID (typo in `getMarkerEnd()` vs. `IntentOverlay` defs) would pass jsdom attribute tests but fail here because the referenced marker would not exist. This test catches ID mismatches between `IntentLine.tsx` and `IntentOverlay.tsx`.
- **Implementation notes**:
  - The heal action setup is more complex because `createAttackAction` from `rule-evaluations-test-helpers` creates attack-type actions. A heal action must be constructed manually or use a local helper.
  - [REVIEW CHANGE] The healer (enemy) and wounded character (enemy) must share the same faction. The `selectIntentData` selector does not validate targeting correctness -- it only checks `currentAction !== null` and `type !== "idle"` -- so the heal intent will render regardless. However, using consistent factions avoids implementation confusion and keeps the test scenario realistic.
  - Alternative: make the healer friendly and the wounded ally friendly. The key is that one intent is attack-type and one is heal-type.
  - The `selectIntentData` selector returns intents for all characters with `currentAction !== null` and `ticksRemaining >= 0` and `type !== "idle"`.

---

### Test 5: `friendly and enemy movement intents use different marker shapes`

- **File**: `src/components/BattleViewer/IntentOverlay.browser.test.tsx`
- **Type**: integration
- **Verifies**: Movement marker selection is faction-dependent: friendly movement uses `circle-friendly`, enemy movement uses `diamond-enemy`.
- **Why jsdom cannot test this**: Same rationale as Test 4. Validates the marker reference chain is complete and the faction-based branching in `getMarkerEnd()` produces references to real marker elements.
- **Setup**:
  - Create 2 characters with move actions:
    1. Friendly character at `{q: -2, r: 0}` with `currentAction`: move to `{q: -1, r: 0}`, `startedAtTick: 0`, `resolvesAtTick: 1`. Use `createMoveAction("move", "Move", "towards", {q: -1, r: 0}, 0, 1)`.
    2. Enemy character at `{q: 2, r: 0}` with `faction: "enemy"`, `currentAction`: move to `{q: 1, r: 0}`, `startedAtTick: 0`, `resolvesAtTick: 1`. Use `createMoveAction("move", "Move", "towards", {q: 1, r: 0}, 0, 1)`.
  - `initBattle([friendly, enemy])`.
  - `page.viewport(1280, 720)`.
  - `render(<BattleViewer />)`.
- **Assertions**:
  1. Query all `<line>` elements with a `marker-end` attribute. At least 2 exist.
  2. At least one line has `marker-end` attribute containing `"circle-friendly"`.
  3. At least one line has `marker-end` attribute containing `"diamond-enemy"`.
  4. `document.getElementById("circle-friendly")` is not null.
  5. `document.getElementById("diamond-enemy")` is not null.
  6. No line has `marker-end` containing both `"circle"` and `"diamond"` (sanity check: each line uses exactly one marker).
- **Justification**: The faction-based marker branching in `getMarkerEnd()` is a conditional code path (`faction === "friendly" ? circle : diamond`). If the condition is inverted or the marker IDs swapped, jsdom attribute tests would still pass (they only check strings), but this test validates the full reference chain.
- **Implementation notes**:
  - Using `createMoveAction` from `rule-evaluations-test-helpers` is the cleanest approach. It creates a move-type action with `type: "move"` and the correct skill structure.
  - Both characters need move actions with `ticksRemaining >= 0` for the intent selector to include them.
  - The friendly vs. enemy distinction comes from each character's `faction` property, which the `selectIntentData` selector propagates to `IntentData.faction`, which `IntentLine` uses to call `getMarkerEnd(type, faction)`.
  - [REVIEW CHANGE] Preview intent note: `createCharacter` adds default skills (Light Punch, Move, Heavy Punch). Since both characters have `currentAction` set, they are not idle, so `selectIntentData` will NOT compute preview decisions for them. However, if `createCharacter` is used with `skills: []` override for either character, ensure `currentAction` is still set or the character won't produce any intent. The current design is correct as written.

---

## File 2: `src/components/BattleViewer/Token.browser.test.tsx` (EXTEND)

Add to existing describe block or create sibling describe: `"Token - Enemy Stripe Pattern (Browser)"`

### Test 6: `enemy token has SVG pattern definition with diagonal stripe`

- **File**: `src/components/BattleViewer/Token.browser.test.tsx`
- **Type**: integration
- **Verifies**: Enemy tokens render a `<pattern>` element with `patternTransform="rotate(45)"` and the diamond `<path>` references it via a valid `fill="url(#stripe-enemy-...)"` URL that resolves to an existing pattern in the DOM.
- **Why jsdom cannot test this**: jsdom parses SVG `<pattern>` elements as DOM nodes but cannot render them. This test validates the pattern exists in the real SVG DOM and the `fill` URL reference chain is valid (the referenced pattern ID exists in the document). Additionally, `patternTransform` is a rendering instruction that only takes effect in a real browser.
- **Setup**:
  - Reuse the existing `beforeEach` from `Token.browser.test.tsx` (clears game state, removes theme attribute).
  - Create an enemy character at `{q: 2, r: 0}` with `id: "enemy-stripe"`, `faction: "enemy"`.
  - Create a friendly character at `{q: 0, r: 0}` (needed for valid battle state).
  - `initBattle([friendly, enemy])`.
  - `page.viewport(1280, 720)`.
  - `render(<BattleViewer />)`.
- **Assertions**:
  1. `document.querySelector('pattern[id^="stripe-enemy-"]')` is not null (at least one enemy stripe pattern exists).
  2. The pattern element has `patternTransform` attribute containing `"rotate(45)"`.
  3. The pattern element has `width` attribute equal to `"4"`.
  4. The pattern element has `height` attribute equal to `"4"`.
  5. The pattern element has `patternUnits` attribute equal to `"userSpaceOnUse"`.
  6. Query the enemy token via `screen.getByTestId("token-enemy-stripe")`, then find the `<path>` with `className` containing `shape`. Its `fill` attribute starts with `"url(#stripe-enemy-"`.
  7. Extract the pattern ID from the `fill` attribute URL (parse between `#` and `)`). `document.getElementById(extractedId)` is not null (the referenced pattern exists).
- **Justification**: The enemy stripe pattern is a colorblind accessibility feature. If the pattern definition is removed or the fill URL reference breaks, enemy tokens lose their visual faction distinction for colorblind users. jsdom tests cannot validate the fill URL reference chain.
- **Implementation notes**:
  - The pattern ID is `stripe-enemy-${id}`, so for `id: "enemy-stripe"` it would be `stripe-enemy-enemy-stripe`.
  - [REVIEW CHANGE] To find the diamond `<path>`, query within the token `<g>` for path elements. The diamond path is the one with a `d` attribute (not the HP bar rects). CSS Modules will mangle `styles.shape` to something like `_shape_xxxxx`, so query with `[class*="shape"]` within the token. Alternatively, simply query for `path[d]` within the token `<g>` since only the diamond has a `d` attribute among the token's children.
  - Pattern ID extraction regex: `/url\(#(.+?)\)/` to capture the ID.

---

## File 3: `src/styles/theme.browser.test.tsx` (EXTEND)

Add to existing describe block: `"Theme CSS Variable Resolution (Browser)"`

### Test 7: `WhiffOverlay color-mix() inline fill resolves to semi-transparent color`

- **File**: `src/styles/theme.browser.test.tsx`
- **Type**: unit
- **Verifies**: The CSS expression `color-mix(in srgb, var(--action-attack) 20%, transparent)` used by WhiffOverlay for whiff polygon fills resolves to a semi-transparent color in the browser, not a raw CSS function string.
- **Why jsdom cannot test this**: jsdom cannot resolve `color-mix()` functions, nor can it resolve nested `var()` within `color-mix()`. The fill would remain as the raw function text `"color-mix(in srgb, var(--action-attack) 20%, transparent)"` in jsdom.
- **Setup**:
  - No component rendering needed. Uses probe element pattern.
  - Theme CSS is imported at file level (already imported in `theme.browser.test.tsx`).
  - Default dark theme (restored by existing `beforeEach`).
  - Uses the existing `resolveColorVar()` and `parseColor()` helpers already defined in `theme.browser.test.tsx`.
- **Assertions**:
  For attack color-mix:
  1. Create a probe div with `background-color: color-mix(in srgb, var(--action-attack) 20%, transparent)`. Read `getComputedStyle(probe).backgroundColor`.
  2. The resolved value does not contain `"color-mix"` (browser resolved it).
  3. The resolved value does not contain `"var("` (CSS variable was substituted).
  4. Parse the resolved color with `parseColor()`. Alpha channel is approximately 0.2 (tolerance +/- 0.05).
  5. RGB channels approximate `#d55e00` (213, 94, 0) with tolerance +/- 5.

  For heal color-mix: 6. Create a probe div with `background-color: color-mix(in srgb, var(--action-heal) 20%, transparent)`. Read resolved value. 7. Parse color. Alpha channel is approximately 0.2 (tolerance +/- 0.05). 8. RGB channels approximate `#009e73` (0, 158, 115) with tolerance +/- 5.

- **Justification**: WhiffOverlay applies `color-mix(in srgb, ${fillColor} 20%, transparent)` as an inline SVG fill. If the browser cannot resolve this expression (or if the CSS variable is missing), whiff indicators become invisible or show incorrect colors. This test validates the exact CSS expression without requiring the complexity of setting up whiff events through the game engine.
- **Implementation notes**:
  - The probe element approach differs slightly from `resolveColorVar()`: instead of `var(${name})`, use the full `color-mix(...)` expression as `background-color`. Create a dedicated inline probe rather than using the existing `resolveColorVar` helper.
  - Code pattern:
    ```
    const probe = document.createElement("div");
    probe.style.backgroundColor = "color-mix(in srgb, var(--action-attack) 20%, transparent)";
    document.documentElement.appendChild(probe);
    const resolved = getComputedStyle(probe).backgroundColor;
    probe.remove();
    ```
  - Chromium may return `color(srgb r g b / a)` format rather than `rgba()`. The existing `parseColor()` in `theme.browser.test.tsx` already handles both formats.
  - Test both attack and heal color variants because WhiffOverlay uses both (line 31-33 in WhiffOverlay.tsx: conditional on `data.actionType`).

---

## File 4: `src/components/BattleViewer/CharacterTooltip.browser.test.tsx` (EXTEND)

Add new describe block: `"CharacterTooltip - Fade-in Animation (Browser)"`

### Test 8: `tooltip has active fade-in animation properties`

- **File**: `src/components/BattleViewer/CharacterTooltip.browser.test.tsx`
- **Type**: integration
- **Verifies**: The tooltip's `@keyframes fadeIn` CSS animation properties are applied by the real CSS engine: animation is active (name is not `"none"`), duration is 150ms, timing function is `ease-out`, fill mode is `forwards`.
- **Why jsdom cannot test this**: jsdom does not compute CSS animation properties from stylesheets. `getComputedStyle(el).animationName` always returns `"none"` in jsdom regardless of CSS rules applied. This is the same jsdom limitation that motivated the Token animation browser test in Phase 3.
- **Setup**:
  - Reuse the existing `beforeEach` from `CharacterTooltip.browser.test.tsx` (clears game state).
  - Create a character and a target using `createCharacter` and `createTarget` from `rule-evaluations-test-helpers`.
  - `initBattle([character, target])`.
  - Create an anchor rect: `new DOMRect(200, 200, 40, 40)`.
  - Render `<CharacterTooltip characterId={character.id} anchorRect={anchorRect} onMouseEnter={() => {}} onMouseLeave={() => {}} />`.
  - Query `screen.getByRole("tooltip")`.
- **Assertions**:
  1. `getComputedStyle(tooltip).animationName` is not `"none"` (CSS Modules will mangle the keyframe name, so do NOT check exact name -- just verify it is active).
  2. `getComputedStyle(tooltip).animationDuration` is `"0.15s"` (browsers normalize 150ms to 0.15s).
  3. `getComputedStyle(tooltip).animationTimingFunction` is `"ease-out"`.
  4. `getComputedStyle(tooltip).animationFillMode` is `"forwards"`.
- **Justification**: The fade-in animation is the tooltip's entrance effect (`opacity: 0` to `opacity: 1` over 150ms). If the CSS Module fails to process the `@keyframes fadeIn` rule or the animation shorthand is malformed, the tooltip would appear without animation (opacity stuck at 0 if fill-mode is missing, or no transition at all). This test catches regressions in the animation declaration.
- **Implementation notes**:
  - This follows the exact same pattern as Token.browser.test.tsx Test 3 (`selected token has active animation`) which checks `animationName`, `animationDuration`, `animationTimingFunction`, and `animationIterationCount`.
  - The tooltip animation is `animation: fadeIn 150ms ease-out forwards` (from `CharacterTooltip.module.css` line 17). Unlike the token's infinite animation, this is a one-shot animation with `forwards` fill mode.
  - `animationDuration` normalization: browsers report `"0.15s"` for `150ms`. Accept either `"0.15s"` or `"150ms"` for robustness, but expect `"0.15s"` based on Chromium behavior.
  - The tooltip renders immediately when the component mounts (it is not triggered by hover in this test). The animation properties should be present from the initial render.
  - Import note: `CharacterTooltip.browser.test.tsx` already imports `CharacterTooltip`, `useGameStore`, `createCharacter`, and `createTarget`. The new describe block can reuse these.

---

## Summary

| #   | Test Name                                                               | File                              | Type        | jsdom Gap                      |
| --- | ----------------------------------------------------------------------- | --------------------------------- | ----------- | ------------------------------ |
| 1   | all four marker definitions exist in rendered SVG defs                  | IntentOverlay.browser.test.tsx    | integration | SVG marker rendering context   |
| 2   | marker CSS variables resolve to correct action colors                   | IntentOverlay.browser.test.tsx    | integration | CSS custom property resolution |
| 3   | intent line with marker-end produces non-zero visual extent             | IntentOverlay.browser.test.tsx    | integration | SVG getBoundingClientRect      |
| 4   | attack intent uses arrowhead marker, heal uses cross marker             | IntentOverlay.browser.test.tsx    | integration | marker-end reference chain     |
| 5   | friendly and enemy movement intents use different markers               | IntentOverlay.browser.test.tsx    | integration | marker-end reference chain     |
| 6   | enemy token has SVG pattern definition with diagonal stripe             | Token.browser.test.tsx            | integration | SVG pattern fill reference     |
| 7   | WhiffOverlay color-mix() inline fill resolves to semi-transparent color | theme.browser.test.tsx            | unit        | color-mix() + var() resolution |
| 8   | tooltip has active fade-in animation properties                         | CharacterTooltip.browser.test.tsx | integration | CSS animation properties       |

**Total: 8 new browser tests (5 new file + 1 extend + 1 extend + 1 extend)**

Expected outcome: Brings browser test count from 22 to 30. All existing 1470 tests (1448 unit + 22 browser) continue to pass.
