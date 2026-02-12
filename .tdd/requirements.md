# TDD Spec: Option D — Two-State Trigger Model

Created: 2026-02-12

## Goal

Replace the current "always-present scope + condition" trigger UI with a two-state model: triggers are either **absent** (unconditional — skill always fires when priority allows) or **present** (conditional — scope + condition guard). Remove "Always" as a dropdown option. When absent, no trigger controls render. When present, scope dropdown only appears for conditions that require a subject, and each condition restricts its available scopes to semantically valid combinations.

This eliminates nonsensical combinations (enemy+always, self+channeling, self+idle) and aligns the UI toward a sentence-builder mental model where each skill row reads as an English sentence.

## Acceptance Criteria

### Core: Two-state trigger

- [ ] Skills default to no trigger (unconditional). No trigger dropdowns render — only a `+ Condition` ghost button in the trigger area
- [ ] Clicking `+ Condition` activates the trigger: condition dropdown appears with a sensible default (e.g., `in_range`), scope dropdown appears if the condition requires one, and a `x` remove button appears
- [ ] Clicking `x` removes the trigger entirely, returning to the unconditional `+ Condition` state. Negated flag resets to false
- [ ] "Always" is NOT an option in the condition dropdown. The 7 remaining conditions are: `in_range`, `hp_below`, `hp_above`, `channeling`, `idle`, `targeting_me` (`Cell targeted`), `targeting_ally` (`Targeting ally`)
- [ ] The store representation: a skill with no trigger has `trigger: { scope: "enemy", condition: "always" }` (unchanged wire format for backward compatibility). The UI interprets `condition: "always"` as "no trigger" and renders the `+ Condition` button
- [ ] Adding a condition via `+ Condition` sets the trigger to a non-always condition in the store. Removing via `x` sets it back to `{ scope: "enemy", condition: "always" }`

### Core: Condition-scoped scope dropdown

- [ ] Each condition defines which scopes are valid and whether the scope dropdown is shown at all
- [ ] Condition -> scope rules:

| Condition        | Scope dropdown shown? | Valid scopes            | Rationale                                                  |
| ---------------- | --------------------- | ----------------------- | ---------------------------------------------------------- |
| `in_range`       | Yes                   | `enemy`, `ally`         | Distance check needs a subject. Self is always distance 0. |
| `hp_below`       | Yes                   | `self`, `ally`, `enemy` | All three are meaningful HP checks.                        |
| `hp_above`       | Yes                   | `self`, `ally`, `enemy` | Same as hp_below.                                          |
| `channeling`     | Yes                   | `enemy`, `ally`         | Self can never be channeling during eval.                  |
| `idle`           | Yes                   | `enemy`, `ally`         | Self is always idle during eval.                           |
| `targeting_me`   | No (implied `enemy`)  | —                       | Only enemies targeting your cell matters for dodge.        |
| `targeting_ally` | No (implied `enemy`)  | —                       | Only enemy actions targeting allies matters.               |

- [ ] When the condition changes, if the current scope is not in the new condition's valid scopes, reset scope to the first valid scope for that condition
- [ ] When scope dropdown is hidden (implied scope), the store still holds the correct scope value (e.g., `scope: "enemy"` for `targeting_me`)

### Core: AND trigger interaction

- [ ] AND trigger (second trigger via `+ AND` button) follows the same condition-scoped scope rules. The second trigger dropdown restricts scopes based on its selected condition, same as the primary trigger. AND triggers do NOT use the two-state model (they are always present once added, with their own `x` remove button)
- [ ] AND trigger's condition dropdown does NOT include "Always" (same 7-option list)

### Existing behavior preserved

- [ ] NOT toggle still works: appears when trigger is active, toggles `negated` flag
- [ ] Value input still appears for `in_range`, `hp_below`, `hp_above`
- [ ] Qualifier select still appears for `channeling` condition
- [ ] Trigger evaluation engine is UNCHANGED — triggers still use scope + condition internally. This is a UI-only change to what combinations are offered
- [ ] Skills loaded from existing state with `condition: "always"` render as unconditional (no trigger controls, just `+ Condition` button)
- [ ] Filter controls and filter behavior are UNCHANGED by this spec

### Target=Self hides filter and selector

- [ ] When target is set to `self`, the SELECTOR dropdown and its fieldGroup are hidden (not rendered)
- [ ] When target is set to `self`, the FILTER section is hidden entirely (no `+ Filter` button, no filter controls). Currently filter renders but is silently bypassed — this makes the bypass visible
- [ ] When target changes FROM `self` to `enemy`/`ally`, selector and filter controls reappear. Any previously-configured filter that was hidden is still in the store and reappears with its prior configuration

### Default trigger configuration per skill

- [ ] Skills from the registry that have `defaultTrigger` with a non-always condition render with the trigger active on assignment (Kick: channeling, Dash: in_range 1, Charge: in_range 3)
- [ ] Skills from the registry with no `defaultTrigger` or with `{ condition: "always" }` render with no trigger (unconditional, `+ Condition` button)
- [ ] Manually removing a default trigger (clicking `x`) works — sets to always in store, renders as unconditional

## Approach

This is a UI-only change. The engine's trigger evaluation (`evaluateTrigger` in `triggers.ts`) is not modified. The store's `Trigger` type is not modified. The change is entirely in:

1. **TriggerDropdown.tsx**: Refactor to support the two-state model. When `trigger.condition === "always"`, render `+ Condition` button. When active, render the condition dropdown (7 options, no "always"), conditionally render scope dropdown based on a `CONDITION_SCOPE_RULES` lookup, and render `x` to remove.

