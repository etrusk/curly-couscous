# Auto Battler Design Spec v0.3 (LLM-Optimized Format)

## Document Metadata
- Version: 0.3
- Status: Ready for implementation
- Subtitle: Minimal Implementation with UI/UX Integration

## 1. Overview

A tick-based auto battler with a priority-based skill system inspired by FFXII gambits, Dragon Age tactics, and Pillars of Eternity AI. Characters evaluate a list of skills each tick, executing the first one whose conditions are met. Actions have tick costs and target a character's cell at the moment of commitment, enabling dodging through reactive movement.

### 1.1 Design Vision

**Emergent complexity from simple rules:** Inspired by Conway's Game of Life, Dwarf Fortress, and Rimworld—systems where a small set of understandable rules interact to produce surprising, complex, and delightful outcomes. Players should be able to hold the entire ruleset in their heads, yet still discover new tactical possibilities hundreds of hours in. The depth comes from interaction, not from volume of mechanics.

**Roguelike feel:** Every run is new, exciting, and winnable. Variance creates fresh tactical puzzles each session. No "solved" optimal strategies—the best approach depends on what you're given and what you're facing. Failure is a teacher, not a wall. Victory feels earned because it required adaptation, not memorization. (Full roguelike structure is a future iteration; the foundation supports it.)

**Clarity over cleverness:** Sacrifice cool ideas for the sake of clarity every time. Into the Breach's developers spent approximately 50% of development time on UI refinement alone, guided by this principle. Every player death should feel deserved rather than random. Complete information enables meaningful decisions—show players exactly what will happen so they can plan accordingly.

**Progressive disclosure serving player agency:** Show the minimum needed for immediate decisions, reveal depth on demand, preserve the ability to override automation at any moment, and always let players see and understand why the AI made each choice. This transforms an inherently complex system into one that feels like a natural extension of player skill rather than an opaque black box.

### 1.2 Design Goals

1. Emergent tactical gameplay through simple, composable rules
2. Readable battlefield state at a glance via intent visualization
3. Transparent AI decision-making for player understanding and debugging
4. Accessible to general gamers, not just tactics veterans
5. Foundation for future complexity (equipment, more skills, speed stats, roguelike meta-progression)


## 2. Grid System

### 2.1 Grid Properties

- Size: 12×12 cells
- Origin: (0,0) at top-left
- Occupancy: 1 character per cell
- Distance metric: Chebyshev (8-directional; diagonals cost 1)

### 2.2 Movement Tiebreaking

When multiple cells are equidistant to target, resolve in this order:
1. Prefer horizontal movement (lower X difference)
2. Then vertical movement (lower Y difference)
3. Then lower Y coordinate
4. Then lower X coordinate

### 2.3 Collision Resolution

When characters attempt to enter the same cell:

**Blocker wins:** A stationary character always holds their ground. Moving characters cannot displace them.

**Two movers, same destination:** The character with the lower slot position (order added to battle) wins. The losing character's move fails; they remain in their original cell.

### 2.4 Visual Clutter Management

The 12×12 grid is larger than Into the Breach's 8×8, requiring deliberate clutter management:

- Layered transparency: Overlapping threat zones show additive danger through alpha blending
- Numbered badges: Show threat count per tile when multiple intents target the same cell
- Hover-to-expand: Collapsed information expands on mouse hover
- Intent toggles: Separate toggles for friendly intents, enemy intents, and movement destinations
- Minimap consideration: Future iteration may add threat-density minimap for battlefield overview


## 3. Characters

### 3.1 Character Properties

- HP: 100
- Skill slots: 3 initial, up to 6 unlockable
- Factions: Friendly or Enemy (affects targeting only)

Characters are otherwise homogeneous in the minimal implementation. Differentiation comes from skill loadout and priority configuration.

### 3.2 Visual Identification

Characters use redundant encoding for faction identification (colorblind-safe):

