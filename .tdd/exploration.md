# Exploration Findings

## Task Understanding

Add ARIA semantics to three UI areas (HP bars, battle status, victory/defeat/death events), update spec/architecture docs to reference WCAG 2.2 AA, and fix a stale SkillsPanel reference in `.roo/rules/00-project.md`.

## Relevant Files

### HP Bar (role="meter")

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx` - HP bar rendered as two SVG `<rect>` elements (lines 199-219). Currently has NO `role="meter"`, no `aria-valuemin`, `aria-valuemax`, or `aria-valuenow`. The health bar fill rect has `data-testid="health-bar-${id}"` but no ARIA attributes. The parent `<g>` has `role="img"` with `aria-label` that includes HP info ("Friendly character A, 75 of 100 HP").
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-visual.test.tsx` - Tests for Token visual rendering (shape, color, HP bar width, patterns, letters). Tests reference `health-bar-${id}` testid. Will need new tests for `role="meter"` attributes.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.module.css` - Token styles. No changes needed for ARIA.

### Battle Status (aria-live)

- `/home/bob/Projects/auto-battler/src/components/BattleStatus/BattleStatusBadge.tsx` - ALREADY has `aria-live="polite"` on the `statusContainer` div (line 57). Displays status text ("Battle Active", "Victory!", "Defeat", "Draw") and tick count. No debouncing currently applied.
- `/home/bob/Projects/auto-battler/src/components/BattleStatus/BattleStatusBadge.test.tsx` - Existing tests already verify `aria-live="polite"` region exists (line 241). Has 4 status display tests, tick display test, and defensive rendering test.
- `/home/bob/Projects/auto-battler/src/components/BattleStatus/BattleStatusBadge.module.css` - Badge styles with status-specific color variants.

### Victory/Defeat/Death Events (role="alert")

- `/home/bob/Projects/auto-battler/src/components/BattleStatus/BattleStatusBadge.tsx` - Victory/defeat status is displayed here but does NOT have `role="alert"`. The current `aria-live="polite"` region wraps the status text. Victory/defeat are terminal states that warrant `role="alert"` for immediate screen reader announcement.
- `/home/bob/Projects/auto-battler/src/engine/types.ts` - `DeathEvent` type defined at line 256: `{ type: "death", tick: number, characterId: string }`. No faction info on death event itself.
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors.ts` - Has `selectRecentDamageEvents` and `selectRecentWhiffEvents` selectors but NO death event selector. A new selector would be needed to surface death events to the UI.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/DamageOverlay.tsx` - Shows damage numbers but has no death/death event rendering. No ARIA attributes.
- **No existing component renders death events in the UI.** EventLog is listed as `(planned)` in architecture.md. Death events exist in the game engine's event history but are not surfaced to any UI component.

### Stale Reference

- `/home/bob/Projects/auto-battler/.roo/rules/00-project.md` line 194 - Contains `SkillsPanel/  # Sentence-builder UI (planned)` which is stale. SkillsPanel was deleted in commit 497e10f. Should reference `CharacterPanel/` instead (which already exists in `.docs/architecture.md`).

### Spec/Architecture Docs

- `/home/bob/Projects/auto-battler/.docs/spec.md` - Has an "Accessibility" section under Character Icons (line 437-441) covering letters, ARIA labels, and colorblind support. No WCAG version reference anywhere.
- `/home/bob/Projects/auto-battler/.docs/architecture.md` - Has "Accessibility Requirements" section (lines 135-140) covering shape redundancy, pattern fills, action-type colors, movement markers. Lists "High contrast mode option (Phase 5 - planned)" and "UI scale (Phase 5 - planned)". Critical Constraints section (line 120) mentions "Never rely on color alone" and "Minimum 3:1 contrast ratio". No WCAG version reference.
- `/home/bob/Projects/auto-battler/.docs/current-task.md` - Line 31 explicitly calls out "Update spec/architecture to reference WCAG 2.2 AA as accessibility target" as a next step.

### App Layout

- `/home/bob/Projects/auto-battler/src/App.tsx` - Top-level layout. BattleStatusBadge renders in the `.controls` section alongside CharacterControls and PlayControls. No `role="alert"` wrappers currently.

## Existing Patterns

