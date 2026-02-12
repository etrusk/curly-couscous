# Project Specification

> **Living document.** Reflects current implementation. Task-specific requirements (`.tdd/requirements.md`) take precedence when they conflict; the doc-syncer phase reconciles after completion.

## Project Overview

Tick-based auto battler with priority-based skill system (gambit system like FFXII).
Hexagonal grid (radius 5, 91 hexes) with character tokens, intent lines, damage overlays.
Client-side only.

## Design Vision

**Emergent complexity from simple rules:** Inspired by Conway's Game of Life, Dwarf Fortress, and Rimworld—systems where a small set of understandable rules interact to produce surprising, complex outcomes. Players should hold the entire ruleset in their heads, yet discover new tactical possibilities hundreds of hours in.

**Roguelike feel:** Every run is new, exciting, and winnable. Variance creates fresh tactical puzzles. No "solved" optimal strategies—the best approach depends on what you're given and facing. Failure is a teacher, not a wall.

**Clarity over cleverness:** Sacrifice cool ideas for clarity every time. Into the Breach spent ~50% of development on UI refinement. Every player death should feel deserved. Complete information enables meaningful decisions—show exactly what will happen.

**Progressive disclosure:** Show minimum needed for immediate decisions, reveal depth on demand, preserve ability to override automation, always let players see why AI made each choice.

### Visual Aesthetic

The UI follows a dense, monospace game HUD aesthetic designed for information-rich tactical display:

1. **Density over whitespace** -- Compact layouts with tight padding (0.25-0.5rem for rows, 1rem for sections) maximize visible information.
2. **Monospace unification** -- All text uses a monospace font stack (Fira Code / Cascadia Code / JetBrains Mono) creating terminal/HUD cohesion where data alignment is natural.
3. **Opacity-based text hierarchy** -- Visual hierarchy through opacity levels (87%/60%/38%/15%) rather than multiple font sizes.
4. **Controls invisible until needed** -- Buttons and selects use transparent backgrounds that reveal on hover, reducing visual noise.
5. **Color reserved for meaning** -- Base UI is achromatic; color only encodes game semantics (faction, action type, status).

**Font**: Monospace stack (`--font-mono`) for all game UI. Exception: Token SVG letters use `system-ui` for rendering compatibility.

**Theme**: Dark-theme-only during prototyping phase. Light and high-contrast themes are functional but not visually refined.

For full design token reference, see `.docs/ui-ux-guidelines.md`. For component-specific visual specifications, see `.docs/visual-specs/`.

### Visual Design Workflow

1. **Prototype** -- JSX/HTML mockup created and rendered in browser
2. **Approve** -- Human confirms visual direction
3. **Extract** -- Convert to LLM-readable spec in `.docs/visual-specs/*.md`
4. **Implement** -- Architect reads spec + `.docs/ui-ux-guidelines.md` + `architecture.md`
5. **Verify** -- Human confirms in browser

This workflow ensures LLM agents (who cannot evaluate visual output) have structured textual specifications to implement UI correctly.

### Progressive Disclosure Implementation

Inspired by Baldur's Gate 3's nested tooltip system, the UI should layer information depth-first:

**Level 1 - Glanceable:** Critical info visible without interaction (HP bars, intent lines, next action)

**Level 2 - On-demand detail:** Additional context revealed through interaction:

- Collapsed sections for secondary information (e.g., "Show 8 more skill evaluations")
- Skill name tooltips showing registry stats (action type, tick cost, range, damage/healing/distance/cooldown/behaviors) on hover/focus
- Nested tooltips for rule explanations
- Expandable decision chains showing AI reasoning

**Level 3 - Deep inspection:** Full detail for debugging and learning:

- Complete rule evaluation logs
- All considered alternatives and why they were rejected
- Frame-by-frame action resolution

**Implementation patterns:**

- Use native `<details>/<summary>` elements for keyboard accessibility
- Tooltips should nest (hover on a term in a tooltip reveals deeper definition)
- Progressive disclosure respects cognitive load—never show all information by default
- Screen reader friendly: collapsed state announced, keyboard navigable

