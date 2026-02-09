# System Architecture

## Tech Stack

- Language: TypeScript 5.x (strict mode)
- Framework: React 19+
- State Management: Zustand + Immer middleware
- Build Tool: Vite 7 + React Compiler (babel-plugin-react-compiler for automatic memoization, ADR-020)
- Testing: Vitest + React Testing Library + @testing-library/user-event
- Styling: CSS Modules + CSS Custom Properties (terminal overlay tokens + legacy tokens, `light-dark()` + `color-mix()` theming, ADR-021)

## Key Patterns

- **Pure Game Engine**: Core game logic in `/src/engine/` with no React dependencies
- **Centralized Skill Registry**: All skill definitions in `src/engine/skill-registry.ts` (ADR-005)
- **Hexagonal Grid System**: Axial coordinates {q, r}, pointy-top hex orientation (flat-top board shape), radius 5 (ADR-007)
- **Data-Driven Targeting**: Target + criterion pairs, trigger (unified scope + condition), and skill filters as declarative data interfaces (not functions)
- **Shared Condition Evaluator**: `evaluateConditionForCandidate()` in `triggers.ts` used by both trigger evaluation (existential: `pool.some()`) and filter evaluation (per-element: `pool.filter()`)
- **Command Pattern**: State mutations via named actions for history/undo support
- **CSS Custom Property Theming**: Theme switching via `:root` data attributes with two-block + high-contrast pattern (ADR-021). `:root` uses `light-dark()` for ~43 theme-dependent variables and `color-mix()` for derived alpha tokens; `[data-theme="light"]` sets only `color-scheme: light`; `[data-theme="high-contrast"]` retains full overrides with `color-mix()` for bg tokens. Terminal overlay semantic tokens (`--ground`, `--surface`, `--border`, `--text-*`, `--accent`, `--danger`, `--success`, `--radius-*`, `--font-mono`) coexist with legacy tokens as an independent layer (ADR-019).
- **Functional Components with Hooks**: Custom hooks for shared logic
- **Selector-based Subscriptions**: Zustand selectors for fine-grained re-renders
- **Local State for UI Concerns**: Transient UI state (hover, tooltips) uses local React state, not Zustand (ADR-004)
- **Action-Based Visual Encoding**: Intent line colors encode action type (attack/heal/move/interrupt/charge), not faction

## Project Structure

```
src/
├── engine/           # Pure TypeScript game logic (no React)
│   ├── types.ts      # Character, Skill, SkillFilter, Trigger (scope+condition), TriggerScope, ConditionType, ConditionQualifier, Target, Criterion, Action, Position {q,r}, GameEvent (DamageEvent, DeathEvent, HealEvent, WhiffEvent, InterruptEvent, InterruptMissEvent, ChargeEvent)
│   ├── hex.ts        # Hex grid utilities: distance, neighbors, validation, pixel conversion
│   ├── game.ts       # Core tick processing (barrel exports)
│   ├── game-core.ts  # Tick processing: healing → interrupts → charges → movement → combat (ADR-010)
│   ├── game-movement.ts # Move destination calculation with hex tiebreaking
│   ├── combat.ts     # Attack resolution, damage calculation, WhiffEvent emission on miss
│   ├── healing.ts    # Heal resolution, HP restoration (ADR-006), WhiffEvent emission on miss
│   ├── interrupt.ts  # Interrupt resolution, action cancellation
│   ├── charge.ts     # Charge resolution (greedy movement + melee attack)
│   ├── movement.ts   # Movement, collision resolution
│   ├── pathfinding.ts # A* pathfinding on hex grid with binary heap
│   ├── selectors.ts  # Target selection strategies (hex distance, R/Q tiebreaking)
│   ├── selector-filters.ts # Pre-criterion candidate pool filtering (shared condition evaluator)
│   ├── triggers.ts   # Trigger condition evaluation + shared evaluateConditionForCandidate()
│   └── skill-registry.ts # Centralized skill definitions (ADR-005)
├── stores/           # Zustand stores
│   └── gameStore.ts  # Game state + selectors (BattleViewer selectors included, e.g., selectRecentWhiffEvents)
#   Future stores (planned):
#   ├── uiStore.ts    # UI state (selected, modes, visibility)
#   └── accessibilityStore.ts
├── components/       # React components (view layer)
│   ├── BattleViewer/ # Grid, Cell, Token, IntentLine, IntentOverlay, WhiffOverlay, CharacterTooltip
│   ├── CharacterPanel/ # Single-view panel (PriorityTab, SkillRow, SkillRowActions)
│   ├── RuleEvaluations/ # Formatters and display components (used by CharacterTooltip)
│   ├── EventLog/     # (planned)
│   └── common/       # (planned)
├── hooks/            # Custom React hooks
└── styles/           # CSS Modules + theme definitions
```

## Hex Grid Architecture

The grid system uses axial coordinates {q, r} with flat-top hexagonal orientation (ADR-007).

