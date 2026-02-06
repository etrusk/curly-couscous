# Project Specification

## Project Overview

Tick-based auto battler with priority-based skill system (gambit system like FFXII).
Hexagonal grid (radius 5, 91 hexes) with character tokens, intent lines, damage overlays.
Client-side only for v0.3 (foundation for future roguelike meta-progression).

## Design Vision

**Emergent complexity from simple rules:** Inspired by Conway's Game of Life, Dwarf Fortress, and Rimworld—systems where a small set of understandable rules interact to produce surprising, complex outcomes. Players should hold the entire ruleset in their heads, yet discover new tactical possibilities hundreds of hours in.

**Roguelike feel:** Every run is new, exciting, and winnable. Variance creates fresh tactical puzzles. No "solved" optimal strategies—the best approach depends on what you're given and facing. Failure is a teacher, not a wall.

**Clarity over cleverness:** Sacrifice cool ideas for clarity every time. Into the Breach spent ~50% of development on UI refinement. Every player death should feel deserved. Complete information enables meaningful decisions—show exactly what will happen.

**Progressive disclosure:** Show minimum needed for immediate decisions, reveal depth on demand, preserve ability to override automation, always let players see why AI made each choice.

### Progressive Disclosure Implementation

Inspired by Baldur's Gate 3's nested tooltip system, the UI should layer information depth-first:

**Level 1 - Glanceable:** Critical info visible without interaction (HP bars, intent lines, next action)

**Level 2 - On-demand detail:** Additional context revealed through interaction:

- Collapsed sections for secondary information (e.g., "Show 8 more skill evaluations")
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
5. Foundation for future complexity (equipment, more skills, speed stats, roguelike meta-progression)

## Character Properties

- **HP:** 100 (maxHp: 100)
- **Skill slots:** 3 initial, up to 6 unlockable
- **Factions:** Friendly or Enemy (affects targeting only)
- **Slot position:** Order added to battle (used for collision tiebreaking)

Characters are homogeneous in v0.3. Differentiation comes from skill loadout and priority configuration.

## Starting Skills

### Innate vs Assignable Skills

Skills are classified as **innate** or **assignable**:

- **Innate skills** are automatically granted to new characters and cannot be removed. Move is the only innate skill.
- **Assignable skills** must be manually assigned from the Inventory panel. They can be added to or removed from characters freely.

New characters start with only innate skills. Players build their skill loadout by assigning skills from the shared inventory.

### Universal Skill Shape

Every skill instance has a uniform shape with four configurable fields:

- **Trigger**: Conditions that must be met for the skill to activate (AND logic)
- **Target**: Which group to select from (`enemy`, `ally`, or `self`)
- **Criterion**: How to pick within the target group (`nearest`, `furthest`, `lowest_hp`, `highest_hp`)
- **Behavior**: Action-specific modifier (e.g., `towards`/`away` for Move; empty string for skills without behavior choices)

This uniform shape means all skills are configured identically in the UI. The `behavior` field replaces Move's former `mode` field and is now universal to all skills.

### Skill Definitions

Each skill in the registry declares:

- `actionType`: Category (`attack`, `move`, or `heal`)
- `behaviors`: Available behavior values (e.g., `["towards", "away"]` for Move; `[]` for others)
- `defaultBehavior`: Default behavior when first assigned
- `maxInstances`: Maximum duplicates per character (Move: 3, all others: 1)
- `defaultTarget` and `defaultCriterion`: Defaults when first assigned

### Light Punch

- Tick cost: 0, Range: 1 (melee), Damage: 10
- Default target: enemy, Default criterion: nearest
- Fast and instant. Resolves immediately with no wind-up.
- **Assignable** (not innate), maxInstances: 2

### Heavy Punch

- Tick cost: 2, Range: 2, Damage: 25
- Default target: enemy, Default criterion: nearest
- Slow but powerful. 2-tick wind-up creates dodge window.
- **Assignable** (not innate), maxInstances: 2

### Heal