## Design Goals

1. Emergent tactical gameplay through simple, composable rules
2. Readable battlefield state at a glance via intent visualization
3. Transparent AI decision-making for player understanding and debugging
4. Accessible to general gamers, not just tactics veterans
5. Foundation for future complexity (equipment, more skills, speed stats)

## Character Properties

- **HP:** 100 (maxHp: 100)
- **Skill slots:** 10
- **Factions:** Friendly or Enemy (affects targeting only)
- **Slot position:** Order added to battle (used for collision tiebreaking)

Characters are homogeneous. Differentiation comes from skill loadout and priority configuration.

## Starting Skills

### Innate vs Assignable Skills

Skills are classified as **innate** or **assignable**:

- **Innate skills** are automatically granted to new characters and cannot be removed. Move is the only innate skill.
- **Assignable skills** must be manually assigned from the Inventory section in the CharacterPanel. They can be added to or removed from characters freely.

New characters start with only innate skills. Players build their skill loadout by assigning skills from the shared inventory.

### Universal Skill Shape

Every skill instance has a uniform shape with four configurable fields:

- **Trigger**: A single condition that must be met for the skill to activate (scope + condition model)
- **Target**: Which group to select from (`enemy`, `ally`, or `self`)
- **Criterion**: How to pick within the target group (`nearest`, `furthest`, `lowest_hp`, `highest_hp`)
- **Behavior**: Action-specific modifier (e.g., `towards`/`away` for Move; empty string for skills without behavior choices)

This uniform shape means all skills are configured identically in the UI. The `behavior` field replaces Move's former `mode` field and is now universal to all skills.

### Skill Definitions

Each skill in the registry declares:

- `actionType`: Category (`attack`, `move`, `heal`, `interrupt`, or `charge`)
- `behaviors`: Available behavior values (e.g., `["towards", "away"]` for Move; `[]` for others)
- `defaultBehavior`: Default behavior when first assigned
- `defaultTarget` and `defaultCriterion`: Defaults when first assigned

### Light Punch

- Tick cost: 0, Range: 1 (melee), Damage: 10
- Default target: enemy, Default criterion: nearest
- Fast and instant. Resolves immediately with no wind-up.
- **Assignable** (not innate)

### Heavy Punch

- Tick cost: 2, Range: 2, Damage: 25
- Default target: enemy, Default criterion: nearest
- Slow but powerful. 2-tick wind-up creates dodge window.
- **Assignable** (not innate)

### Heal