- **Coordinate system**: Axial {q, r}. Third cube coordinate derived as s = -q - r.
- **Map shape**: Hexagonal boundary with radius 5. Validity: `max(|q|, |r|, |q+r|) <= 5`.
- **Total hexes**: 91 (for radius 5)
- **Distance**: `hexDistance(a, b)` = `max(|dq|, |dr|, |dq+dr|)`. Uniform cost (all neighbors distance 1).
- **Neighbors**: 6 directions: E(1,0), W(-1,0), SE(0,1), NW(0,-1), NE(1,-1), SW(-1,1)
- **Pixel conversion**: `hexToPixel()` for rendering, `pixelToHex()` for input (flat-top formulas)
- **Tiebreaking**: Lower R coordinate first, then lower Q coordinate (consistent across selectors and movement)
- **Key module**: `src/engine/hex.ts` provides all hex math utilities

### SVG Rendering (ADR-008)

The grid renders using SVG elements instead of CSS Grid (ADR-008). All rendering layers share a common viewBox coordinate system for pixel-perfect alignment.

- **Grid**: `<svg>` root with `role="grid"`. Uses two-pass rendering: Pass 1 renders all hex cells (polygons only, no tokens), Pass 2 renders all tokens directly. This ensures tokens always appear above hex cells in SVG paint order, preventing selection glow and HP bars from being occluded.
- **Cell**: SVG `<g>` containing `<polygon>` for hex shape. Uses `hexVertices()` for the 6-point polygon. `role="gridcell"` with `aria-label`. In the two-pass Grid, cells are rendered without tokens (character prop is unused).
- **Token**: SVG `<g>` with `transform="translate(cx-20, cy-20)"` to position at hex center. Internal coordinates (0..40) unchanged from standalone SVG. Rendered directly by Grid in pass 2 (not nested inside Cell).
- **Overlays**: IntentOverlay, WhiffOverlay, DamageOverlay, and TargetingLineOverlay each render as separate `<svg>` elements with `position: absolute` overlay. All use identical viewBox for coordinate alignment. Render order: Grid -> WhiffOverlay -> IntentOverlay -> TargetingLineOverlay -> DamageOverlay.
- **ViewBox utility**: `computeHexViewBox(hexSize, radius)` dynamically computes bounds from hex geometry. Returns `{ viewBox, width, height }`. Used by Grid and all overlays.
- **Hex sizing**: Default `hexSize = 30`. Hex width = 60px, height ~52px. Column spacing = 45px, row spacing ~52px.
- **Event handling**: `pointer-events="all"` on Cell `<g>` elements. Hex-shaped polygon provides natural hit area. CSS `:hover` and `cursor: pointer` work on SVG elements. With two-pass rendering, token clicks do not bubble through Cell handlers (separate `<g>` elements). Empty cell clicks and BattleViewer background clicks trigger deselection in idle selection mode.
- **Tooltip positioning**: Token's `<g>` element supports `getBoundingClientRect()` for portal tooltip anchoring (ADR-004).

## Character Panel Architecture

The CharacterPanel provides a single-view design (BattleViewer + CharacterPanel) with no tab navigation. The App uses a fixed `2fr 3fr` grid layout at all times (~40% battle viewer, ~60% character panel).

### Component Hierarchy

```
CharacterPanel (container, character selector)
└── PriorityTab (skill list + inventory section)
    ├── SkillRow (config mode: enable/disable checkbox, reorder, dropdowns)
    │   │        (battle mode: evaluation indicators shown alongside config controls)
    │   ├── SkillRowActions (unassign, remove, duplicate buttons)
    │   └── TriggerDropdown (scope + condition dropdowns, value input)
    └── Inventory section (hidden when both factions present: assignable skills with Assign buttons)
```

### Inline Evaluation Display

During battle phase, SkillRow shows evaluation indicators alongside config controls:

- **Single faction on board**: Shows enable/disable checkbox, priority controls, dropdowns, unassign/remove/duplicate buttons, inventory section
- **Both factions on board**: Config controls remain visible. Inventory section is hidden. When `battleStatus` is "active", evaluation indicators appear alongside config controls:
  - Selected: Green check mark + resolved target character (e.g., "-> Enemy B")
  - Rejected: Red X mark + rejection reason (e.g., "No valid target")
  - Skipped: Gray dash + visual de-emphasis
- Evaluation data flows from character's evaluation results to SkillRow via props
- Rejection reasons use formatters from `src/components/RuleEvaluations/` for consistency

## Critical Constraints

- Must support TypeScript 5.x strict mode
- No external API calls (client-side only)
- All game logic must be testable without React
- Accessibility: Never rely on color alone (shape + pattern redundancy)
- Color palette: Okabe-Ito colorblind-safe (friendly: #0072B2, enemy: #E69F00, action-attack: #d55e00, action-heal: #009e73, action-move: #0072b2)
- Minimum 3:1 contrast ratio on interactive elements
- TDD workflow required per project rules

## Testing Guidelines

- Unit tests for engine logic: Pure functions, no React
- Component tests: React Testing Library, user-centric
- No mocking game engine in component tests (use real engine)
- Test accessibility settings via class/attribute assertions
- Hex coordinates in tests must satisfy: `max(|q|, |r|, |q+r|) <= 5`

## Accessibility Requirements

- Compliance target: WCAG 2.2 Level AA
- Shape redundancy: Circle (friendly), Diamond (enemy)
- Pattern fills: Solid (friendly), Diagonal stripes (enemy)
- Action-type color encoding: Red-orange (attack), Green (heal), Blue (move)
- Movement endpoint markers retain faction shapes for additional differentiation
- High contrast mode option (Phase 5 - planned)
- UI scale: 75% to 150% (Phase 5 - planned)
