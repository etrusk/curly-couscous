# System Architecture

## Tech Stack

- Language: TypeScript 5.x (strict mode)
- Framework: React 18+
- State Management: Zustand + Immer middleware
- Build Tool: Vite 5
- Testing: Vitest + React Testing Library + @testing-library/user-event
- Styling: CSS Modules + CSS Custom Properties (for accessibility theming)

## Key Patterns

- **Pure Game Engine**: Core game logic in `/src/engine/` with no React dependencies
- **Centralized Skill Registry**: All skill definitions in `src/engine/skill-registry.ts` (ADR-005)
- **Hexagonal Grid System**: Axial coordinates {q, r}, pointy-top hex orientation (flat-top board shape), radius 5 (ADR-007)
- **Data-Driven Targeting**: Target + criterion pairs, triggers, and selector filters as declarative data interfaces (not functions)
- **Command Pattern**: State mutations via named actions for history/undo support
- **CSS Custom Property Theming**: Theme switching via `:root` data attributes (Phase 5 - planned)
- **Functional Components with Hooks**: Custom hooks for shared logic
- **Selector-based Subscriptions**: Zustand selectors for fine-grained re-renders
- **Local State for UI Concerns**: Transient UI state (hover, tooltips) uses local React state, not Zustand (ADR-004)
- **Action-Based Visual Encoding**: Intent line colors encode action type (attack/heal/move), not faction

## Project Structure

```
src/
├── engine/           # Pure TypeScript game logic (no React)
│   ├── types.ts      # Character, Skill, Trigger, Target, Criterion, Action, Position {q,r}
│   ├── hex.ts        # Hex grid utilities: distance, neighbors, validation, pixel conversion
│   ├── game.ts       # Core tick processing (barrel exports)
│   ├── game-core.ts  # Tick processing: healing → movement → combat (ADR-010)
│   ├── game-movement.ts # Move destination calculation with hex tiebreaking
│   ├── combat.ts     # Attack resolution, damage calculation
│   ├── healing.ts    # Heal resolution, HP restoration (ADR-006)
│   ├── movement.ts   # Movement, collision resolution
│   ├── pathfinding.ts # A* pathfinding on hex grid with binary heap
│   ├── selectors.ts  # Target selection strategies (hex distance, R/Q tiebreaking)
│   ├── selector-filters.ts # Post-selector target validation (hp_below, hp_above)
│   ├── triggers.ts   # Trigger condition evaluation
│   └── skill-registry.ts # Centralized skill definitions (ADR-005)
├── stores/           # Zustand stores
│   └── gameStore.ts  # Game state + selectors (BattleViewer selectors included)
#   Future stores (planned):
#   ├── uiStore.ts    # UI state (selected, modes, visibility)
#   └── accessibilityStore.ts
├── components/       # React components (view layer)
│   ├── BattleViewer/ # Grid, Cell, Token, IntentLine, IntentOverlay, CharacterTooltip
│   ├── CharacterPanel/ # Two-panel tabbed interface (Loadout + Priority tabs, SkillRow)
│   ├── SkillsPanel/  # (Legacy - to be deleted)
│   ├── InventoryPanel/ # (Legacy - to be deleted)
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

- **Grid**: `<svg>` root with `role="grid"`. Iterates `generateAllHexes(5)` to render 91 hex cells.
- **Cell**: SVG `<g>` containing `<polygon>` for hex shape. Uses `hexVertices()` for the 6-point polygon. `role="gridcell"` with `aria-label`.
- **Token**: SVG `<g>` with `transform="translate(cx-20, cy-20)"` to position at hex center. Internal coordinates (0..40) unchanged from standalone SVG.
- **Overlays**: IntentOverlay, DamageOverlay, and TargetingLineOverlay each render as separate `<svg>` elements with `position: absolute` overlay. All use identical viewBox for coordinate alignment.
- **ViewBox utility**: `computeHexViewBox(hexSize, radius)` dynamically computes bounds from hex geometry. Returns `{ viewBox, width, height }`. Used by Grid and all overlays.
- **Hex sizing**: Default `hexSize = 30`. Hex width = 60px, height ~52px. Column spacing = 45px, row spacing ~52px.
- **Event handling**: `pointer-events="all"` on Cell `<g>` elements. Hex-shaped polygon provides natural hit area. CSS `:hover` and `cursor: pointer` work on SVG elements.
- **Tooltip positioning**: Token's `<g>` element supports `getBoundingClientRect()` for portal tooltip anchoring (ADR-004).

## Character Panel Architecture

The CharacterPanel replaces the three-panel layout (BattleViewer + SkillsPanel + InventoryPanel) with a two-panel design (BattleViewer + CharacterPanel). The panel implements phase-based rendering with responsive grid proportions.

### Component Hierarchy

```
CharacterPanel (container, tab state, character selector)
├── LoadoutTab (equipped skills + inventory sections)
│   └── SkillRow (config mode: enable/disable, unassign, duplicate)
└── PriorityTab (priority configuration)
    └── SkillRow (config mode: reorder, dropdowns, AND combinator, duplicate)
        │        (battle mode: evaluation status, resolved target, rejection reason)
        └── TriggerDropdown (trigger type select, value input, remove button)
```

### Tab Behavior

- **Default tab (config phase)**: Loadout - Users primarily configure equipment and inventory
- **Battle phase auto-switch**: Priority tab auto-selects when battle starts
- **Tab memory**: Selected tab preserved when returning to config phase from battle
- **Keyboard/ARIA**: Tabs follow ARIA tab pattern with roles, aria-selected, aria-controls

### Phase-Based Layout

The App-level grid container uses data attributes to drive responsive proportions:

```css
[data-phase="config"] {
  --grid-cols: 2fr 3fr;
} /* 40% battle, 60% panel */
[data-phase="battle"] {
  --grid-cols: 7fr 3fr;
} /* 70% battle, 30% panel */
```

### Inline Evaluation Display

During battle phase, SkillRow shifts from config mode to battle mode:

- **Config mode** (Loadout/Priority tabs): Shows priority controls, dropdowns, enable/disable checkbox
- **Battle mode** (Priority tab only): Shows evaluation results with status icons
  - Selected: Green check mark + resolved target character (e.g., "→ Enemy B")
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

## Test Harness (Dev-Only)

A dev-only `window.__TEST_HARNESS__` API (`src/test-harness.ts`) provides read-only access to game state for smoke test verification. Conditionally loaded in `src/main.tsx` behind `import.meta.env.DEV` -- tree-shaken from production builds. Exposes 5 methods: `getState()`, `getCharacters()`, `getTick()`, `getBattleStatus()`, `getSelectedCharacterId()`. No mutation methods. Type declarations in `src/types/test-harness.d.ts`. See ADR-014.

Smoke-test-critical components also carry `data-testid` attributes (e.g., `battle-status`, `btn-step`, `character-panel`) for reliable element targeting.

## Testing Guidelines

- Unit tests for engine logic: Pure functions, no React
- Component tests: React Testing Library, user-centric
- No mocking game engine in component tests (use real engine)
- Test accessibility settings via class/attribute assertions
- Hex coordinates in tests must satisfy: `max(|q|, |r|, |q+r|) <= 5`

## Accessibility Requirements

- Shape redundancy: Circle (friendly), Diamond (enemy)
- Pattern fills: Solid (friendly), Diagonal stripes (enemy)
- Action-type color encoding: Red-orange (attack), Green (heal), Blue (move)
- Movement endpoint markers retain faction shapes for additional differentiation
- High contrast mode option (Phase 5 - planned)
- UI scale: 75% to 150% (Phase 5 - planned)
