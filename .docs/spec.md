# Project Specification

## Project Overview

Tick-based auto battler with priority-based skill system (gambit system like FFXII).
12×12 grid with character tokens, intent lines, damage overlays.
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

### Light Punch

- Tick cost: 1, Range: 1 (melee), Damage: 10
- Default selector: nearest_enemy
- Fast but weak. 1-tick wind-up visible before resolution.

### Heavy Punch

- Tick cost: 2, Range: 2, Damage: 25
- Default selector: nearest_enemy
- Slow but powerful. 2-tick wind-up creates dodge window.

### Move

- Tick cost: 1, Distance: 1 cell
- Default selector: nearest_enemy
- Modes: **towards** (closer), **away** (farther)

## Targeting System

### Target Selectors

- `nearest_enemy`: Closest enemy by Chebyshev distance
- `nearest_ally`: Closest ally (not self)
- `lowest_hp_enemy`: Enemy with lowest current HP
- `lowest_hp_ally`: Ally with lowest current HP
- `self`: Target self (for self-buffs)

**Selector tiebreaking:** Lower Y → Lower X coordinate

### Trigger Conditions

- `enemy_in_range X`: Any enemy within X cells
- `ally_in_range X`: Any ally within X cells
- `hp_below X%`: Own HP below X%
- `my_cell_targeted_by_enemy`: Enemy has locked-in action targeting this cell

**Note:** `my_cell_targeted_by_enemy` detects any pending action targeting the cell. All actions have at least 1 tick of visibility before resolution.

## Core Game Mechanics

### Tick System

Battle progresses in discrete ticks. Tick 0 is initial state.

**Decision Phase** (simultaneous evaluation):

1. If mid-action, continue current action
2. Scan skill list top-to-bottom
3. Select first skill whose conditions are met
4. Lock targeting to target's current cell
5. If no skill valid, idle

**Resolution Phase** (simultaneous execution):

1. Attacks: Check if target still in locked cell → hit or miss
2. Movement: Apply collision resolution, then move
3. Apply other effects
4. Remove characters with HP ≤ 0

**Important:** Characters cannot react to same-tick enemy decisions. All decisions are made against game state at tick start.

### Distance Metric

Chebyshev distance (8-directional; diagonals cost 1)

### Movement System

**Towards mode:** Uses A\* pathfinding to find the optimal path around obstacles (other characters). Diagonal moves cost sqrt(2) while cardinal moves cost 1.0, producing natural-looking paths without unnecessary zig-zagging. When no path exists, the character stays in place.

**Away mode:** Uses single-step maximization with tiebreaking hierarchy:

1. Maximize resulting Chebyshev distance from target
2. Maximize resulting |dx|, then |dy|
3. Then lower Y coordinate
4. Then lower X coordinate

### Collision Resolution

- **Blocker wins:** Stationary character holds ground; movers cannot displace
- **Two movers, same destination:** Random winner (seeded for replay consistency); losers stay in original cells

## Intent Lines

Intent lines visualize pending actions, enabling at-a-glance battlefield reading.

**Visibility:** Intent lines appear for all pending actions with `ticksRemaining >= 0`. All actions (including Light Punch with tick cost 1) show intent lines for at least one tick before resolution.

### Visual Encoding

| Type              | Line Style | Color          | Endpoint         |
| ----------------- | ---------- | -------------- | ---------------- |
| Friendly attack   | Solid      | Blue #0072B2   | Filled arrowhead |
| Enemy attack      | Solid      | Orange #E69F00 | Filled arrowhead |
| Friendly movement | Dashed     | Blue #0072B2   | Hollow circle    |
| Enemy movement    | Dashed     | Orange #E69F00 | Hollow diamond   |

### Line Specifications

- Confirmed (1 tick remaining): 3px stroke
- Locked-in (2+ ticks): 4px stroke, pulsing animation
- Contrasting outline: White outline for visibility (implemented)

### Damage Display

- Damage numbers displayed in tile center
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

1. **Battle Viewer (50% width):** 12×12 grid with tokens, intent lines, damage numbers. Hovering over character tokens displays rule evaluation tooltips.
2. **Skills Panel (25% width):** Sentence-builder UI for skill configuration (triggers, selectors, priority)
3. **Rule Evaluations (25% width):** Empty placeholder panel preserving layout structure. Displays "Hover over characters to see evaluations" message.
4. **Event Log (bottom):** Planned for future release

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
