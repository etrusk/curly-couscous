/**
 * Tests for Cell component click behavior.
 * Part of Click-to-Place Debug UI feature.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Cell } from "./Cell";

describe("Cell - Click Behavior", () => {
  it("should render without onClick when not provided", () => {
    render(<Cell x={5} y={7} />);

    const cell = screen.getByTestId("cell-5-7");
    expect(cell).toBeInTheDocument();

    // Cell should be rendered normally without click handler
    expect(cell.tagName).toBe("DIV");
  });

  it("should call onClick with coordinates when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Cell x={3} y={4} onClick={handleClick} />);

    const cell = screen.getByTestId("cell-3-4");
    await user.click(cell);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(3, 4);
  });

  it("should have clickable class when isClickable is true", () => {
    render(<Cell x={2} y={5} isClickable={true} />);

    const cell = screen.getByTestId("cell-2-5");
    expect(cell.className).toContain("clickable");
  });

  it("should not have clickable class when isClickable is false", () => {
    render(<Cell x={6} y={8} isClickable={false} />);

    const cell = screen.getByTestId("cell-6-8");
    expect(cell.className).not.toContain("clickable");
  });
});
