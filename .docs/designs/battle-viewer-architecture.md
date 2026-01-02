# Battle Viewer UI Architecture Design

<!-- PULSE: 2026-01-02 architect - Initial design for BattleViewer component -->

## Comprehensive Context Discovery Results

### Project Context

- **Appetite Constraints**: v0.3 scope - client-side only, 12×12 grid with intent lines
- **System Constraints**: React 18+, Zustand + Immer, CSS Modules, no external API calls
- **Workflow Requirements**: TDD workflow, pure engine logic testable without React
- **Session Context**: First UI component design, building on complete game engine

### Architectural Context

- **Existing Patterns**: Pure game engine in `/src/engine/`, selector-based Zustand subscriptions
- **Data Model**: [`Character`](src/engine/types.ts:33) has [`currentAction`](src/engine/types.ts:43) for intent visualization
- **Actions**: [`Action`](src/engine/types.ts:90) contains `type`, `targetCell`, `resolvesAtTick` for line rendering

---

## Design Summary

The Battle Viewer will use a **CSS Grid + SVG Overlay** hybrid approach, providing semantic HTML for the grid cells while using SVG for intent line rendering. This balances accessibility, maintainability, and rendering flexibility.

---

## 1. Component Hierarchy

```
src/components/BattleViewer/
├── index.tsx              # Public export
├── BattleViewer.tsx       # Container with state subscriptions
├── BattleViewer.module.css
│
├── Grid/
│   ├── Grid.tsx           # 12×12 CSS Grid container
│   ├── Grid.module.css
│   ├── Cell.tsx           # Individual cell (selection, hover)
│   └── Cell.module.css
│
├── Token/
│   ├── Token.tsx          # Character token (faction shape)
│   ├── Token.module.css
│   └── HealthBar.tsx      # HP visualization
│
├── IntentOverlay/
│   ├── IntentOverlay.tsx  # SVG overlay container
│   ├── IntentLine.tsx     # Single intent line
│   ├── Markers.tsx        # SVG marker definitions
│   └── intents.utils.ts   # Path computation utilities
│
├── DamageOverlay/
│   ├── DamageOverlay.tsx  # Damage numbers container
│   └── DamageNumber.tsx   # Individual damage display
│
└── hooks/
    ├── useGridDimensions.ts   # Responsive sizing
    ├── useIntentLines.ts      # Compute lines from actions
    └── useDamageNumbers.ts    # Extract damage from events
```

---

## 2. Rendering Approach Decision

### Recommendation: CSS Grid + SVG Overlay

| Layer          | Technology     | Purpose                         |
| -------------- | -------------- | ------------------------------- |
| Grid cells     | CSS Grid       | 12×12 layout, semantic HTML     |
| Tokens         | SVG (in cells) | Faction shapes (circle/diamond) |
| Intent lines   | SVG overlay    | Arbitrary paths between cells   |
| Damage numbers | SVG/HTML       | Positioned text overlays        |

### Rationale

| Approach              | Pros                                                               | Cons                                 |
| --------------------- | ------------------------------------------------------------------ | ------------------------------------ |
| **CSS Grid + SVG** ✅ | Semantic HTML, SVG line flexibility, built-in markers, scales well | Two coordinate systems to sync       |
| Pure SVG              | Single coordinate system                                           | Loses semantic HTML benefits         |
| Canvas                | High performance                                                   | No accessibility, manual hit testing |

**Decision**: CSS Grid + SVG Overlay provides the best balance of accessibility, maintainability, and rendering capability. The coordinate sync challenge is easily solved with a shared `cellSize` value.

---

## 3. State Subscription Strategy

### New Selectors for BattleViewer

Add to [`src/stores/gameStore.ts`](src/stores/gameStore.ts):

