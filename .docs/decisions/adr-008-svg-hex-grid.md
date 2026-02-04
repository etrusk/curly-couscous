# ADR-008: SVG Hex Grid with Shared ViewBox Coordinate System

**Date:** 2026-02-04
**Status:** Accepted

## Decision

Render the hexagonal grid using SVG elements with a shared viewBox coordinate system. Grid renders as `<svg>` with `<polygon>` hex cells. Overlay SVGs (intent lines, damage numbers, targeting lines) share the same viewBox computed by `computeHexViewBox()`, ensuring pixel-perfect coordinate alignment.

## Context

Phase 3 of the hexagonal grid conversion (ADR-007) required visual rendering of hexagonal cells. The previous CSS Grid approach rendered square `<div>` cells, which cannot display hexagonal shapes. A rendering technology was needed that supports arbitrary polygons with precise coordinate control.

Requirements:

- Render 91 flat-top hexagonal cells with proper spacing
- Position character tokens at hex centers
- Align overlay layers (intent lines, damage numbers) with hex cell positions
- Support hover states, click events, and keyboard navigation
- Maintain accessibility (ARIA roles, labels, keyboard focus)

## Options Considered

1. **CSS clip-path on HTML divs** - Use `clip-path: polygon(...)` to shape divs as hexagons. Keeps HTML event model but creates gaps between cells (clip-path only affects visual, not layout). Hit testing would still use rectangular div bounds, not hex shapes.

2. **HTML5 Canvas** - Immediate-mode rendering with full pixel control. However, Canvas is not accessible (no DOM nodes for screen readers), requires manual hit testing, and cannot use CSS for styling/hover states. Would require reimplementing the accessibility layer.

3. **Absolute positioning with CSS transforms** - Position hex-shaped divs using `position: absolute` with calculated offsets. Complex layout math, still requires clip-path for hex shape, and z-index management for overlapping elements.

4. **SVG with shared viewBox** - Native polygon rendering, retained-mode DOM (accessible), CSS styling support, precise coordinate system shared across layers. SVG `<polygon>` provides exact hex-shaped hit areas for pointer events.

## Decision Rationale

SVG chosen because:

- **Native polygon support**: `<polygon points="...">` renders exact hex shapes without clip-path workarounds
- **Coordinate system sharing**: Multiple SVG elements with identical `viewBox` attributes align perfectly, solving the overlay alignment problem
- **Accessibility**: SVG elements participate in the DOM, supporting `role`, `aria-label`, `tabIndex`, and keyboard events
- **Resolution independence**: SVG scales cleanly at any zoom level or display density
- **CSS integration**: SVG elements support CSS properties (`fill`, `stroke`, `cursor`, `transition`), hover pseudo-classes, and CSS Modules
- **Pointer events**: `pointer-events="all"` on `<g>` elements provides hex-shaped hit areas, improving click accuracy over rectangular divs

## Consequences

**Benefits:**

- Hex-shaped click targets (polygon hit area instead of rectangular div)
- Pixel-perfect overlay alignment via shared `computeHexViewBox()` utility
- Resolution-independent rendering at any scale
- Natural hex geometry using `hexToPixel()` and `hexVertices()` from hex.ts
- Clean separation: Grid SVG renders cells, overlay SVGs render visual feedback

**Costs:**

- Grid, Cell, and Token components changed from HTML elements to SVG elements
- CSS properties shifted from box model (width/height/border) to SVG model (fill/stroke)
- Token changed from standalone `<svg>` to `<g>` with `transform="translate(...)"` for embedding in parent SVG
- Mouse/pointer events use SVG event model (works but requires `pointer-events` attribute)
- `getBoundingClientRect()` on SVG `<g>` returns tight bounding box (works for tooltip positioning but bounds differ slightly from standalone `<svg>`)

## Key Files

- `src/engine/hex.ts` - `computeHexViewBox()` utility, `hexVertices()`, `hexToPixel()`
- `src/components/BattleViewer/Grid.tsx` - SVG root with `role="grid"`, iterates `generateAllHexes()`
- `src/components/BattleViewer/Cell.tsx` - SVG `<g>` + `<polygon>` with `role="gridcell"`
- `src/components/BattleViewer/Token.tsx` - SVG `<g>` with `transform` positioning, `cx`/`cy` props
- `src/components/BattleViewer/IntentOverlay.tsx` - Uses `computeHexViewBox()` for shared viewBox
- `src/components/BattleViewer/DamageOverlay.tsx` - Uses `computeHexViewBox()` for shared viewBox
- `src/components/BattleViewer/TargetingLineOverlay.tsx` - Uses `computeHexViewBox()` for shared viewBox
