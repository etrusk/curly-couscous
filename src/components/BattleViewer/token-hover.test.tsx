/**
 * Integration tests for Token hover behavior.
 * Tests hover event triggering, aria-describedby association, and compatibility with click selection.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Token } from "./Token";
import { useGameStore } from "../../stores/gameStore";

describe("Token Hover Integration", () => {
  beforeEach(() => {
    // Reset store before each test
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
  });

  // Test: triggers-onMouseEnter-with-rect
  it("triggers onMouseEnter callback with character ID and bounding rect", async () => {
    const user = userEvent.setup();
    const mockOnMouseEnter = vi.fn();

    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={100}
        maxHp={100}
        slotPosition={1}
        onMouseEnter={mockOnMouseEnter}
      />,
    );

    const token = screen.getByTestId("token-char-1");
    await user.hover(token);

    // onMouseEnter called with character ID
    expect(mockOnMouseEnter).toHaveBeenCalledTimes(1);
    expect(mockOnMouseEnter).toHaveBeenCalledWith("char-1", expect.any(Object));
    // Second argument is DOMRect object with valid bounds
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const rectArg = mockOnMouseEnter.mock.calls[0]![1];
    expect(rectArg).toHaveProperty("top");
    expect(rectArg).toHaveProperty("left");
    expect(rectArg).toHaveProperty("width");
    expect(rectArg).toHaveProperty("height");
  });

  // Test: triggers-onMouseLeave-on-exit
  it("triggers onMouseLeave callback on mouse exit", async () => {
    const user = userEvent.setup();
    const mockOnMouseLeave = vi.fn();

    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={100}
        maxHp={100}
        slotPosition={1}
        onMouseLeave={mockOnMouseLeave}
      />,
    );

    const token = screen.getByTestId("token-char-1");
    await user.hover(token);
    await user.unhover(token);

    // onMouseLeave called once after unhover
    expect(mockOnMouseLeave).toHaveBeenCalledTimes(1);
  });

  // Test: adds-aria-describedby-when-tooltip-visible
  it("adds aria-describedby when tooltip is visible", () => {
    const { rerender } = render(
      <Token
        id="char-1"
        faction="friendly"
        hp={100}
        maxHp={100}
        slotPosition={1}
      />,
    );

    const token = screen.getByTestId("token-char-1");
    // Attribute not present when tooltipId is undefined
    expect(token).not.toHaveAttribute("aria-describedby");

    // Rerender with tooltipId
    rerender(
      <Token
        id="char-1"
        faction="friendly"
        hp={100}
        maxHp={100}
        slotPosition={1}
        tooltipId="tooltip-char-1"
      />,
    );

    // Token SVG has aria-describedby="tooltip-char-1"
    expect(token).toHaveAttribute("aria-describedby", "tooltip-char-1");
  });

  // Test: does-not-interfere-with-click-selection
  it("hover handlers do not interfere with click selection", async () => {
    const user = userEvent.setup();
    const mockOnMouseEnter = vi.fn();
    const mockOnMouseLeave = vi.fn();
    const { actions } = useGameStore.getState();

    // Reset store state
    actions.initBattle([]);
    actions.selectCharacter(null);

    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={100}
        maxHp={100}
        slotPosition={1}
        onMouseEnter={mockOnMouseEnter}
        onMouseLeave={mockOnMouseLeave}
      />,
    );

    const token = screen.getByTestId("token-char-1");

    // Hover token
    await user.hover(token);
    expect(mockOnMouseEnter).toHaveBeenCalled();

    // Click token
    await user.click(token);

    // Click still selects character (store state updated)
    expect(useGameStore.getState().selectedCharacterId).toBe("char-1");
    // Hover callbacks were also called
    expect(mockOnMouseEnter).toHaveBeenCalled();
  });

  // Test: keyboard-focus-does-not-show-tooltip
  it("keyboard focus does not trigger tooltip (v1 constraint)", async () => {
    const user = userEvent.setup();
    const mockOnMouseEnter = vi.fn();

    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={100}
        maxHp={100}
        slotPosition={1}
        onMouseEnter={mockOnMouseEnter}
      />,
    );

    const token = screen.getByTestId("token-char-1");

    // Tab to focus token
    await user.tab();

    // Token receives focus (tabIndex works)
    expect(document.activeElement).toBe(token);
    // onMouseEnter not called on focus
    expect(mockOnMouseEnter).not.toHaveBeenCalled();
  });
});
