# Portal Tooltip Positioning Pattern

## Context

When implementing tooltips that need to:

- Appear near a trigger element but render outside its DOM hierarchy
- Avoid being clipped by overflow:hidden containers
- Position intelligently relative to viewport edges

## Implementation

**1. Portal Rendering**

```tsx
import { createPortal } from "react-dom";

const Tooltip = ({ anchorRect, children }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const pos = calculatePosition(anchorRect, tooltipRef.current);
      setPosition(pos);
    }
  }, [anchorRect]);

  return createPortal(
    <div ref={tooltipRef} style={{ position: "fixed", ...position }}>
      {children}
    </div>,
    document.body,
  );
};
```

**2. Below/Above Positioning (SkillNameWithTooltip pattern)**

```typescript
// Place below anchor with gap; flip above if insufficient space
const GAP = 4;
const MARGIN = 8;

let top: number;
if (anchorRect.bottom + GAP + tooltipHeight + MARGIN < window.innerHeight) {
  top = anchorRect.bottom + GAP; // Below
} else {
  top = anchorRect.top - GAP - tooltipHeight; // Above
}

// Horizontal: align left edge, clamp to viewport
let left = Math.max(
  MARGIN,
  Math.min(anchorRect.left, window.innerWidth - tooltipWidth - MARGIN),
);
```

**3. Appear Delay (non-interactive tooltip)**

```tsx
// 150ms delay prevents flicker when traversing lists
const handleMouseEnter = () => {
  timerRef.current = setTimeout(() => setIsVisible(true), 150);
};
const handleMouseLeave = () => {
  clearTimeout(timerRef.current);
  setIsVisible(false);
};
```

## Rationale

- **Portal to body**: Avoids z-index stacking contexts and overflow clipping
- **useLayoutEffect**: Prevents visual flicker by positioning synchronously
- **Smart positioning**: Ensures tooltip remains visible at all viewport edges
- **Fixed positioning**: Works with scrollable containers
- **Appear delay**: Prevents tooltip flicker when moving through dense lists

## Related Files

- `src/components/CharacterPanel/SkillNameWithTooltip.tsx` - Skill stat tooltip (portal-rendered, below/above positioning, 150ms delay)
- `src/components/CharacterPanel/SkillNameWithTooltip.module.css` - Tooltip styles using design system tokens
