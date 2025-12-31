# Project Context

## Project Overview
Tick-based auto battler with priority-based skill system (gambit system like FFXII).
12×12 grid with character tokens, intent lines, damage overlays.
Client-side only for v0.3 (foundation for future roguelike meta-progression).

## Design Goals
1. Emergent tactical gameplay through simple, composable rules
2. Readable battlefield state at a glance via intent visualization
3. Transparent AI decision-making for player understanding and debugging
4. Accessible to general gamers, not just tactics veterans
5. Foundation for future complexity (equipment, more skills, speed stats, roguelike meta-progression)

## Core Game Mechanics
- **Tick-based Combat**: Battle progresses in discrete ticks with simultaneous decision and resolution phases
- **Priority-Based AI**: Characters evaluate skill lists top-to-bottom, executing first valid skill
- **Intent Visualization**: All pending actions shown via colored lines and damage numbers before execution
- **Dodge Mechanics**: Multi-tick skills create reaction windows—faster 1-tick skills cannot be dodged
- **Collision System**: Stationary characters block movement; collisions resolved by slot position (order added)

## Tech Stack
- Language: TypeScript 5.x (strict mode)
- Framework: React 18+
- State Management: Zustand + Immer middleware
- Build Tool: Vite 5
- Testing: Vitest + React Testing Library + @testing-library/user-event
- Styling: CSS Modules + CSS Custom Properties (for accessibility theming)

## Key Patterns
- **Pure Game Engine**: Core game logic in `/src/engine/` with no React dependencies
- **Strategy Pattern**: Selectors and triggers as composable strategy functions
- **Command Pattern**: State mutations via named actions for history/undo support
- **CSS Custom Property Theming**: Theme switching via `:root` data attributes
- **Functional Components with Hooks**: Custom hooks for shared logic
- **Selector-based Subscriptions**: Zustand selectors for fine-grained re-renders

## Project Structure
```
src/
├── engine/           # Pure TypeScript game logic (no React)
│   ├── types.ts      # Character, Skill, Trigger, Selector, Action, etc.
│   ├── game.ts       # Core tick processing
│   ├── combat.ts     # Attack resolution, damage calculation
│   ├── movement.ts   # Movement, collision resolution
│   ├── selectors.ts  # Target selection strategies
│   └── triggers.ts   # Trigger condition evaluation
├── stores/           # Zustand stores
│   ├── gameStore.ts  # Game state + history middleware
│   ├── uiStore.ts    # UI state (selected, modes, visibility)
│   └── accessibilityStore.ts
├── components/       # React components (view layer)
│   ├── BattleViewer/ # Grid, tokens, intent lines
│   ├── SkillsPanel/  # Sentence-builder UI
│   ├── RuleEvaluations/
│   ├── EventLog/
│   └── common/
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
- Colorblind presets: Normal, Deuteranopia, Protanopia, Tritanopia
- Shape redundancy: Circle (friendly), Diamond (enemy)
- Pattern fills: Solid (friendly), Diagonal stripes (enemy)
- High contrast mode option
- UI scale: 75% to 150%