**Friendly faction:**
- Color: Blue (#0072B2)
- Shape: Circle or Rectangle frame
- Pattern: Solid fill

**Enemy faction:**
- Color: Orange (#E69F00)
- Shape: Diamond frame
- Pattern: Diagonal stripes

Shape encoding follows NATO military symbology (APP-6) conventions, designed to function even in monochrome displays.

### 3.3 Placement

- Battle arena starts empty
- Characters added/removed via UI buttons
- Free placement anywhere on grid
- Slot position determined by order added (used for collision tiebreaking)


## 4. Tick System

The battle progresses in discrete ticks. Tick 0 is the initial state. Each tick consists of two phases:

### 4.1 Decision Phase

All characters evaluate simultaneously based on current game state:

1. If mid-action (tick cost not yet paid), continue current action
2. Otherwise, scan skill list top-to-bottom
3. Select the first skill whose conditions are all met
4. Lock targeting to the target's current cell at commit time
5. If no skill is valid, idle (no action)

**Important:** Characters cannot react to same-tick enemy decisions. All decisions are made against the game state at the start of the tick. The `my_cell_targeted_by_enemy` condition only detects locked-in actions from previous ticks (i.e., multi-tick skills already in progress).

### 4.2 Resolution Phase

All actions resolve simultaneously:

1. For attacks: check if target is still in the locked cell
   - If yes: apply damage
   - If no: miss (target dodged)
2. For movement: apply collision resolution, then move successful characters
3. Apply any other effects
4. Remove characters with HP ≤ 0

**Simultaneous resolution:** Damage is applied simultaneously. If two characters kill each other on the same tick, both die (potential draw condition).


## 5. Skills

### 5.1 Skill Structure

Each skill has these properties:
- Name: Display name
- Tick cost: Ticks to complete (action locks character for this duration)
- Range: Maximum Chebyshev distance to valid target
- Effect: Damage, movement, or other outcome
- Default selector: Targeting used when no override specified

### 5.2 Starting Skills

#### 5.2.1 Light Punch

- Tick cost: 1
- Range: 1 (melee)
- Damage: 10
- Default selector: nearest_enemy

Fast but weak. Cannot be dodged (resolves same tick it's committed).

#### 5.2.2 Heavy Punch

- Tick cost: 2
- Range: 1 (melee)
- Damage: 25
- Default selector: nearest_enemy

Slow but powerful. The 2-tick wind-up creates a dodge window: enemies see the intent line on tick 1 and can move away before resolution on tick 2.

#### 5.2.3 Move

- Tick cost: 1
- Distance: 1 cell
- Default selector: nearest_enemy

Move has three modes (selectable in UI):
- **towards**: Move 1 cell closer to target
- **away**: Move 1 cell farther from target
- **hold**: No movement; character passes this tick

**Hold mode use case:** Prevents unwanted movement when no other skills are valid. Without it, a character with only [Punch, Move(towards)] would automatically advance when out of punch range. With [Punch, Move(hold)] as the priority list, the character stays put and waits for enemies to approach.


## 6. Targeting and Conditions

### 6.1 Condition Logic

Skills require both a valid target AND all triggers to be satisfied:

1. **Selector** chooses a target. If no valid target exists, the skill fails.
2. **Triggers** are additional boolean requirements. All must be true for the skill to fire.

A skill with only a selector (no triggers) activates whenever a valid target exists.

### 6.2 Target Selectors

Selectors determine which character to target. If multiple characters satisfy the selector, tiebreak by:
1. Lower Y coordinate
2. Then lower X coordinate

**Available selectors:**
- `nearest_enemy`: Closest enemy by Chebyshev distance
- `nearest_ally`: Closest ally (not self)
- `lowest_hp_enemy`: Enemy with lowest current HP
- `lowest_hp_ally`: Ally with lowest current HP
- `self`: Target self (for self-buffs, future skills)

### 6.3 Trigger Conditions

Triggers are boolean checks. All must be true for the skill to activate.

**Available triggers:**
- `enemy_in_range X`: True if any enemy within X cells
- `ally_in_range X`: True if any ally within X cells
- `hp_below X%`: True if own HP is below X%
- `my_cell_targeted_by_enemy`: True if any enemy has a locked-in action targeting this character's current cell

**Note on `my_cell_targeted_by_enemy`:** This only detects multi-tick actions committed on previous ticks. Same-tick Light Punches are invisible until resolution. This is the mechanical basis for "you can dodge slow attacks but not fast ones."

### 6.4 Selector Override

Each skill instance can override its default selector with any of the above selectors.


## 7. Intent Lines

Intent lines visualize what each character is doing or about to do, enabling at-a-glance battlefield reading. Following Into the Breach's philosophy: show 100% of what will happen before it happens.

**Intent lines are a player-facing visualization aid.** Characters cannot condition on same-tick enemy decisions—only on locked-in multi-tick actions from previous ticks.

### 7.1 Display Rules

- Shown at all times (visibility toggles in UI for each category)
- Appears for current tick's committed action
- Persists until action resolves
- Damage numbers displayed directly on target tiles (Into the Breach style)

### 7.2 Visual Encoding

**Friendly attack:**
- Line style: Solid
- Color: Blue (#0072B2)
- Endpoint: Filled arrowhead

**Enemy attack:**
- Line style: Solid
- Color: Orange (#E69F00)
- Endpoint: Filled arrowhead

**Friendly movement:**
- Line style: Dashed
- Color: Blue (#0072B2)
- Endpoint: Hollow circle at destination

**Enemy movement:**
- Line style: Dashed
- Color: Orange (#E69F00)
- Endpoint: Hollow diamond at destination

**Line specifications:**
- Confirmed actions: 3-4px width
- Potential/winding-up actions: 1-2px width with glow effect
- All lines have thin contrasting outline (white or black depending on background) for visibility

### 7.3 Commitment State

**Committed (1 tick remaining):** Normal width (3-4px), standard brightness

**Locked-in (2+ ticks remaining):** Thicker (4-5px), pulsing glow animation

### 7.4 Information Display on Tiles

When a cell is targeted by an attack:
- Damage number displayed in tile center
- Colored border matching attacker's faction
- Multiple attackers: Stack damage numbers, show combined total with breakdown on hover

### 7.5 Design Rationale

- Color = faction: Answers "friend or foe?" preattentively (most urgent question)
- Line style = action type: Solid = direct threat (attack), dashed = indirect (movement)
- Endpoint shape = faction redundancy: Circles for friendly, diamonds for enemy (colorblind-safe)
- Brightness/thickness = commitment: Distinguishes "resolving soon" from "still winding up"
- Orange line with damage number pointing at your character = dodge signal (for multi-tick attacks only)

### 7.6 Visibility Toggles

The UI provides separate toggles for:
1. Friendly attack intents
2. Enemy attack intents
3. Friendly movement intents
4. Enemy movement intents
5. Damage numbers overlay
6. All intents (master toggle)


## 8. Victory Conditions

- **Victory:** All enemies eliminated
- **Defeat:** All friendly characters eliminated
- **Draw:** Mutual elimination on same tick


## 9. User Interface

### 9.1 Layout

The UI consists of four panels:

**Battle Viewer (50% width, top):** The 12×12 grid with character tokens, intent lines, and damage numbers.

**Skills & Priority Panel (25% width, top-right):** Skill configuration using sentence-builder UI.

**Rule Evaluations Panel (25% width, top-right):** Real-time display of AI decision-making.

**Event Log (full width, bottom):** Chronological list of resolved actions. Sized to avoid scrollbar at 1080p resolution.

### 9.2 Battle Viewer (Column 1, 50%)

**Grid display:**
- 12×12 cells with subtle gridlines
- Character tokens with faction shape (circle/diamond) and HP bar
- Intent lines overlay with damage numbers
- Cell highlighting for movement destinations and targeted cells

**Character tokens:**
- Faction-colored background (blue/orange)
- Faction-shaped frame (circle/diamond)
- HP bar below token (green→yellow→red gradient)
- Current action icon overlay (sword for attacking, boot for moving)

**Controls:**
- Add character button (friendly/enemy)
- Remove character (click existing, confirm dialog)
- Intent visibility toggles (see Section 7.6)

**Battle controls:**
- Step Forward: Advance 1 tick
- Step Back: Rewind 1 tick
- Reset: Return to tick 0, restore initial state

### 9.3 Skill Configuration (Column 2, 25%)

**Design principle:** Use sentence-builder UI with natural language—it reads like English, making gambit configuration accessible to non-programmers.

**Character selector:**
- Horizontal tabs showing character tokens
- Selected character highlighted with border
- Character name and HP displayed below tabs

**Skill priority list:**
Each skill displays as a complete sentence-style rule with these elements:
- Drag handle (☰) for reordering via drag-and-drop
- Priority number [n] that auto-updates on reorder
- Enable/disable toggle (✓)
- "When [condition ▼]" trigger dropdown with natural language options
- "Use [skill ▼]" skill selection dropdown
- "[mode ▼]" mode selector for skills with modes (Move: towards/away/hold)
- "On/To/From [target ▼]" selector dropdown
- [Test] preview button—highlights what this rule would do right now
- [⋯] overflow menu (delete, duplicate, add condition)

**Condition dropdown options (natural language):**
- "always" (no trigger)
- "enemy in range [X]"
- "ally in range [X]"
- "my HP below [X]%"
- "my cell targeted by enemy"

**Target dropdown options (natural language):**
- "nearest enemy"
- "nearest ally"
- "lowest HP enemy"
- "lowest HP ally"
- "myself"

**Templates section:**
Collapsible panel with pre-built configurations:
- **Brawler:** Heavy Punch → Light Punch → Move towards
- **Cautious:** Move away (when targeted) → Light Punch → Move towards
- **Aggressive:** Heavy Punch → Move towards → Light Punch

Clicking a template populates the skill list; user can then modify.

### 9.4 Rule Evaluations (Column 3, 25%)

Real-time display of AI decision-making with three display modes (toggle in panel header):

#### 9.4.1 Simple Mode (Default for new players)

One-line status per character showing:
- Faction icon (🔵 for friendly, 🔶 for enemy)
- Character name
- Current action summary (e.g., "Moving toward Enemy 1" or "Heavy Punch → Player 1 (25 dmg)")

#### 9.4.2 Detailed Mode (Intermediate players)

Expandable rule list per character showing:
- Collapsed summary line (click to expand)
- Each rule with pass/fail indicator (✓ or ✗)
- Failure reason for skipped rules (e.g., "enemy not in range")
- Selected rule marked as "SELECTED"
- Target and destination information for selected rule

#### 9.4.3 Expert Mode (Advanced debugging)

Full state dump with:
- Pause and Step controls
- Current tick number and evaluation time
- Per-character expanded view showing:
  - Character ID, position, HP
  - Current action state
  - Each rule with full trigger evaluation:
    - Trigger type and parameters
    - Computed values (e.g., "Nearest enemy: Enemy 1 @ (5, 3)")
    - Distance calculations
    - Boolean result with reasoning (e.g., "FALSE (2 > 1)")
  - Selected rule with full selector evaluation:
    - All candidates with position, distance, HP
    - Selection reasoning
    - Final destination

**Visual feedback:**
- Pulse animation (300-500ms) when a rule fires
- Highlight changes only from previous tick (unchanged values dimmed)
- Update throttling: Display refreshes every 100-500ms regardless of internal tick rate

### 9.5 Event Log

Horizontal strip below all columns showing resolved actions.

**Features:**
- Chronological list with tick numbers
- Event aggregation: "Light Punch hit ×3" instead of three separate entries
- Filtering tabs: All | Attacks | Movement | Misses | Deaths
- Clickable entries: Clicking an event highlights the rule that triggered it
- Format: [Tick N] Character action → outcome
- Sized to avoid scrollbar at 1080p resolution

**Example entries:**
- [Tick 3] Player 1 Heavy Punch → Enemy 1: 25 damage (75 HP remaining)
- [Tick 5] Enemy 1 Heavy Punch → Player 1: MISS (target moved)


## 10. Battle Controls

- **Step Forward:** Advance 1 tick, resolve decision + resolution phases
- **Step Back:** Rewind 1 tick, restore previous state
- **Reset:** Return to tick 0, restore all initial positions and HP

The minimal implementation is not real-time—battles are stepped through manually for debugging and understanding.


## 11. Accessibility

### 11.1 Core Principle

Never rely on color alone to convey information. Every piece of information encoded by color must have a redundant encoding through shape, pattern, or text.

### 11.2 Colorblind-Safe Palette

Using Okabe-Ito colorblind-friendly palette, tested across all common color vision deficiencies:

- **Friendly:** Blue #0072B2, fallback: Circle shape
- **Enemy:** Orange #E69F00, fallback: Diamond shape
- **Damage:** Red #D55E00, fallback: "DMG" label option
- **Healing:** Bluish Green #009E73, fallback: "+" prefix
- **Neutral/UI:** Yellow #F0E442

### 11.3 Shape Redundancy

Following NATO APP-6 military symbology for universal recognition:

- **Friendly:** Rectangle/Circle frame, Solid fill
- **Enemy/Hostile:** Diamond frame, Diagonal stripes
- **Neutral:** Square frame, Empty/outline
- **Unknown:** Quatrefoil frame, Dotted pattern

### 11.4 Contrast Requirements

- Minimum 3:1 contrast ratio on all interactive elements
- 4.5:1 contrast ratio for body text
- Intent lines have contrasting outlines (light on dark, dark on light)
- Damage numbers displayed in high-contrast boxes

### 11.5 Accessibility Settings Menu

**Color Vision section:**
- Preset dropdown: Normal | Deuteranopia | Protanopia | Tritanopia
- Custom Colors: Friendly color picker, Enemy color picker

**Visual Aids section:**
- Show shape indicators on units (checkbox, default on)
- Show pattern fills (checkbox, default on)
- High contrast mode (checkbox, default off)
- Increase line thickness (checkbox, default off)

**Text & Labels section:**
- Show damage numbers (checkbox, default on)
- Show text labels on intents (checkbox, default off)
- UI Scale dropdown: 75% to 150%

Settings accessible before gameplay begins (main menu) and during gameplay (pause menu).


## 12. Onboarding

### 12.1 Design Principles

**Introduce concept before requiring use:** Players learn manual combat before seeing gambits. They observe pre-configured gambits working before modifying them.

**Three-item rule:** Working memory processes 3-5 items simultaneously, dropping to 3 during active learning. Never introduce more than 3 concepts at once.

**Watch → Observe → Modify → Create:** The learning progression:
1. Watch: Play manual combat, experience the problem (tedious micro-management)
2. Observe: See pre-built gambits execute, understand the solution
3. Modify: Tweak existing gambits, low-risk experimentation
4. Create: Build gambits from scratch, full agency

**Context-triggered tutorials:** Explain mechanics when relevant, not front-loaded.

### 12.2 Progressive Unlocking

**Tutorial 1:**
- Skills Available: Light Punch, Move
- Skill Slots: 2
- Features Unlocked: Basic movement and combat

**Tutorial 2:**
- Skills Available: Light Punch, Move, Heavy Punch
- Skill Slots: 3
- Features Unlocked: Intent reading, dodge mechanic

**Tutorial 3:**
- Skills Available: Same as Tutorial 2
- Skill Slots: 3
- Features Unlocked: Triggers: enemy_in_range

**Tutorial 4:**
- Skills Available: Same as Tutorial 2
- Skill Slots: 3
- Features Unlocked: Triggers: my_cell_targeted

**Post-tutorial:**
- Skills Available: All starting skills
- Skill Slots: 4
- Features Unlocked: All triggers, templates

**Mastery (future):**
- Skills Available: Future skills
- Skill Slots: 6
- Features Unlocked: Advanced selectors

### 12.3 Tutorial Sequence

#### Tutorial 1: "The Basics"
- Objective: Defeat one enemy
- Setup: 1 friendly vs 1 enemy, pre-configured with [Light Punch, Move towards]
- Teaching: Grid movement, tick system, basic combat
- Player action: Just click "Step Forward" and watch
- Completion: Enemy defeated

#### Tutorial 2: "Reading Intentions"
- Objective: Defeat enemy without taking damage
- Setup: Enemy has Heavy Punch; player has Light Punch, Move
- Teaching: Intent lines, dodge windows, tick costs
- Key moment: "See that orange line? That attack will hit that cell next tick. Move away!"
- Player action: Manual mode—click to select actions
- Completion: Enemy defeated with <50 damage taken

#### Tutorial 3: "Your First Rule"
- Objective: Configure a gambit
- Setup: Show gambit panel, pre-filled template
- Teaching: Rule priority, trigger conditions
- Player action: Drag to reorder rules, toggle rules on/off
- Completion: Win a fight using configured gambits

#### Tutorial 4: "Tactical Retreat"
- Objective: Survive using reactive movement
- Setup: Player outnumbered, must use `my_cell_targeted` trigger
- Teaching: Reactive triggers, defensive play
- Context trigger: First time player gets hit by a Heavy Punch they could have dodged, popup explains the `my_cell_targeted` trigger
- Player action: Add the dodge rule
- Completion: Survive 10 ticks

### 12.4 Safety Nets for Experimentation

**Undo system:**
- Every gambit change can be undone (Ctrl+Z or Undo button)
- "Revert to last working configuration" button
- "Reset to template" button per character

**Preview before commit:**
- Test button shows exactly what would happen with current configuration
- Highlighted cells show where each character would move/attack
- No commitment until player clicks "Step Forward"

**Recoverable failure:**
- Tutorial battles can be reset instantly
- "That didn't work—want to try a different approach?" prompt on failure
- No permanent consequences during learning


## 13. Data Model (Reference)

### 13.1 Character

```typescript
interface Character {
  id: string;
  name: string;
  faction: "friendly" | "enemy";
  slotPosition: number;  // order added to battle, used for tiebreaking
  hp: number;
  maxHp: number;
  position: { x: number; y: number };
  skills: Skill[];  // ordered by priority (index 0 = highest)
  currentAction: Action | null;
}
```

### 13.2 Skill

```typescript
interface Skill {
  id: string;
  name: string;
  tickCost: number;
  range: number;
  damage?: number;
  mode?: "towards" | "away" | "hold";  // for Move skill
  enabled: boolean;
  triggers: Trigger[];
  selectorOverride?: Selector;
}
```

### 13.3 Trigger

```typescript
interface Trigger {
  type: "enemy_in_range" | "ally_in_range" | "hp_below" | "my_cell_targeted_by_enemy";
  value?: number;  // for range X or X%
}
```

### 13.4 Selector

```typescript
interface Selector {
  type: "nearest_enemy" | "nearest_ally" | "lowest_hp_enemy" | "lowest_hp_ally" | "self";
}
```

### 13.5 Action

```typescript
interface Action {
  type: "attack" | "move" | "idle";
  skill: Skill;
  targetCell: { x: number; y: number };
  targetCharacter: Character | null;  // null for Move
  ticksRemaining: number;
}
```

### 13.6 UIState

```typescript
interface UIState {
  selectedCharacterId: string | null;
  debugPanelMode: "simple" | "detailed" | "expert";
  intentVisibility: {
    friendlyAttacks: boolean;
    enemyAttacks: boolean;
    friendlyMovement: boolean;
    enemyMovement: boolean;
    damageNumbers: boolean;
  };
  eventLogFilter: "all" | "attacks" | "movement" | "misses" | "deaths";
  accessibilitySettings: AccessibilitySettings;
}
```

### 13.7 AccessibilitySettings

```typescript
interface AccessibilitySettings {
  colorPreset: "normal" | "deuteranopia" | "protanopia" | "tritanopia" | "custom";
  customColors?: {
    friendly: string;  // hex color
    enemy: string;     // hex color
  };
  showShapeIndicators: boolean;
  showPatternFills: boolean;
  highContrastMode: boolean;
  increasedLineThickness: boolean;
  showDamageNumbers: boolean;
  showTextLabels: boolean;
  uiScale: number;  // 0.75 to 1.5
}
```


## 14. Implementation Priority

Based on "clarity over cleverness" principle, prioritize features that improve player understanding:

### Phase 1: Core Clarity (Must Have)

1. Blue/orange color scheme with shape redundancy
2. Damage numbers on targeted tiles
3. Sentence-builder skill configuration UI
4. Three-mode debug panel (simple mode default)
5. Basic accessibility settings (colorblind presets)

### Phase 2: Enhanced Usability (Should Have)

1. Drag-and-drop rule reordering
2. Test/preview button for rules
3. Event log aggregation and filtering
4. Template presets for skill configurations
5. Context-triggered tutorials

### Phase 3: Polish (Nice to Have)

1. Full custom color picker
2. Panel layout customization
3. Nested tooltips for complex concepts
4. Advanced tutorial progression tracking
5. Minimap for threat density


## 15. Future Iterations

The following are explicitly out of scope for v0.3 but noted for future design:

1. Cooldowns: Skills unusable for N ticks after use
2. Speed stat: Variable tick frequency per character
3. Equipment system: Weapons/armor that modify stats or grant skills
4. OR logic in conditions: Alternative trigger groups
5. Real-time playback: Play/pause at configurable tick speed
6. Additional skills: Ranged attacks, healing, buffs/debuffs, area effects
7. Terrain: Obstacles, difficult terrain, elevation
8. Damage types: Physical, magical, etc. with resistances
9. Skill acquisition: Roguelike progression, drops, unlocks
10. Panel customization: Dockable, resizable panels (VS Code style)


## Appendix A: Glossary

- **Tick:** One discrete time step in the battle
- **Gambit:** A skill + its conditions (borrowed from FFXII terminology)
- **Intent line:** Visual indicator showing a character's current/planned action
- **Chebyshev distance:** Grid distance where diagonals count as 1 (king's move in chess)
- **Commit:** The moment a character locks in an action and target cell
- **Resolution:** The moment an action's tick cost is paid and effects apply
- **Selector:** Targeting rule that chooses which character to affect
- **Trigger:** Boolean condition that must be true for a skill to activate
- **Progressive disclosure:** UI pattern: show minimum needed, reveal depth on demand
- **Redundant encoding:** Using multiple visual channels (color + shape + pattern) for same information


## Appendix B: Example Battle

### Setup
- Player 1 at position (3,3), skills: [Heavy Punch, Light Punch, Move(towards)]
- Enemy 1 at position (5,3), skills: [Heavy Punch, Light Punch, Move(towards)]

### Tick 1 — Decision Phase
- Player 1: Heavy Punch → Enemy at distance 2 → out of range → fail
- Player 1: Light Punch → out of range → fail
- Player 1: Move(towards) → valid → commits, locks destination (4,3)
- Enemy 1: Same evaluation → commits to (4,3)

### Tick 1 — Resolution Phase
- Both try to enter (4,3) → two movers, same destination
- Player 1 has lower slot position → Player 1 moves to (4,3)
- Enemy 1's move fails → stays at (5,3)

### Tick 2 — Decision Phase
- Player 1: Heavy Punch → Enemy at (5,3) is 1 cell away → in range → commits, locks (5,3), 2 ticks
- Enemy 1: Heavy Punch → Player at (4,3) is 1 cell away → commits, locks (4,3), 2 ticks

### Tick 2 — Resolution Phase
- Both Heavy Punches have 2 tick cost; ticksRemaining decremented
- No damage yet
- Intent lines now visible (thick/bright, showing locked-in attacks with "25" damage numbers)

### Tick 3 — Decision Phase
- Player 1: Mid-action (Heavy Punch, 1 tick remaining) → continue
- Enemy 1: Mid-action → continue

### Tick 3 — Resolution Phase
- Player 1's Heavy Punch resolves → Enemy 1 still at (5,3) → HIT → 25 damage
- Enemy 1's Heavy Punch resolves → Player 1 still at (4,3) → HIT → 25 damage
- Both now at 75 HP

### Tick 4 — Decision Phase
- Player 1: Heavy Punch → in range → commits to (5,3)
- Enemy 1: Heavy Punch → in range → commits to (4,3)

(Battle continues...)


## Appendix C: Dodge Example

### Setup
- Player 1 at position (4,3), skills: [Move(away) with trigger: my_cell_targeted_by_enemy, Light Punch, Move(towards)]
- Enemy 1 at position (5,3), skills: [Heavy Punch, Move(towards)]

### Tick 1 — Decision Phase
- Enemy 1: Heavy Punch → Player at (4,3) in range → commits, locks cell (4,3), 2 ticks
- Player 1: Move(away) → trigger `my_cell_targeted_by_enemy` is FALSE (no locked actions yet this tick) → fail
- Player 1: Light Punch → Enemy at (5,3) in range → commits

### Tick 1 — Resolution Phase
- Player 1's Light Punch → Enemy 1 at (5,3) → HIT → 10 damage
- Enemy 1: ticksRemaining decremented (still winding up)
- Intent line now shows Enemy 1's Heavy Punch targeting (4,3) with "25" damage number on tile

### Tick 2 — Decision Phase
- Player 1: Move(away) → trigger `my_cell_targeted_by_enemy` is TRUE (Enemy 1's Heavy Punch locked on (4,3)) → commits to (3,3)
- Enemy 1: Mid-action → continue

### Tick 2 — Resolution Phase
- Player 1 moves to (3,3)
- Enemy 1's Heavy Punch resolves → target cell (4,3) → Player 1 NOT THERE → MISS

### Result
Player 1 successfully dodged the Heavy Punch by reading the intent and moving away.


## Appendix D: UI Layout Description

### Battle Viewer with Intent Lines

The battle viewer shows a 12×12 grid with:
- Column headers 0-11 across the top
- Row headers 0-11 down the left side
- Character tokens at their positions:
  - Friendly units displayed as circles (●) with blue background
  - Enemy units displayed as diamonds (◆) with orange background
  - Character labels (e.g., "P1", "E1") below the token
- Intent lines connecting attackers to target cells:
  - Solid lines with arrowheads for attacks
  - Damage numbers displayed on target tiles
- HP bars below each character token

### Skill Configuration Panel

The skill configuration panel displays rules in sentence format:
- Each rule is a card with drag handle, priority number, and enable toggle
- Rules read as natural sentences: "When [condition] Use [skill] On [target]"
- Test and overflow menu buttons on each rule card
- "Add Rule" button at the bottom
- Templates dropdown at the top


## Changelog from v0.2

### Design Vision
- Added "Clarity over cleverness" principle from Into the Breach development philosophy
- Added "Progressive disclosure serving player agency" principle

### Grid System (Section 2)
- Added visual clutter management guidelines for 12×12 grid

### Characters (Section 3)
- Changed skill slots from 4 fixed to "3 initial, up to 6 unlockable"
- Added visual identification table with faction colors, shapes, and patterns
- Specified Okabe-Ito colorblind-safe palette (blue #0072B2, orange #E69F00)
- Added NATO APP-6 shape conventions

### Intent Lines (Section 7)
- Changed colors from green/red to blue/orange (colorblind-safe)
- Added endpoint shape redundancy (circles for friendly, diamonds for enemy)
- Added damage numbers displayed on target tiles
- Added line specifications (width in pixels, contrasting outlines)
- Added visibility toggle options (6 separate toggles)
- Expanded design rationale

### User Interface (Section 9)
- Skill Configuration: Complete redesign using sentence-builder UI pattern
  - Natural language dropdowns ("When [condition] Use [skill] On [target]")
  - Drag-and-drop reordering (not just arrow buttons)
  - Test button for previewing rule execution
  - Templates section with pre-built configurations
- Rule Evaluations: Three display modes (Simple, Detailed, Expert)
  - Simple mode as default for new players
  - Visual feedback specifications (pulse animation, change highlighting, update throttling)
- Event Log: Enhanced with aggregation, filtering, and clickable entries

### New Section: Accessibility (Section 11)
- Core principle: never rely on color alone
- Okabe-Ito colorblind-safe palette with hex values
- NATO APP-6 shape redundancy specifications
- Contrast requirements (3:1 minimum, 4.5:1 for text)
- Complete accessibility settings menu design

### New Section: Onboarding (Section 12)
- Design principles (introduce before requiring, three-item rule, context-triggered)
- Progressive unlocking table (skills and slots)
- Four-tutorial sequence with specific objectives and teaching points
- Safety nets for experimentation (undo, preview, recoverable failure)

### Data Model (Section 13)
- Added UIState model
- Added AccessibilitySettings model
- Added type field to Action model

### New Section: Implementation Priority (Section 14)
- Three-phase prioritization based on clarity principle

### Appendices
- Added damage number references to Examples B and C
- Added Appendix D: UI Layout Description (replaces ASCII art mockups)