```typescript
/**
 * Minimal data needed for token rendering.
 * Extracted shape prevents re-renders when other character props change.
 */
export interface TokenData {
  id: string;
  position: Position;
  faction: Faction;
  hp: number;
  maxHp: number;
}

export const selectTokenData = (state: GameStore): TokenData[] =>
  state.gameState.characters.map((c) => ({
    id: c.id,
    position: c.position,
    faction: c.faction,
    hp: c.hp,
    maxHp: c.maxHp,
  }));

/**
 * Pending actions for intent line rendering.
 */
export interface IntentData {
  characterId: string;
  characterPosition: Position;
  faction: Faction;
  action: Action;
  ticksRemaining: number;
}

export const selectIntentData = (state: GameStore): IntentData[] => {
  const { tick, characters } = state.gameState;
  return characters
    .filter((c) => c.currentAction !== null)
    .map((c) => ({
      characterId: c.id,
      characterPosition: c.position,
      faction: c.faction,
      action: c.currentAction!,
      ticksRemaining: c.currentAction!.resolvesAtTick - tick + 1,
    }));
};

/**
 * Recent damage events for damage number display.
 */
export const selectRecentDamageEvents = (state: GameStore): DamageEvent[] => {
  const { history, tick } = state.gameState;
  // Show damage from current tick (persists briefly)
  return history.filter(
    (e): e is DamageEvent => e.type === "damage" && e.tick === tick,
  );
};
```

### Component Subscription Map

| Component          | Selector                            | Re-render Trigger        |
| ------------------ | ----------------------------------- | ------------------------ |
| `BattleViewer`     | `selectTick`, `selectBattleStatus`  | Tick advance, battle end |
| `Grid`             | None (pure)                         | Props only               |
| Token (via `Grid`) | `selectTokenData` (shallow compare) | Position/HP changes      |
| `IntentOverlay`    | `selectIntentData`                  | Action changes           |
| `DamageOverlay`    | `selectRecentDamageEvents`          | Damage events            |

**Optimization**: Use Zustand's shallow equality for array selectors to prevent unnecessary re-renders.

---

## 4. Intent Line Rendering

### Data Flow

```
Character.currentAction → selectIntentData → IntentOverlay → IntentLine[]
```

### Line Type Determination

```typescript
interface IntentLineProps {
  from: Position; // Character's current position
  to: Position; // action.targetCell
  type: "attack" | "move";
  faction: Faction;
  ticksRemaining: number;
}
```

### Visual Specification (from spec)

| Property             | Attack               | Move                                       |
| -------------------- | -------------------- | ------------------------------------------ |
| Stroke style         | Solid                | Dashed (`stroke-dasharray: 8 4`)           |
| Friendly color       | #0072B2 (blue)       | #0072B2                                    |
| Enemy color          | #E69F00 (orange)     | #E69F00                                    |
| Endpoint marker      | Filled arrowhead     | Hollow circle (friendly) / diamond (enemy) |
| Confirmed (1 tick)   | 3-4px stroke         | 3-4px stroke                               |
| Locked-in (2+ ticks) | 4-5px stroke + pulse | 4-5px stroke + pulse                       |

### SVG Marker Definitions

```tsx
// Markers.tsx
export function Markers() {
  return (
    <defs>
      {/* Attack arrowhead - filled */}
      <marker id="arrowhead-friendly" ...>
        <polygon points="0,0 10,5 0,10" fill="#0072B2" />
      </marker>
      <marker id="arrowhead-enemy" ...>
        <polygon points="0,0 10,5 0,10" fill="#E69F00" />
      </marker>

      {/* Move endpoints - hollow */}
      <marker id="circle-friendly" ...>
        <circle r="4" fill="none" stroke="#0072B2" strokeWidth="2" />
      </marker>
      <marker id="diamond-enemy" ...>
        <polygon points="5,0 10,5 5,10 0,5" fill="none" stroke="#E69F00" />
      </marker>
    </defs>
  );
}
```

### Pulsing Animation (CSS)

```css
@keyframes intent-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.intentLine--lockedIn {
  animation: intent-pulse 1s ease-in-out infinite;
}
```

---

## 5. Damage Number Positioning

### Requirements

- Display damage numbers at center of target cell
- Stack vertically when multiple attackers hit same cell
- Color border matches attacker faction
- Hover shows combined damage

### Implementation

```typescript
interface DamageNumberData {
  targetCell: Position;
  damages: Array<{
    amount: number;
    attackerFaction: Faction;
    attackerId: string;
  }>;
}

// Group by target cell, compute stack offsets
function groupDamageByCell(events: DamageEvent[]): DamageNumberData[] {
  const grouped = new Map<string, DamageNumberData>();
  for (const event of events) {
    const key = `${event.targetId}`; // Group by target
    // ... accumulate damages
  }
  return Array.from(grouped.values());
}
```

