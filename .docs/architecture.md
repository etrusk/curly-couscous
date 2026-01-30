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
- **Data-Driven Targeting**: Selectors and triggers as declarative data interfaces (not functions)
- **Command Pattern**: State mutations via named actions for history/undo support
- **CSS Custom Property Theming**: Theme switching via `:root` data attributes (Phase 5 - planned)
- **Functional Components with Hooks**: Custom hooks for shared logic
- **Selector-based Subscriptions**: Zustand selectors for fine-grained re-renders
- **Local State for UI Concerns**: Transient UI state (hover, tooltips) uses local React state, not Zustand (ADR-004)

## Project Structure

```
src/
├── engine/           # Pure TypeScript game logic (no React)
│   ├── types.ts      # Character, Skill, Trigger, Selector, Action, etc.
│   ├── game.ts       # Core tick processing
│   ├── combat.ts     # Attack resolution, damage calculation
│   ├── movement.ts   # Movement, collision resolution
│   ├── pathfinding.ts # A* pathfinding algorithm with binary heap
│   ├── selectors.ts  # Target selection strategies
│   ├── triggers.ts   # Trigger condition evaluation
│   └── skill-registry.ts # Centralized skill definitions (ADR-005)
├── stores/           # Zustand stores
│   └── gameStore.ts  # Game state + selectors (BattleViewer selectors included)
#   Future stores (planned):
#   ├── uiStore.ts    # UI state (selected, modes, visibility)
#   └── accessibilityStore.ts
├── components/       # React components (view layer)
│   ├── BattleViewer/ # Grid, Cell, Token, IntentLine, IntentOverlay, CharacterTooltip
│   ├── SkillsPanel/  # Skill configuration with category/strategy dropdowns
│   ├── InventoryPanel/ # Skill inventory with assign/remove for selected friendly characters
│   ├── RuleEvaluations/ # Formatters and display components (used by CharacterTooltip)
│   ├── EventLog/     # (planned)
│   └── common/       # (planned)
├── hooks/            # Custom React hooks
└── styles/           # CSS Modules + theme definitions
```

## Critical Constraints

- Must support TypeScript 5.x strict mode
- No external API calls (client-side only)
- All game logic must be testable without React
- Accessibility: Never rely on color alone (shape + pattern redundancy)
- Color palette: Okabe-Ito colorblind-safe (friendly: #0072B2, enemy: #E69F00)
- Minimum 3:1 contrast ratio on interactive elements
- TDD workflow required per project rules

## Testing Guidelines

- Unit tests for engine logic: Pure functions, no React
- Component tests: React Testing Library, user-centric
- No mocking game engine in component tests (use real engine)
- Test accessibility settings via class/attribute assertions

## Accessibility Requirements

- Shape redundancy: Circle (friendly), Diamond (enemy)
- Pattern fills: Solid (friendly), Diagonal stripes (enemy)
- High contrast mode option (Phase 5 - planned)
- UI scale: 75% to 150% (Phase 5 - planned)
