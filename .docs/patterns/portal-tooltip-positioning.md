# Portal Tooltip Positioning Pattern

## Context

When implementing tooltips that need to:

- Appear near a trigger element but render outside its DOM hierarchy
- Avoid being clipped by overflow:hidden containers
- Position intelligently relative to viewport edges
- Support hover interaction on the tooltip itself

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

**2. Smart Positioning Algorithm**

```typescript
function calculatePosition(anchor: DOMRect, tooltip: DOMRect) {
  const OFFSET = 12; // Gap between anchor and tooltip
  const MARGIN = 8; // Minimum distance from viewport edge

  let left: number;
  // Prefer right of anchor; fallback to left if constrained
  if (anchor.right + OFFSET + tooltip.width + MARGIN < window.innerWidth) {
    left = anchor.right + OFFSET;
  } else if (anchor.left - OFFSET - tooltip.width > MARGIN) {
    left = anchor.left - OFFSET - tooltip.width;
  } else {
    left = Math.max(MARGIN, anchor.left); // Fallback: align with anchor
  }

  // Vertically center on anchor, clamp to viewport
  let top = anchor.top + anchor.height / 2 - tooltip.height / 2;
  top = Math.max(
    MARGIN,
    Math.min(top, window.innerHeight - tooltip.height - MARGIN),
  );

  return { top, left };
}
```

**3. Leave Delay for Tooltip Interaction**

```tsx
const handleMouseLeave = () => {
  timeoutRef.current = setTimeout(() => setHovered(null), 100); // 100ms delay
};

const handleTooltipMouseEnter = () => {
  clearTimeout(timeoutRef.current); // Cancel close when moving to tooltip
};
```

## Rationale

- **Portal to body**: Avoids z-index stacking contexts and overflow clipping
- **useLayoutEffect**: Prevents visual flicker by positioning synchronously
- **Smart positioning**: Ensures tooltip remains visible at all viewport edges
- **Leave delay**: Enables hovering on tooltip content without accidental close
- **Fixed positioning**: Works with scrollable containers

## Related Files

- `src/components/BattleViewer/CharacterTooltip.tsx` - Rule evaluations tooltip
- `src/components/BattleViewer/CharacterTooltip.module.css` - Tooltip styles