- **SVG ARIA on Grid**: Grid.tsx uses `role="grid"` with `aria-label="Hex battle grid, 91 cells"`. Cell.tsx uses `role="gridcell"` with `aria-label="Hex cell at q ${q}, r ${r}"`. These establish an existing pattern of ARIA roles on SVG elements.
- **Token ARIA**: Token.tsx uses `role="img"` with descriptive `aria-label` including faction, letter, and HP. Has `tabIndex={0}` for keyboard navigation and `aria-describedby={tooltipId}` for tooltip association.
- **Emoji aria-hidden**: BattleStatusBadge uses `aria-hidden="true"` on emoji spans to prevent screen readers from announcing decorative emoji.
- **CSS Modules**: All components use CSS Modules for styling. Tests check class names with `toContain()` to handle hashed names.
- **CSS Custom Property theming**: Three-block pattern (`:root`, `[data-theme="light"]`, `[data-theme="high-contrast"]`) for theme switching.
- **Selector pattern**: Zustand selectors like `selectRecentDamageEvents` and `selectRecentWhiffEvents` filter `history` by event type and current tick. Same pattern would apply for death events if a selector is needed.

## Dependencies

- `role="meter"` on HP bar: Must add ARIA attributes to the SVG `<rect>` or a wrapping `<g>` element inside Token.tsx. SVG elements support WAI-ARIA roles, but `role="meter"` on SVG may have browser/AT compatibility considerations.
- Death event UI: No component currently renders death events. Adding `role="alert"` for death events requires either a new component or extending an existing one. The simplest approach would be to add `role="alert"` conditionally to the BattleStatusBadge when status transitions to victory/defeat/draw, rather than building a separate death event display.
- Battle status debouncing: The session mentions "debounced" for `aria-live`, but BattleStatusBadge updates are already driven by Zustand store changes (battle status only changes on tick processing, not continuously). Status text only changes on meaningful state transitions (active -> victory/defeat/draw), so debouncing may not be necessary for the status text itself. The tick counter does update every tick during auto-play.

## Constraints Discovered

- **SVG `role="meter"` compatibility**: The HP bar is an SVG `<rect>` element. While WAI-ARIA roles are valid on SVG elements per the SVG Accessibility API Mappings spec, `role="meter"` may not be well-supported by all screen readers on SVG elements. A wrapping `<g role="meter">` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-label` is the most robust approach.
- **No death event rendering exists**: Death events are tracked in `gameState.history` but never surfaced to any UI component. The `EventLog` component is planned but not implemented. For this task, `role="alert"` for death events may need to be scoped to just the battle outcome (victory/defeat/draw) rather than individual death events, unless a new lightweight component is created.
- **BattleStatusBadge already has aria-live**: Adding `role="alert"` to the same element would conflict. `role="alert"` implicitly sets `aria-live="assertive"`. The plan should either: (a) conditionally switch from `aria-live="polite"` to `role="alert"` on terminal states, or (b) use a separate element with `role="alert"` that only renders for terminal states.
- **Token aria-label already contains HP**: The Token `<g>` already has `aria-label` with HP info ("Friendly character A, 75 of 100 HP"). Adding `role="meter"` to the HP bar sub-elements provides structured semantics beyond the text label.
- **Stale .roo/rules file**: The `.roo/rules/00-project.md` file at line 194 references `SkillsPanel/` which was deleted. The equivalent entry in `.docs/architecture.md` already shows `CharacterPanel/`.

## Open Questions

1. **Death event scope**: Should `role="alert"` apply only to battle outcome transitions (victory/defeat/draw), or also to individual character death events? Individual deaths would require a new component or extending DamageOverlay. Battle outcome alerts are simpler and higher value.
2. **SVG role="meter" approach**: Should the HP bar use a wrapping `<g role="meter">` around the two `<rect>` elements, or should the attributes go on the fill `<rect>` alone? The wrapping `<g>` is more semantically correct since it groups background + fill as a single meter.
3. **Debouncing necessity**: The session.md mentions "debounced" for `aria-live`. Since status text only changes on meaningful transitions (not every tick), is debouncing actually needed? The tick counter updates every tick but is in a separate div from the `aria-live` region. If auto-play runs fast, the tick counter could generate many announcements, but it is outside the `aria-live` div.
4. **WCAG 2.2 AA placement**: Should the WCAG reference go in spec.md (requirements), architecture.md (constraints), or both? The current-task.md says "spec/architecture" suggesting both.
5. **`.roo/rules/00-project.md` scope**: This file also has other outdated entries (e.g., line 195 says `RuleEvaluations/ # (planned)` but RuleEvaluations already exists). Should we fix just SkillsPanel or all stale entries?
