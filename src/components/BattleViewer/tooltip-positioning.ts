/**
 * Calculate smart tooltip position based on anchor rect and viewport.
 * Extracted from CharacterTooltip for independent unit testing and
 * to avoid react-refresh/only-export-components ESLint warning.
 */
export function calculateTooltipPosition(
  anchorRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
): { top: number; left: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const OFFSET = 12; // Gap between token and tooltip
  const MARGIN = 8; // Minimum distance from viewport edge

  let left: number;
  let top: number;

  // Horizontal positioning
  if (anchorRect.right + OFFSET + tooltipWidth + MARGIN < viewportWidth) {
    // Right of token (preferred)
    left = anchorRect.right + OFFSET;
  } else if (anchorRect.left - OFFSET - tooltipWidth > MARGIN) {
    // Left of token
    left = anchorRect.left - OFFSET - tooltipWidth;
  } else {
    // Fallback: align with left edge of token
    left = Math.max(MARGIN, anchorRect.left);
  }

  // Vertical positioning
  const tokenCenterY = anchorRect.top + anchorRect.height / 2;
  top = tokenCenterY - tooltipHeight / 2;

  // Clamp to viewport
  if (top < MARGIN) {
    top = MARGIN;
  } else if (top + tooltipHeight + MARGIN > viewportHeight) {
    top = viewportHeight - tooltipHeight - MARGIN;
  }

  return { top, left };
}