### Stacking Layout

```
    ┌─────────┐
    │   -10   │  ← First attacker
    │   -25   │  ← Second attacker
    │  [35]   │  ← Hover: combined total
    └─────────┘
```

---

## 6. Accessibility Implementation

### Shape Redundancy (WCAG 1.4.1)

| Faction  | Token Shape | Pattern          |
| -------- | ----------- | ---------------- |
| Friendly | Circle      | Solid fill       |
| Enemy    | Diamond     | Diagonal stripes |

```tsx
// Token.tsx
export function Token({ faction, ... }) {
  return faction === 'friendly'
    ? <circle ... />
    : <polygon points="..." />; // Diamond
}
```

### Pattern Fills (Colorblind Support)

```tsx
// PatternDefs.tsx - include in IntentOverlay
<defs>
  <pattern
    id="stripe-enemy"
    patternUnits="userSpaceOnUse"
    width="4"
    height="4"
    patternTransform="rotate(45)"
  >
    <line x1="0" y1="0" x2="0" y2="4" stroke="#E69F00" strokeWidth="2" />
  </pattern>
</defs>
```

### High Contrast Mode

```css
/* styles/themes.css */
:root {
  --color-friendly: #0072b2;
  --color-enemy: #e69f00;
  --grid-bg: #f5f5f5;
  --cell-border: #ddd;
}

:root[data-theme="high-contrast"] {
  --color-friendly: #0000ff;
  --color-enemy: #ff6600;
  --grid-bg: #ffffff;
  --cell-border: #000000;
}
```

### UI Scale (75-150%)

```css
.battleViewer {
  --ui-scale: 1;
  transform-origin: top left;
  transform: scale(var(--ui-scale));
}

/* Or use font-size based approach */
:root {
  --base-font-size: 16px;
  --ui-scale-factor: 1;
  font-size: calc(var(--base-font-size) * var(--ui-scale-factor));
}
```

### ARIA Labels

```tsx
<div role="grid" aria-label="Battle grid, 12 by 12">
  {cells.map((cell) => (
    <div role="gridcell" aria-label={getCellLabel(cell)}>
      {/* Token with aria-label for character info */}
    </div>
  ))}
</div>
```

---

## 7. Responsive Grid Sizing

### Hook Implementation

```typescript
// useGridDimensions.ts
export function useGridDimensions(containerRef: RefObject<HTMLElement>) {
  const [dimensions, setDimensions] = useState({ width: 600, cellSize: 50 });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      // Maintain aspect ratio, clamp size
      const gridSize = Math.min(Math.max(width * 0.95, 300), 800);
      setDimensions({
        width: gridSize,
        cellSize: gridSize / 12,
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [containerRef]);

  return dimensions;
}
```

### Constraints

| Property  | Min   | Max   | Default       |
| --------- | ----- | ----- | ------------- |
| Grid size | 300px | 800px | 50% container |
| Cell size | 25px  | 67px  | gridSize / 12 |

---

## 8. Phased Implementation Roadmap

### Phase 1: Core Grid Foundation (3-4 exchanges)

1. Create `BattleViewer` container component
2. Implement `Grid` with CSS Grid layout (12×12)
3. Implement `Cell` component with basic styling
4. Add `selectTokenData` selector to gameStore
5. Write component tests for Grid layout

**Deliverable**: Empty 12×12 grid renders correctly

### Phase 2: Token Rendering (3-4 exchanges)

1. Create `Token` component with faction-based SVG shapes
2. Implement circle (friendly) and diamond (enemy) shapes
3. Add `HealthBar` component for HP visualization
4. Connect tokens to grid cells based on position
5. Write tests for Token rendering

**Deliverable**: Characters appear on grid with HP bars

### Phase 3: Intent Line Overlay (4-5 exchanges)

1. Create `IntentOverlay` SVG container positioned over Grid
2. Implement `Markers` component with SVG marker definitions
3. Create `IntentLine` component with path rendering
4. Add `selectIntentData` selector to gameStore
5. Implement line styling (solid/dashed, colors, thickness)
6. Add pulsing animation for locked-in actions
7. Write tests for intent line rendering

**Deliverable**: Actions show as lines from character to target

