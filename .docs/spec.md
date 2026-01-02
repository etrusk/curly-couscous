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
- Fast but weak. Cannot be dodged (resolves same tick).

### Heavy Punch

- Tick cost: 2, Range: 1 (melee), Damage: 25
- Default selector: nearest_enemy
- Slow but powerful. 2-tick wind-up creates dodge window.

### Move

- Tick cost: 1, Distance: 1 cell
- Default selector: nearest_enemy
- Modes: **towards** (closer), **away** (farther), **hold** (pass)

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

**Note:** `my_cell_targeted_by_enemy` only detects multi-tick actions from previous ticks. Same-tick Light Punches are invisible until resolution.

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

### Movement Tiebreaking

When multiple cells are equidistant to target:

1. Prefer horizontal movement (lower X difference)
2. Then vertical movement (lower Y difference)
3. Then lower Y coordinate
4. Then lower X coordinate

### Collision Resolution

- **Blocker wins:** Stationary character holds ground; movers cannot displace
- **Two movers, same destination:** Random winner (seeded for replay consistency); losers stay in original cells

## Intent Lines

Intent lines visualize pending actions, enabling at-a-glance battlefield reading.

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
- Contrasting outline: Planned for Phase 5 (Accessibility Polish)

### Damage Display

- Damage numbers displayed in tile center
- Colored border matching attacker faction
- Multiple attackers: Stack numbers, show combined on hover

## Victory Conditions

- **Victory:** All enemies eliminated
- **Defeat:** All friendly characters eliminated
- **Draw:** Mutual elimination on same tick

## UI Layout

Four-panel structure:

1. **Battle Viewer (50% width):** 12×12 grid with tokens, intent lines, damage numbers
2. **Skills Panel (25% width):** Sentence-builder UI for skill configuration
3. **Rule Evaluations (25% width):** Real-time AI decision display (Simple/Detailed/Expert modes)
4. **Event Log (bottom):** Chronological resolved actions with filtering