- Tick cost: 2, Range: 5, Healing: 25
- Default target: ally, Default criterion: lowest_hp
- Supportive skill. 2-tick wind-up with cell-based targeting (locks to target's cell at decision time).
- Heals target for 25 HP, capped at maxHp.
- Cannot target characters at full HP (rejected as no_target if no wounded allies in range).
- Healing resolves before combat in the Resolution Phase (ADR-006), making last-moment saves possible.
- **Assignable** (not innate), maxInstances: 2

### Skill Categories

Skills fall into three action categories:

- **Attack** (damage): Deal damage to enemies. Light Punch, Heavy Punch.
- **Heal** (healing): Restore HP to allies. Heal.
- **Move** (movement): Reposition on the grid. Move.

Skills fall into two timing categories:

- **Instant** (tickCost: 0): Resolve the same tick they are chosen. No wind-up, no telegraph. Guaranteed to hit if the target is in range at decision time. Trade telegraphing for reliability.
- **Wind-up** (tickCost >= 1): Take one or more ticks to resolve. Intent lines appear during wind-up, giving opponents time to react (dodge, reposition). Trade speed for power.

**Tactical rationale:** Instant attacks exist as an anti-kiting mechanic. Without them, characters with escape-route-weighted movement could indefinitely flee melee attackers, since every attack required at least 1 tick of wind-up during which the target could move away. Instant attacks guarantee hits on contact, forcing tactical tradeoffs: kiting is still viable against wind-up attacks, but closing to melee range carries real risk from instant attacks.

**Current instant skills:** Light Punch (tickCost: 0)
**Current wind-up skills:** Heavy Punch (tickCost: 2), Heal (tickCost: 2), Move (tickCost: 1)

### Move

- Tick cost: 1, Distance: 1 hex
- Default target: enemy, Default criterion: nearest
- Behaviors: **towards** (closer), **away** (farther)
- **Innate** (automatically assigned, cannot be removed), maxInstances: 3

### Skill Duplication

Any skill can be duplicated up to its registry-defined `maxInstances` limit. When duplicated, each instance gets a unique `instanceId` (ADR-009) and can be configured independently (different triggers, targets, criteria, behaviors). Move allows up to 3 instances; Light Punch, Heavy Punch, and Heal allow up to 2 instances each.

## Skill Assignment

Skills are a shared resource pool with faction exclusivity -- each assignable skill can only be assigned to one character per faction. Cross-faction sharing is allowed (a friendly and an enemy can have the same skill). Assignment is per-character: each character maintains their own skill list with independent priority ordering.

**Assigning a skill:**

- Skills are assigned from the Inventory panel via an "Assign" button
- Newly assigned skills are added to the top of the character's skill list (highest priority)
- A skill can only be assigned once per character (no duplicates)
- A skill can only be assigned to one character per faction (faction exclusivity). Assigning a skill to one friendly removes it from inventory for all friendlies, but it remains available for enemies.

**Removing a skill:**

- Non-innate skills can be removed via an "Unassign" button in the Skills & Priority panel
- Innate skills cannot be removed (no Unassign button shown)
- Duplicate skill instances (any skill with instanceCount > 1) show a "Remove" button on all instances. For innate skills, the store guards against removing the last instance. For non-innate skills, the "Remove" button appears in the Priority tab (SkillRow) and the "Unassign" button remains in the Loadout tab.
- Removing a skill returns it to the inventory immediately

**Skill registry:** All skill definitions are centralized in `src/engine/skill-registry.ts` (ADR-005). Adding or removing a skill from the game requires editing only this one file.

## Targeting System

### Target and Criterion

Each skill specifies a **target** (which group to select from) and a **criterion** (how to pick within that group).

**Targets:**

| Target  | Description                          |
| ------- | ------------------------------------ |
| `enemy` | Select from living enemy characters  |
| `ally`  | Select from living allies (not self) |
| `self`  | Target self (ignores criterion)      |

**Criteria:**

| Criterion    | Description              |
| ------------ | ------------------------ |
| `nearest`    | Closest by hex distance  |
| `furthest`   | Farthest by hex distance |
| `lowest_hp`  | Lowest current HP        |
| `highest_hp` | Highest current HP       |

3 targets x 4 criteria = 12 combinations, but `self` target always returns the evaluator regardless of criterion.

**Tiebreaking:** Lower R coordinate, then lower Q coordinate (consistent across all target+criterion combinations).

### Trigger Conditions

Skills can have 0, 1, or 2 triggers evaluated with AND logic. All triggers in a skill's trigger list must pass for the skill to activate.

**Trigger types:**

- `always`: Triggers unconditionally (no parameter)
- `enemy_in_range X`: True if any enemy within X hexes
- `ally_in_range X`: True if any ally within X hexes
- `hp_below X%`: True if own HP below X% of maxHp
- `ally_hp_below X%`: True if any ally (excluding self) has HP below X% of maxHp
- `my_cell_targeted_by_enemy`: True if enemy has locked-in action targeting this hex

**Trigger modifiers:**

- `NOT` (negation): Any trigger can be inverted with a NOT modifier. When applied, the trigger result is inverted (true becomes false, false becomes true). For example, "NOT hp_below 50%" triggers when HP is at or above 50%.

**Trigger logic:**

When a skill has multiple triggers, they are evaluated with AND logic—all triggers must pass for the skill to activate. A skill can have 0 triggers (always activates), 1 trigger, or 2 triggers (maximum). Empty trigger arrays are treated as always-pass (vacuous truth).

**Note:** `my_cell_targeted_by_enemy` detects any pending action targeting the cell. Wind-up actions (tickCost >= 1) have at least 1 tick of visibility before resolution. Instant actions (tickCost: 0) resolve the same tick they are chosen, so they cannot be dodged via this trigger.

### Selector Filters

Skills can optionally have a selector filter that validates the selected target after the selector picks it, but before the range check. If the filter fails, the skill is rejected and evaluation falls through to the next priority slot.

**Filter types:**

- `hp_below X%`: Passes when target's current HP is below X% of their maxHp (strict less-than)
- `hp_above X%`: Passes when target's current HP is above X% of their maxHp (strict greater-than)

**Evaluation order:** disabled -> cooldown -> hold -> triggers -> selector -> **filter** -> range check -> heal-full-HP check

Filters are per-instance configuration. Skills without a filter behave exactly as before.

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
2. Movement: Apply collision resolution, then move (ADR-010)
3. Attacks: Check if target still in locked hex -> hit or miss
4. Apply other effects
5. Remove characters with HP <= 0

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

**Towards mode:** Uses A\* pathfinding on the hex grid to find the optimal path around obstacles (other characters). All hex moves cost 1.0, producing natural paths without diagonal bias. When no path exists, the character stays in place.

**Away mode:** Uses single-step maximization with escape route weighting. Each candidate position is scored using a composite formula: `distance_from_target * escape_routes`, where escape routes are the count of unblocked adjacent hexes (0-6). This naturally penalizes vertex positions (3 routes) and edge positions (4 routes) compared to interior positions (6 routes), preventing AI from getting trapped when fleeing.

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

| Action Type | Color                           | Endpoint Marker                                       |
| ----------- | ------------------------------- | ----------------------------------------------------- |
| Attack      | Red-orange #d55e00 (vermillion) | Filled arrowhead (`arrowhead-attack`)                 |
| Heal        | Green #009e73 (bluish green)    | Cross/plus shape (`cross-heal`)                       |
| Movement    | Blue #0072b2                    | Faction-dependent: circle (friendly), diamond (enemy) |

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

Four-panel structure (v0.3 implementation):

1. **Battle Viewer (50% width):** Hexagonal grid (radius 5, 91 hexes) with tokens, intent lines, damage numbers. Hovering over character tokens displays rule evaluation tooltips. Currently uses CSS Grid rendering (SVG hex rendering planned in Phase 3).
2. **Skills Panel (25% width):** Sentence-builder UI for skill configuration (triggers, selectors, priority). Innate skills display an "Innate" badge next to the skill name. Non-innate skills display an "Unassign" button to return them to the inventory.
3. **Inventory Panel (25% width):** Displays all available skills from the centralized skill registry. Visible content when any character is selected; otherwise shows placeholder message. Skills can be assigned to or removed from the selected character.
4. **Event Log (bottom):** Planned for future release

### Auto-Focus Toggle

The header includes an "Auto-focus battle" checkbox (default: unchecked/off) that controls automatic UI focus switching when battle starts:

- **When enabled (checked):** Grid proportions shift to battle layout (30%/70%) and the character panel auto-switches to the Priority tab when `battleStatus` becomes `"active"`.
- **When disabled (unchecked, default):** Grid proportions remain at config layout (60%/40%) and the character panel stays on the current tab regardless of battle status.
- **Persistence:** Setting is stored in localStorage (key: `"auto-focus"`) and survives page reloads.
- **Mid-battle toggle:** Enabling auto-focus during an active battle immediately triggers the tab switch and layout change.

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

### Inventory Panel

The Inventory panel shows all skills available in the game, sourced from the centralized skill registry.

**Visibility states:**

| State                 | Header      | Body                                                       |
| --------------------- | ----------- | ---------------------------------------------------------- |
| No character selected | "Inventory" | Placeholder: "Select a character to view available skills" |
| Character selected    | "Inventory" | Skill list with assign/remove controls                     |

**Skill list items show:**

- Skill name
- Stats (tick cost, range, damage/healing or mode)
- "Assign" button (disabled when all skill slots are full)

The inventory panel only shows non-innate skills that are not assigned to any character of the selected character's faction. Skills assigned to characters of the opposite faction are still shown. To unassign a skill, use the "Unassign" button in the Skills & Priority panel.
