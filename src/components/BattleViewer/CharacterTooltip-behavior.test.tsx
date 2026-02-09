/** Tests for CharacterTooltip component - portal, positioning, accessibility, and hover behavior. */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterTooltip } from "./CharacterTooltip";
import { calculateTooltipPosition } from "./tooltip-positioning";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createTarget,
} from "../RuleEvaluations/rule-evaluations-test-helpers";
import { createMockRect, mockViewport } from "./tooltip-test-helpers";

describe("CharacterTooltip - Portal Rendering", () => {
  beforeEach(() => {
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    mockViewport(1000, 800);
  });

  // Test: portal-renders-outside-component-tree
  it("renders via React Portal outside the component container", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);

    const anchorRect = createMockRect();

    render(
      <div data-testid="container">
        <CharacterTooltip
          characterId={character.id}
          anchorRect={anchorRect}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        />
      </div>,
    );

    // Tooltip element with role="tooltip" exists in document
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    // Tooltip element is NOT a descendant of the container div
    const containerDiv = screen.getByTestId("container");
    expect(containerDiv.contains(tooltip)).toBe(false);
    // Tooltip is a descendant of document.body
    expect(document.body.contains(tooltip)).toBe(true);
  });
});

describe("CharacterTooltip - Positioning", () => {
  beforeEach(() => {
    mockViewport(1000, 800);
  });

  // Test 7: positions-right-of-anchor-by-default
  it("positions right of anchor by default", () => {
    mockViewport(1000, 800);
    const anchorRect = new DOMRect(200, 200, 40, 40);
    const tooltipWidth = 300;
    const tooltipHeight = 200;

    const result = calculateTooltipPosition(
      anchorRect,
      tooltipWidth,
      tooltipHeight,
    );

    // Right-side placement with OFFSET = 12: anchorRect.right + 12 = 240 + 12 = 252
    expect(result.left).toBe(252);
    // Vertically centered: anchorRect.top + anchorRect.height/2 - tooltipHeight/2
    // = 200 + 20 - 100 = 120
    expect(result.top).toBe(120);
  });

  // Test 8: positions-left-when-near-right-viewport-edge
  it("positions left when near right viewport edge", () => {
    mockViewport(800, 800);
    const anchorRect = new DOMRect(700, 200, 40, 40);
    const tooltipWidth = 300;
    const tooltipHeight = 200;

    const result = calculateTooltipPosition(
      anchorRect,
      tooltipWidth,
      tooltipHeight,
    );

    // Left-side placement: anchorRect.left - 12 - tooltipWidth = 700 - 12 - 300 = 388
    expect(result.left).toBe(388);
    // Tooltip is to the left of the anchor
    expect(result.left).toBeLessThan(anchorRect.left);
    // Tooltip does not violate the MARGIN (8px) on the left edge
    expect(result.left).toBeGreaterThan(8);
  });

  // Test 9: fallback-position-when-both-sides-constrained
  it("uses fallback position when both sides are constrained", () => {
    mockViewport(400, 800);
    const anchorRect = new DOMRect(150, 200, 40, 40);
    const tooltipWidth = 300;
    const tooltipHeight = 200;

    const result = calculateTooltipPosition(
      anchorRect,
      tooltipWidth,
      tooltipHeight,
    );

    // Respects the MARGIN minimum
    expect(result.left).toBeGreaterThanOrEqual(8);
    // Uses the fallback: Math.max(MARGIN, anchorRect.left) = Math.max(8, 150) = 150
    expect(result.left).toBe(Math.max(8, anchorRect.left));
  });

  // Test 10: clamps-to-viewport-bottom
  it("clamps to viewport bottom", () => {
    mockViewport(1000, 800);
    const anchorRect = new DOMRect(200, 700, 40, 40);
    const tooltipWidth = 300;
    const tooltipHeight = 200;

    const result = calculateTooltipPosition(
      anchorRect,
      tooltipWidth,
      tooltipHeight,
    );

    // Tooltip bottom edge (top + height) plus margin fits within viewport height
    expect(result.top + tooltipHeight + 8).toBeLessThanOrEqual(800);
    // Clamping formula: viewportHeight - tooltipHeight - MARGIN = 800 - 200 - 8 = 592
    expect(result.top).toBe(592);
  });

  // Test 11: clamps-to-viewport-top
  it("clamps to viewport top", () => {
    mockViewport(1000, 800);
    const anchorRect = new DOMRect(200, 20, 40, 40);
    const tooltipWidth = 300;
    const tooltipHeight = 200;

    const result = calculateTooltipPosition(
      anchorRect,
      tooltipWidth,
      tooltipHeight,
    );

    // Tooltip does not go above MARGIN
    expect(result.top).toBeGreaterThanOrEqual(8);
    // Exact value: unclamped = 20 + 20 - 100 = -60, clamped to MARGIN = 8
    expect(result.top).toBe(8);
  });
});

describe("CharacterTooltip - Accessibility", () => {
  beforeEach(() => {
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    mockViewport(1000, 800);
  });

  // Test: has-role-tooltip
  it("has role='tooltip' for accessibility", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);

    const anchorRect = createMockRect();

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveAttribute("role", "tooltip");
    // Has unique id matching pattern tooltip-{characterId}
    expect(tooltip).toHaveAttribute("id", `tooltip-${character.id}`);
  });

  // Test: uses-details-summary-for-collapsed-skills
  it("uses native details/summary for keyboard accessibility", () => {
    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    const anchorRect = createMockRect();

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    // Uses <details> element (not custom disclosure)
    const details = document.querySelector("details");
    expect(details).toBeInTheDocument();
    // Summary element is keyboard focusable
    const summary = document.querySelector("summary");
    expect(summary).toBeInTheDocument();
    // Collapse state is announced to screen readers (native behavior)
  });
});

describe("CharacterTooltip - Hover Callbacks", () => {
  beforeEach(() => {
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    mockViewport(1000, 800);
  });

  // Test: calls-onMouseEnter-when-hovered
  it("calls onMouseEnter and onMouseLeave callbacks", async () => {
    const user = userEvent.setup();
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);

    const anchorRect = createMockRect();
    const mockOnMouseEnter = vi.fn();
    const mockOnMouseLeave = vi.fn();

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={mockOnMouseEnter}
        onMouseLeave={mockOnMouseLeave}
      />,
    );

    const tooltip = screen.getByRole("tooltip");

    // Hover tooltip
    await user.hover(tooltip);
    expect(mockOnMouseEnter).toHaveBeenCalledTimes(1);

    // Unhover tooltip
    await user.unhover(tooltip);
    expect(mockOnMouseLeave).toHaveBeenCalledTimes(1);
  });
});