2. **SkillRow.tsx**: When `skill.target === "self"`, do not render the selector fieldGroup or the `FilterControls` component / filter fieldGroup wrapper.

3. **A new constant/lookup** (e.g., in TriggerDropdown or a shared config): `CONDITION_SCOPE_RULES` mapping each condition to its valid scopes and whether scope is shown. This is the single source of truth for what the UI allows.

4. **Store actions**: `updateSkillTrigger` already handles setting scope/condition/value. Adding a trigger = calling this with a default non-always condition. Removing = calling this with `{ scope: "enemy", condition: "always" }`. No new store actions needed.

## Scope Boundaries

- In scope: TriggerDropdown.tsx (two-state model + condition-scoped scopes), SkillRow.tsx (conditional rendering of selector/filter for target=self), new CONDITION_SCOPE_RULES constant, visual-specs/skill-row.md update
- Out of scope: Engine trigger evaluation (`triggers.ts`), type definitions (`types.ts`), game decisions (`game-decisions.ts`), filter condition dropdown (FilterControls.tsx filter logic), store action internals

## Assumptions

- **Selector hiding not yet implemented**: The spec originally stated selector hiding for target=self was "already implemented." Actual code (`SkillRow.tsx:228`) only _disables_ the select — it does not hide/remove the element. This spec treats it as a new implementation requirement.
- **AND trigger data model**: The current `Skill` type has a single `trigger: Trigger` field with no second trigger. AND trigger sections of this spec apply if/when the second trigger feature is surfaced. If AND trigger code does not yet exist, those acceptance criteria are deferred.
- **Backward compatibility**: `condition: "always"` remains valid in the type system and engine. The UI reinterprets it as "no active trigger."
- **Filter persistence**: When target changes to `self`, the filter is hidden but NOT removed from the store. Changing target back restores previous filter configuration.

## Constraints

- Max 400 lines per file (CLAUDE.md rule)
- CSS modules pattern for all styling
- Native `<select>` elements only — no custom dropdown components (ui-ux-guidelines.md)
- Ghost button pattern for `+ Condition` (dashed border, transparent bg — matches existing `+ Filter` button)
- Compact spacing (0.25rem-0.5rem for controls) per ui-ux-guidelines.md
- All new interactive elements need aria-labels (accessibility rules)
- Tests required for all new code (TDD workflow)
- Lesson 003: Verify CSS variables across theme modes for any new styling
- Lesson 004: fakeTimers requires shouldAdvanceTime for userEvent compatibility in tests

## Context for Implementer

### Files to read first

- `src/components/CharacterPanel/TriggerDropdown.tsx` — current trigger dropdown implementation
- `src/components/CharacterPanel/SkillRow.tsx` — renders trigger, target, selector, filter fields
- `src/components/CharacterPanel/FilterControls.tsx` — filter UI, needs conditional rendering based on target
- `src/engine/skill-registry.ts` — `SKILL_REGISTRY` entries with `defaultTrigger` fields
- `.docs/visual-specs/skill-row.md` — current visual spec (will need updating after this change)

### What NOT to change

- `src/engine/triggers.ts` — no engine changes
- `src/engine/types.ts` — no type changes
- `src/engine/game-decisions.ts` — no evaluation pipeline changes
- Filter condition dropdown in `FilterControls.tsx` — filter already excludes "always" and does not have a scope concept. Leave as-is.

## Test Design Guidance

### TriggerDropdown tests

- Render with `condition: "always"` -> assert `+ Condition` button visible, no scope/condition dropdowns
- Click `+ Condition` -> assert condition dropdown appears with 7 options (no "always"), scope dropdown appears (defaulting to first valid scope for default condition)
- Click `x` -> assert returns to `+ Condition` button, store trigger is `{ scope: "enemy", condition: "always" }`
- Select `targeting_me` -> assert scope dropdown disappears, store scope is "enemy"
- Select `channeling` -> assert scope dropdown appears with enemy/ally only (no self), qualifier select appears
- Select `hp_below` -> assert scope dropdown has self/ally/enemy, value input appears
- Change condition from `hp_below` (scope=self) to `channeling` -> assert scope resets to "enemy" (since self is not valid for channeling)
- NOT toggle: visible when trigger active, hidden when unconditional
- Negated resets to false when trigger removed via `x`

### SkillRow integration tests

- Skill with `target: "self"` -> assert no selector fieldGroup rendered, no filter controls rendered
- Change target from `enemy` to `self` -> assert selector and filter controls disappear
- Change target from `self` to `enemy` -> assert selector and filter controls reappear
- Skill with existing filter + change target to `self` -> filter hidden. Change back -> filter reappears with previous config

### AND trigger tests (deferred if AND triggers not in data model)

- AND trigger condition dropdown has 7 options (no "always")
- AND trigger scope is restricted per condition (same rules as primary)

### Registry default tests

- Kick (defaultTrigger: channeling) renders with active trigger, not `+ Condition` button
- Light Punch (no defaultTrigger) renders with `+ Condition` button
- Remove Kick's trigger -> renders as unconditional

## Not Testing

- Engine trigger evaluation behavior (unchanged)
- Store action internals (already tested)
- Filter condition dropdown options (unchanged)
- Visual regression / pixel-level layout (no visual testing infrastructure)
- Sentence preview rendering (future feature, not part of this spec)
