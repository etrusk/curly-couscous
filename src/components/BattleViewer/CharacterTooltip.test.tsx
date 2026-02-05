/**
 * Unit tests for CharacterTooltip component.
 * Tests content rendering, positioning logic, ARIA attributes, and portal behavior.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterTooltip } from "./CharacterTooltip";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createTarget,
  createAttackAction,
} from "../RuleEvaluations/rule-evaluations-test-helpers";
import { createMockRect, mockViewport } from "./tooltip-test-helpers";

describe("CharacterTooltip - Content Rendering", () => {
  beforeEach(() => {
    // Reset store before each test
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
    // Reset viewport to default
    mockViewport(1000, 800);
  });

  // Test: renders-next-action-section
  it("renders Next Action section with action name and target", () => {
    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    const anchorRect = createMockRect({
      top: 100,
      left: 100,
      right: 140,
      bottom: 140,
      width: 40,
      height: 40,
      x: 100,
      y: 100,
    });

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    // Section header
    expect(screen.getByText("Next Action")).toBeInTheDocument();
    // Action display with emoji and skill name
    expect(screen.getAllByText(/Light Punch/i).length).toBeGreaterThanOrEqual(
      1,
    );
    // Target indicator shows character letter
    expect(screen.getByText(/B/i)).toBeInTheDocument();
    // Resolution timing is displayed
    expect(screen.getByText(/next tick/i)).toBeInTheDocument();
  });

  // Test: renders-skill-priority-section
  it("renders Skill Priority section with numbered skill list", () => {
    const target = createTarget();
    const character = createCharacter({
      currentAction: null,
      skills: [
        {
          id: "light-punch",
          instanceId: "light-punch",
          name: "Light Punch",
          actionType: "attack",
          tickCost: 1,
          range: 1,
          damage: 10,
          behavior: "",
          enabled: true,
          triggers: [{ type: "enemy_in_range", value: 1 }],
          target: "enemy",
          criterion: "nearest",
        },
        {
          id: "move",
          instanceId: "move",
          name: "Move",
          tickCost: 1,
          range: 0,
          criterion: "nearest",
          target: "enemy",
          actionType: "attack",
          behavior: "towards",
          enabled: true,
          triggers: [{ type: "always" }],
        },
        {
          id: "heavy-punch",
          instanceId: "heavy-punch",
          name: "Heavy Punch",
          tickCost: 2,
          range: 2,
          criterion: "nearest",
          target: "enemy",
          behavior: "",
          actionType: "attack",
          damage: 25,
          enabled: false,
          triggers: [{ type: "enemy_in_range", value: 1 }],
        },
      ],
    });
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

    // Section header
    expect(screen.getByText("Skill Priority")).toBeInTheDocument();
    // Skills are numbered
    expect(screen.getByText(/1\.\s*Light Punch/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.\s*Move/i)).toBeInTheDocument();
    expect(screen.getByText(/3\.\s*Heavy Punch/i)).toBeInTheDocument();
    // Selected skill has arrow indicator
    expect(screen.getAllByText(/→/).length).toBeGreaterThanOrEqual(1);
    // Skills in collapsed section are present in DOM
    expect(screen.getByText(/Heavy Punch/i)).toBeInTheDocument();
  });

  // Test: renders-collapsible-skipped-skills
  it("renders skipped skills in collapsible section using details/summary", () => {
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

    // <details> element exists
    const details = document.querySelector("details");
    expect(details).toBeInTheDocument();
    // <summary> shows "Show N more skills"
    const summary = document.querySelector("summary");
    expect(summary?.textContent).toMatch(/Show \d+ more skill/i);
    // When expanded, skipped skills are visible with their indices
    // Note: This is a static check - interactive expansion will be tested in integration
  });

  // Test: renders-mid-action-display
  it("renders Continuing Action when character is mid-action", () => {
    const target = createTarget();
    const character = createCharacter({
      currentAction: createAttackAction(
        "light-punch",
        "Light Punch",
        target.position,
        target,
        0,
        3,
      ),
    });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    // Set game tick to 1 (mid-action)
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    const anchorRect = createMockRect();

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    // Header shows "Continuing Action" not "Next Action"
    expect(screen.getByText("Continuing Action")).toBeInTheDocument();
    expect(screen.queryByText("Next Action")).not.toBeInTheDocument();
    // Current action skill name is displayed
    expect(screen.getByText(/Light Punch/i)).toBeInTheDocument();
    // Resolution timing shows remaining ticks
    expect(screen.getByText(/2 ticks/i)).toBeInTheDocument();
  });

  // Test: renders-idle-state
  it("renders idle state when character has no valid action", () => {
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character]); // No enemies

    const anchorRect = createMockRect();

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    // Idle emoji displayed
    expect(screen.getByText(/💤 Idle/)).toBeInTheDocument();
    // "No valid action" message shown
    expect(screen.getByText(/No valid action/i)).toBeInTheDocument();
    // All skills show rejection reasons
    // (Light Punch: no enemy in range, Move: no target, Heavy Punch: disabled)
  });
});

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
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    mockViewport(1000, 800);
  });

  // Test: positions-right-of-token-by-default
  it("positions tooltip to the right of token by default", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);

    const anchorRect = createMockRect({ top: 200, left: 200, right: 240 });

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    // Tooltip left equals anchorRect.right + 12px offset
    expect(tooltip.style.left).toBe(`${anchorRect.right + 12}px`);
    // Tooltip top vertically centers on token (approximately)
    const topValue = parseInt(tooltip.style.top);
    const expectedTop = anchorRect.top + anchorRect.height / 2;
    expect(Math.abs(topValue - expectedTop)).toBeLessThan(100); // Allow for tooltip height adjustment
  });

  // Test: positions-left-when-near-right-edge
  it("positions tooltip to the left when near viewport right edge", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);

    mockViewport(800, 800);
    const anchorRect = createMockRect({ left: 700, right: 740 });

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    // Tooltip should be positioned to the left of the token
    const leftValue = parseInt(tooltip.style.left);
    // Should be less than anchorRect.left (positioned to the left)
    expect(leftValue).toBeLessThan(anchorRect.left);
  });

  // Test: fallback-position-when-both-sides-constrained
  it("uses fallback position when both sides are constrained", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);

    mockViewport(400, 800);
    const anchorRect = createMockRect({ left: 150, right: 190 });

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    const leftValue = parseInt(tooltip.style.left);
    // Should use fallback: max of (MARGIN, anchorRect.left)
    expect(leftValue).toBeGreaterThanOrEqual(8); // MARGIN
  });

  // Test: clamps-to-viewport-bottom
  it("clamps tooltip top when near viewport bottom", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);

    mockViewport(1000, 800);
    const anchorRect = createMockRect({ top: 700, bottom: 740 });

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    const topValue = parseInt(tooltip.style.top);
    // Tooltip should be clamped to fit within viewport
    // With 8px margin, max top should be 800 - tooltipHeight - 8
    expect(topValue).toBeLessThan(800);
  });

  // Test: clamps-to-viewport-top
  it("clamps tooltip top when near viewport top", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);

    mockViewport(1000, 800);
    const anchorRect = createMockRect({ top: 20, bottom: 60 });

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    const topValue = parseInt(tooltip.style.top);
    // Tooltip top should be at least 8px from viewport top (MARGIN)
    expect(topValue).toBeGreaterThanOrEqual(8);
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