- Tick cost: 2, Range: 5, Healing: 25
- Default target: ally, Default criterion: lowest_hp
- Supportive skill. 2-tick wind-up with cell-based targeting (locks to target's cell at decision time).
- Heals target for 25 HP, capped at maxHp.
- Cannot target characters at full HP (rejected as no_target if no wounded allies in range).
- Healing resolves before combat in the Resolution Phase (ADR-006), making last-moment saves possible.
- **Assignable** (not innate)

### Ranged Attack

- Tick cost: 1, Range: 4, Damage: 15, Cooldown: 2
- Default target: enemy, Default criterion: nearest
- Wind-up ranged attack. 1-tick wind-up creates dodge window.
- Range 4 enables backline damage at the cost of lower damage (15 vs Heavy Punch's 25).
- Dodgeable (tickCost 1, creates 1-tick intent line).
- **Assignable** (not innate)

### Dash

- Tick cost: 0, Range: 1, Distance: 2, Cooldown: 3
- Default target: enemy, Default criterion: nearest
- Behaviors: **towards** (closer), **away** (farther, default)
- Instant multi-step movement. Moves up to 2 hexes using iterative single-step pathfinding.
- If the second step is blocked, moves only 1 hex (partial movement). If the first step is blocked, stays in place.
- Each step respects blocker-wins collision rules independently.
- Default trigger: `{ scope: "enemy", condition: "in_range", conditionValue: 1 }` (dash away when enemy is adjacent).
- **Assignable** (not innate)

### Kick

- Tick cost: 0, Range: 1, Cooldown: 4
- Default target: enemy, Default criterion: nearest
- Default trigger: `{ scope: "enemy", condition: "channeling" }`
- Default filter: `{ condition: "channeling" }`
- Instant interrupt. Cancels target's current action if channeling. Wasted (with cooldown) if target is idle or cell is empty.
- Cancelled action's cooldown is NOT reset (already committed at decision time).
- Resolves before movement and combat, so interrupted actions never resolve.
- **Assignable** (not innate)

### Charge

- Tick cost: 1, Range: 3, Damage: 20, Distance: 3, Cooldown: 3
- Default target: enemy, Default criterion: nearest
- Default trigger: `{ scope: "enemy", condition: "in_range", conditionValue: 3 }`
- Wind-up combined move + attack. Moves up to 3 hexes toward locked target cell using greedy movement, then attacks if adjacent after movement.
- Each movement step respects blocker-wins collision rules independently.
- If movement fully blocked, attack only hits if already adjacent from original position.
- Dodgeable (tickCost 1, creates 1-tick intent line). Interruptible (Kick resolves before Charge).
- Charge damage is applied in the charge resolution phase, separate from regular combat. A character hit by Charge can also take regular attack damage the same tick.
- Resolves before regular movement (charger arrives before dodge-movers).
- **Assignable** (not innate)

### Skill Categories

Skills fall into five action categories:

- **Attack** (damage): Deal damage to enemies. Light Punch, Heavy Punch, Ranged Attack.
- **Heal** (healing): Restore HP to allies. Heal.
- **Move** (movement): Reposition on the grid. Move, Dash.
- **Interrupt** (action cancellation): Cancel enemy actions. Kick.
- **Charge** (combined move + attack): Rush toward target and attack. Charge.

Skills fall into two timing categories:

- **Instant** (tickCost: 0): Resolve the same tick they are chosen. No wind-up, no telegraph. Guaranteed to hit if the target is in range at decision time. Trade telegraphing for reliability.
- **Wind-up** (tickCost >= 1): Take one or more ticks to resolve. Intent lines appear during wind-up, giving opponents time to react (dodge, reposition). Trade speed for power.

**Tactical rationale:** Instant attacks exist as an anti-kiting mechanic. Without them, characters with escape-route-weighted movement could indefinitely flee melee attackers, since every attack required at least 1 tick of wind-up during which the target could move away. Instant attacks guarantee hits on contact, forcing tactical tradeoffs: kiting is still viable against wind-up attacks, but closing to melee range carries real risk from instant attacks.

**Current instant skills:** Light Punch (tickCost: 0), Dash (tickCost: 0), Kick (tickCost: 0)
**Current wind-up skills:** Heavy Punch (tickCost: 2), Heal (tickCost: 2), Move (tickCost: 1), Ranged Attack (tickCost: 1), Charge (tickCost: 1)

### Move

- Tick cost: 1, Distance: 1 hex
- Default target: enemy, Default criterion: nearest
- Behaviors: **towards** (closer), **away** (farther)
- **Innate** (automatically assigned, cannot be removed)

### Skill Duplication

Any skill can be duplicated up to the character's total skill slot limit (MAX_SKILL_SLOTS = 10). When duplicated, each instance gets a unique `instanceId` (ADR-009) and can be configured independently (different triggers, targets, criteria, behaviors).

## Skill Assignment

Skills are a shared resource pool with faction exclusivity -- each assignable skill can only be assigned to one character per faction. Cross-faction sharing is allowed (a friendly and an enemy can have the same skill). Assignment is per-character: each character maintains their own skill list with independent priority ordering.

**Assigning a skill:**

- Skills are assigned from the Inventory panel via an "Assign" button
- Newly assigned skills are added to the top of the character's skill list (highest priority)
- A skill can only be assigned once per character (no duplicates)
- A skill can only be assigned to one character per faction (faction exclusivity). Assigning a skill to one friendly removes it from inventory for all friendlies, but it remains available for enemies.

**Removing a skill:**

- Non-innate skills can be removed via an "Unassign" button on the SkillRow in config mode
- Innate skills cannot be removed (no Unassign button shown)
- Duplicate skill instances (any skill with instanceCount > 1) show a "Remove" button on all instances. For innate skills, the store guards against removing the last instance.
- Removing a skill returns it to the inventory immediately

**Skill registry:** All skill definitions are centralized in `src/engine/skill-registry.ts` (ADR-005). Adding or removing a skill from the game requires editing only this one file.

## Targeting System

### Target and Criterion

Each skill specifies a **target** (which group to select from) and a **criterion** (how to pick within that group).

**Targets:**

| Target    | Description                                                               |
| --------- | ------------------------------------------------------------------------- |
| `enemy`   | Select from living enemy characters                                       |
| `ally`    | Select from living allies (not self)                                      |
| `self`    | Target self (ignores criterion)                                           |
| `enemies` | All living enemies as a group (movement only, no criterion)               |
| `allies`  | All living allies excluding self as a group (movement only, no criterion) |

**Plural targets** (`enemies`, `allies`) reference entire groups rather than selecting a single character via criterion. They are valid only for movement behaviors (towards/away). Criterion and filters are bypassed -- criterion returns `null`, filters are skipped. Non-movement skills with plural targets are rejected. Empty groups cause the character to stay in place.

**Criteria:**

| Criterion             | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `nearest`             | Closest by hex distance                                |
| `furthest`            | Farthest by hex distance                               |
| `lowest_hp`           | Lowest current HP                                      |
| `highest_hp`          | Highest current HP                                     |
| `most_enemies_nearby` | Most enemies within 2 hexes of candidate (AoE-optimal) |

3 singular targets x 5 criteria = 15 combinations, but `self` target always returns the evaluator regardless of criterion. Plural targets (2) bypass criteria entirely. When target is `self`, the UI hides the SELECTOR (criterion) dropdown and FILTER controls entirely, since they have no effect on self-targeting skills.

**`most_enemies_nearby` details:** Counts enemies (evaluator's opposing faction) within a hardcoded 2-hex radius of each candidate. The candidate itself is excluded from its own nearby count (prevents self-counting when targeting enemies). Ties broken by position (lower R, then lower Q). Works with both enemy and ally target pools.

**Tiebreaking:** Lower R coordinate, then lower Q coordinate (consistent across all target+criterion combinations).

### Trigger Conditions

Each skill has exactly one trigger that must pass for the skill to activate. Triggers use a unified scope + condition model.

**Trigger structure:** `{ scope, condition, conditionValue?, qualifier?, negated? }`

- **scope** (`TriggerScope`): Determines which characters to evaluate against -- `"enemy"` (opposing faction), `"ally"` (same faction, excluding self), or `"self"` (evaluator only)
- **condition** (`ConditionType`): The check to perform -- `"always"`, `"in_range"`, `"hp_below"`, `"hp_above"`, `"targeting_me"`, `"channeling"`, `"idle"`, `"targeting_ally"`
- **conditionValue** (optional number): Threshold for conditions that need one (range distance, HP percentage)
- **qualifier** (`ConditionQualifier`, optional): Narrows condition matching (e.g., channeling a specific skill). Structure: `{ type: "action" | "skill", id: string }`
- **negated** (optional boolean): When true, inverts the condition result

**UI model (two-state triggers):** The trigger UI uses a two-state model. Skills are either unconditional (`condition: "always"`, shown as a `+ Condition` ghost button) or conditional (any non-always condition, shown with full trigger controls). "Always" is not a selectable option in the condition dropdown. The store representation is unchanged: unconditional skills have `trigger: { scope: "enemy", condition: "always" }`. Each non-always condition defines which scopes are valid via `CONDITION_SCOPE_RULES` in `TriggerDropdown.tsx` (e.g., `targeting_me` and `targeting_ally` imply `scope: "enemy"` and hide the scope dropdown). When the condition changes, scope auto-resets if the current scope is not valid for the new condition.

**Condition types:**

| Condition        | Scope      | Description                                                       | Example                                                        |
| ---------------- | ---------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `always`         | any        | Always passes                                                     | `{ scope: "enemy", condition: "always" }`                      |
| `in_range`       | enemy/ally | True if any character in pool within `conditionValue` hexes       | `{ scope: "enemy", condition: "in_range", conditionValue: 2 }` |
| `hp_below`       | self/ally  | True if character HP below `conditionValue`% of maxHp             | `{ scope: "self", condition: "hp_below", conditionValue: 50 }` |
| `hp_above`       | self/ally  | True if character HP above `conditionValue`% of maxHp             | `{ scope: "self", condition: "hp_above", conditionValue: 75 }` |
| `targeting_me`   | enemy      | True if any enemy has locked-in action targeting evaluator's cell | `{ scope: "enemy", condition: "targeting_me" }`                |
| `channeling`     | enemy/ally | True if any character in pool has a pending action                | `{ scope: "enemy", condition: "channeling" }`                  |
| `idle`           | enemy/ally | True if any character in pool has no pending action               | `{ scope: "enemy", condition: "idle" }`                        |
| `targeting_ally` | enemy      | True if any enemy has action targeting any living ally's cell     | `{ scope: "enemy", condition: "targeting_ally" }`              |

**Negation modifier:**

Any trigger can be inverted with `negated: true`. The condition result is flipped (true becomes false, false becomes true). For example, `{ scope: "self", condition: "hp_below", conditionValue: 50, negated: true }` triggers when HP is at or above 50%.

**Note:** `targeting_me` detects any pending action targeting the cell. Wind-up actions (tickCost >= 1) have at least 1 tick of visibility before resolution. Instant actions (tickCost: 0) resolve the same tick they are chosen, so they cannot be dodged via this trigger.

### Skill Filters

Skills can optionally have a filter that narrows the candidate pool before criterion selection (pre-criterion pool narrowing, ADR-016). The filter removes non-matching candidates from the target pool; the criterion then selects from the narrowed set. If the filtered pool is empty (but the base pool was not), the skill is rejected with `filter_failed`. Self-targeting skills bypass filter evaluation entirely (there is no pool to narrow).

**Filter structure:** `{ condition: ConditionType, conditionValue?, qualifier?, negated? }`

Filters use the same `ConditionType` and shared condition evaluator as triggers, applied per-candidate rather than existentially.

**Available filter conditions:**

| Condition        | Description                                                                |
| ---------------- | -------------------------------------------------------------------------- |
| `hp_below`       | Target's current HP below `conditionValue`% of maxHp (strict less-than)    |
| `hp_above`       | Target's current HP above `conditionValue`% of maxHp (strict greater-than) |
| `in_range`       | Target within `conditionValue` hexes of evaluator                          |
| `channeling`     | Target has a pending action (optional qualifier narrows to specific skill) |
| `idle`           | Target has no pending action                                               |
| `targeting_me`   | Target's action targets the evaluator's cell                               |
| `targeting_ally` | Target's action targets any living ally's cell                             |

**Evaluation order:** disabled -> cooldown -> hold -> triggers -> **filter (narrows pool)** -> criterion (selects from narrowed pool) -> range check -> heal-full-HP check

Filters are per-instance configuration (ADR-015). Skills without a filter behave exactly as before.

## Core Game Mechanics

### Tick System

Battle progresses in discrete ticks. Tick 0 is initial state.

**Decision Phase** (simultaneous evaluation):

1. If mid-action, continue current action
2. Scan skill list top-to-bottom
3. Select first skill whose conditions are met
4. Lock targeting to target's current hex
5. If no skill valid, idle

**Resolution Phase** (simultaneous execution):

1. Healing: Resolve heal actions first (ADR-006)
2. Interrupts: Cancel channeling targets' actions (Phase 7)
3. Charges: Greedy movement toward target + melee attack if adjacent (Phase 8)
4. Movement: Apply collision resolution, then move (ADR-010)
5. Attacks: Check if target still in locked hex -> hit or miss
6. Apply other effects
7. Remove characters with HP <= 0

**Important:** Characters cannot react to same-tick enemy decisions. All decisions are made against game state at tick start.

### Grid System

Hexagonal grid using axial coordinates {q, r} with pointy-top hex orientation creating flat-top board shape (ADR-007).

- **Shape:** Hexagonal map with radius 5 (91 total hexes)
- **Coordinates:** Axial {q, r} where valid hexes satisfy max(|q|, |r|, |q+r|) <= 5
- **Center:** {q: 0, r: 0}
- **Neighbors:** 6 directions (E, W, SE, NW, NE, SW)

### Distance Metric

Hex distance: `max(|dq|, |dr|, |dq+dr|)` (equivalent to `(|dq| + |dr| + |dq+dr|) / 2`). All neighbors are equidistant (distance 1). Uniform movement cost across all 6 directions.

### Movement System

Skills with a `distance` field specify how many hexes to move per use. Move has `distance: 1` (single-step), Dash has `distance: 2` (multi-step). Skills without a `distance` field default to 1.

**Multi-step movement:** Skills with `distance > 1` use `computeMultiStepDestination()` (singular targets) or `computeMultiStepPluralDestination()` (plural targets), which wrap the corresponding single-step function in an iterative loop. Each step independently applies pathfinding or best-hex selection using the original character positions as obstacles (decision-phase snapshot model). If any step is blocked, the character stops at the last reachable position (partial movement).

**Towards mode (singular target):** Uses A\* pathfinding on the hex grid to find the optimal path around obstacles (other characters). All hex moves cost 1.0, producing natural paths without diagonal bias. When no path exists, the character stays in place.

**Towards mode (plural target):** Uses candidate scoring (not A\*) to minimize average hex distance to all group members (centroid approximation without coordinate averaging, avoids off-grid positions). A\* is unsuitable for plural targets because it requires a single goal position. The nearest target in the group provides dq/dr values for positional tiebreaking.

**Away mode (singular target):** Uses single-step maximization with escape route weighting. Each candidate position is scored using a composite formula: `distance_from_target * escape_routes`, where escape routes are the count of unblocked adjacent hexes (0-6). This naturally penalizes vertex positions (3 routes) and edge positions (4 routes) compared to interior positions (6 routes), preventing AI from getting trapped when fleeing.

**Away mode (plural target):** Same escape-route-weighted scoring as singular away mode, but `distance` is the minimum distance to any target in the group (maximizing distance from the nearest threat). The nearest target provides dq/dr values for tiebreaking. The same comparator (`compareAwayMode`) is reused by constructing `CandidateScore` objects with aggregated distance values.

Tiebreaking hierarchy (when composite scores are equal):

1. Maximize resulting hex distance from target
2. Maximize resulting |dq|, then |dr|
3. Then lower R coordinate of candidate hex
4. Then lower Q coordinate of candidate hex

### Collision Resolution

- **Blocker wins:** Stationary character holds ground; movers cannot displace
- **Two movers, same destination:** Random winner (seeded for replay consistency); losers stay in original hexes

## Intent Lines

Intent lines visualize pending actions, enabling at-a-glance battlefield reading.

**Visibility:** Intent lines appear for all pending actions with `ticksRemaining >= 0`. Wind-up actions (tickCost >= 1) show intent lines during their entire wind-up period, giving opponents time to react. Instant actions (tickCost: 0) show intent lines only at the resolution tick (ticksRemaining = 0), since they resolve immediately with no wind-up.

### Visual Encoding

Intent lines encode three dimensions: action type (color + endpoint marker), faction (movement marker shape), and timing (line style + stroke width).

**Action-based colors (Okabe-Ito colorblind-safe palette):**

| Action Type      | Color                           | Endpoint Marker                                       |
| ---------------- | ------------------------------- | ----------------------------------------------------- |
| Attack           | Red-orange #d55e00 (vermillion) | Filled arrowhead (`arrowhead-attack`)                 |
| Heal             | Green #009e73 (bluish green)    | Cross/plus shape (`cross-heal`)                       |
| Movement         | Blue #0072b2                    | Faction-dependent: circle (friendly), diamond (enemy) |
| Interrupt/Charge | Red-orange #d55e00 (vermillion) | Filled arrowhead (`arrowhead-attack`)                 |

**Faction shape differentiation (movement only):** Movement markers retain faction-specific shapes (hollow circle for friendly, hollow diamond for enemy) for accessibility. Attack and heal markers are uniform across factions since color already distinguishes them from movement, and shape redundancy within attack/heal is not needed.

**Timing-based line style:**

| Timing                       | Line Style   | Stroke Width | Numeric Label  | Meaning             |
| ---------------------------- | ------------ | ------------ | -------------- | ------------------- |
| Immediate (ticksRemaining=0) | Solid        | 4px          | None           | Resolves now        |
| Future (ticksRemaining>0)    | Dashed (4 4) | 2px          | ticksRemaining | Resolves in N ticks |

### Line Specifications

- Immediate actions (ticksRemaining = 0): 4px solid stroke, 5px white outline
- Future actions (ticksRemaining > 0): 2px dashed stroke (4 4 pattern), 3px white outline, numeric label at line midpoint showing ticksRemaining
- Numeric labels: 12px bold font, action-colored fill, 3px white stroke outline with `paintOrder="stroke"` for readability
- Contrasting outline: White outline (`strokeWidth + 1`) behind all lines for visibility against any background
- Endpoint markers (arrowhead, cross, circle, diamond) encode action type and faction, independent of timing

### Targeting Line Visual Encoding

TargetingLine (shown during cell-targeting mode) uses the same two-line outline pattern as IntentLine:

- White contrast outline (`var(--contrast-line)`, `strokeWidth + 1`) rendered behind the main stroke
- Main stroke: gray (`var(--targeting-line-color)`), `1.5px`, dotted pattern `"1 3"`
- Both outline and main use `strokeLinecap="round"`
- Consistent with IntentLine's outline-behind-main layering (two `<line>` elements)

### Whiff Indicators

When a cell-targeted action (attack or heal) resolves against an empty cell (the target moved away), a whiff indicator appears on the hex grid:

- Faded hex fill at the target cell using action-type color (`--action-attack` for attacks, `--action-heal` for heals)
- Opacity: 0.2 (subtle, does not obscure other elements)
- Persists for the resolution tick only (1 tick), then disappears
- Multiple whiffs on the same cell in the same tick: last event's action type wins
- Renders above base hex fill but below intent lines (WhiffOverlay positioned between Grid and IntentOverlay)
- Driven by `WhiffEvent` in the game event history, filtered by `selectRecentWhiffEvents` selector

### Damage Display

- Damage numbers displayed in hex center
- Colored border matching attacker faction
- Multiple attackers: Stack numbers, show combined on hover

## Character Icons

Character tokens display alphabetical letters for visual distinction, making it easier to identify and reference individual characters during gameplay.

### Letter Assignment

- Letters are assigned based on `slotPosition` (order added to battle)
- First character: A, second: B, third: C, etc.
- After Z, continues with AA, AB, AC... (Excel-style column naming)
- Letters are unique per character within a battle

### Visual Design

- Letters are displayed centered within the token shape
- **Friendly tokens (circle):** White letter on blue background (#0072B2)
- **Enemy tokens (diamond):** White letter on orange background (#E69F00)
- Font size scales with token size (40px tokens use 16px font)
- High contrast ensures readability at small sizes

### Accessibility

- Accessibility target: WCAG 2.2 Level AA compliance
- Letters provide additional visual distinction beyond shape and color
- ARIA labels include letter for screen readers (e.g., "Character A, friendly")
- Supports colorblind users who may struggle with hue differentiation

### Implementation Details

- Letter mapping handled by `letterMapping` utility function
- Token component renders letter as SVG text element
- No impact on game logic—purely visual enhancement

## Victory Conditions

- **Victory:** All enemies eliminated
- **Defeat:** All friendly characters eliminated
- **Draw:** Mutual elimination on same tick

## UI Layout

Four-panel structure:

**Typography Scale**: All text uses `var(--font-mono)`. Key sizes: 16px/700 (page title), 1.1rem/600 (panel titles), 0.95rem/600 (section titles), 0.85rem (controls/battle mode), 0.75rem (badges/small). See `.docs/ui-ux-guidelines.md` for full table.

**Spacing Scale**: Key values: 8px (app padding), 12px (grid gap), 1rem (panel padding/section gap), 0.5rem (row padding/list gap), 0.25rem (control gap/padding). See `.docs/ui-ux-guidelines.md` for full table.

1. **Battle Viewer (~40% width):** Hexagonal grid (radius 5, 91 hexes) with tokens, intent lines, damage numbers. Hovering over character tokens displays rule evaluation tooltips. Uses CSS Grid rendering. Fixed `2fr 3fr` grid layout at all times.
2. **CharacterPanel (~60% width):** Single-view panel (no tabs) combining skill configuration, priority ordering, and inventory. Shows a skill list with enable/disable checkboxes, trigger/target/criterion/behavior dropdowns, priority reorder buttons, unassign buttons (non-innate), and duplicate/remove buttons. An Inventory section below the skill list shows assignable skills with Assign buttons (hidden when both factions are present on the board). During active battle, evaluation indicators (selected/rejected/skipped) appear alongside config controls.

### Character Tooltip

Hovering over a character token displays a tooltip showing:

- **Next Action:** Current or pending action with target and timing
- **Skill Priority List:** All skills in priority order with evaluation status (selected, rejected, skipped)
- **Collapsible sections:** Skipped skills collapsed by default for progressive disclosure

Tooltip positioning:

- Prefers right of token; falls back to left if constrained by viewport
- Vertically centered on token, clamped to viewport bounds
- 100ms leave delay allows hovering on tooltip content itself

Characters referenced by letter notation (A, B, C) matching battlefield tokens.

### Inventory Section

The Inventory section is rendered within PriorityTab below the skill list in config mode. It shows assignable skills from the centralized skill registry.

**Visibility:** Visible when a character is selected and only one faction is present on the board. Hidden when both factions are present on the board.

**Skill list items show:**

- Skill name (with hover/focus tooltip showing skill stats from the registry)
- "Assign" button (disabled when character has MAX_SKILL_SLOTS skills)

**Filtering:** The inventory only shows non-innate skills that are not assigned to any character of the selected character's faction. Skills assigned to characters of the opposite faction are still shown. To unassign a skill, use the "Unassign" button on the SkillRow.

### Cooldown Display

SkillRow displays cooldown state for skills with `cooldownRemaining > 0`:

- **Badge:** "CD: N" text badge shown next to the skill name, where N is the remaining tick count
- **Dimming:** The entire SkillRow receives reduced opacity (`.onCooldown` class, `opacity: 0.6`) to visually distinguish it from ready skills
- Skills with no cooldown or `cooldownRemaining === 0` show no cooldown indicator
- Cooldown display is visible in both config mode and battle mode, updating each tick as the value decrements

### Token Z-ordering and Deselection

**Z-ordering:** Token shapes, selection glow, and HP bars are never visually occluded by hex cells. The Grid SVG uses two-pass rendering: all hex polygons render first, then all tokens render second, ensuring tokens always appear on top in SVG paint order.

**Deselection:** Clicking an empty hex cell or the BattleViewer background area deselects the currently selected character (sets `selectedCharacterId` to `null`). Deselection only occurs in `idle` selection mode (not during placement or moving modes). Clicking a token still toggles selection as before.