### Phase 4: Damage Numbers (2-3 exchanges)

1. Create `DamageOverlay` container
2. Implement `DamageNumber` component
3. Add `selectRecentDamageEvents` selector
4. Implement stacking logic for multiple attackers
5. Write tests for damage display

**Deliverable**: Damage numbers appear at target cells

### Phase 5: Accessibility Polish (2-3 exchanges)

1. Add pattern fill definitions for colorblind support
2. Implement high contrast theme via CSS custom properties
3. Add `useGridDimensions` hook for responsive sizing
4. Add ARIA labels and roles
5. Write accessibility tests

**Deliverable**: Full a11y support per spec

### Phase 6: Integration & Testing (2-3 exchanges)

1. Integration tests with real game engine
2. Visual verification checklist
3. Documentation updates

**Deliverable**: Production-ready BattleViewer

---

## 9. File Dependencies

### New Files to Create

```
src/components/BattleViewer/
├── index.tsx
├── BattleViewer.tsx
├── BattleViewer.module.css
├── Grid/Grid.tsx
├── Grid/Grid.module.css
├── Grid/Cell.tsx
├── Grid/Cell.module.css
├── Token/Token.tsx
├── Token/Token.module.css
├── Token/HealthBar.tsx
├── IntentOverlay/IntentOverlay.tsx
├── IntentOverlay/IntentLine.tsx
├── IntentOverlay/Markers.tsx
├── IntentOverlay/intents.utils.ts
├── DamageOverlay/DamageOverlay.tsx
├── DamageOverlay/DamageNumber.tsx
├── hooks/useGridDimensions.ts
├── hooks/useIntentLines.ts
└── hooks/useDamageNumbers.ts

src/styles/
└── themes.css (or extend index.css)
```

### Files to Modify

- [`src/stores/gameStore.ts`](src/stores/gameStore.ts) - Add new selectors
- [`src/App.tsx`](src/App.tsx) - Import and render BattleViewer

---

## 10. Test Strategy

### Unit Tests (Vitest)

| Component         | Test Focus                                   |
| ----------------- | -------------------------------------------- |
| Grid              | 12×12 cell rendering, correct grid structure |
| Cell              | Click handling, hover state, aria attributes |
| Token             | Faction shape rendering (circle vs diamond)  |
| IntentLine        | Path computation, styling by type            |
| useGridDimensions | Responsive calculations                      |

### Integration Tests (React Testing Library)

| Test Case            | Description                            |
| -------------------- | -------------------------------------- |
| Character display    | Characters render at correct positions |
| Intent visualization | Actions show lines to targets          |
| Damage display       | Damage events show numbers             |
| State updates        | UI updates when gameStore changes      |

### Accessibility Tests

- Shape redundancy verification
- ARIA role/label presence
- High contrast mode toggle
- Keyboard navigation (future)

---

## 11. Success Criteria

- [ ] 12×12 grid renders with correct layout
- [ ] Characters display as tokens at their positions
- [ ] Tokens use faction-specific shapes (circle/diamond)
- [ ] HP bars show current/max health
- [ ] Intent lines connect characters to targets
- [ ] Attack lines are solid, move lines are dashed
- [ ] Line colors match faction (blue/orange)
- [ ] Confirmed actions: 3-4px stroke
- [ ] Locked-in actions: 4-5px stroke with pulse
- [ ] Damage numbers appear at target cells
- [ ] Multiple damages stack vertically
- [ ] Hover shows combined damage
- [ ] Pattern fills for colorblind support
- [ ] High contrast mode available
- [ ] UI scales 75-150%
- [ ] All tests pass

---

## 12. Risks & Mitigations

| Risk                         | Mitigation                                           |
| ---------------------------- | ---------------------------------------------------- |
| SVG/Grid coordinate sync     | Share `cellSize` value, compute centers consistently |
| Performance with many lines  | Memoize path calculations, batch SVG updates         |
| Complex marker positioning   | Test thoroughly with different action types          |
| Responsive sizing edge cases | Clamp grid size, test at various viewports           |

---

## Next Steps

1. **Human Review**: Approve this architecture design
2. **Code Mode**: Implement Phase 1 (Core Grid Foundation)
3. **Iterate**: Continue through phases with TDD workflow
