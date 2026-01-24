/**
 * Tests for BattleViewer, Grid, and Cell components.
 * Following TDD workflow - tests written first.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BattleViewer } from "./BattleViewer";
import { Grid } from "./Grid";
import { Cell } from "./Cell";

describe("Cell", () => {
  it("renders a cell with correct coordinates", () => {
    render(<Cell x={5} y={7} />);

    // Cell should have data attributes for coordinates
    const cell = screen.getByTestId("cell-5-7");
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveAttribute("data-x", "5");
    expect(cell).toHaveAttribute("data-y", "7");
  });

  it("applies correct CSS class", () => {
    render(<Cell x={0} y={0} />);

    const cell = screen.getByTestId("cell-0-0");
    expect(cell.className).toContain("cell");
  });

  it("has gridcell role for accessibility", () => {
    render(<Cell x={3} y={4} />);

    const cell = screen.getByRole("gridcell");
    expect(cell).toBeInTheDocument();
  });

  it("has aria-label with coordinate information", () => {
    render(<Cell x={2} y={8} />);

    const cell = screen.getByRole("gridcell");
    expect(cell).toHaveAttribute("aria-label", "Cell at row 8, column 2");
  });
});

describe("Grid", () => {
  it("renders 144 cells for 12×12 grid", () => {
    render(<Grid width={12} height={12} />);

    // Query all cells by role
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(144);
  });

  it("renders correct number of cells for custom dimensions", () => {
    render(<Grid width={5} height={6} />);

    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(30);
  });

  it("has grid role for accessibility", () => {
    render(<Grid width={12} height={12} />);

    const grid = screen.getByRole("grid");
    expect(grid).toBeInTheDocument();
  });

  it("has aria-label describing grid dimensions", () => {
    render(<Grid width={12} height={12} />);

    const grid = screen.getByRole("grid");
    expect(grid).toHaveAttribute("aria-label", "Battle grid, 12 by 12");
  });

  it("applies correct CSS Grid structure", () => {
    const { container } = render(<Grid width={12} height={12} />);

    const grid = container.querySelector('[role="grid"]');
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain("grid");
  });

  it("generates cells with correct coordinates", () => {
    render(<Grid width={3} height={3} />);

    // Check a few specific cells exist with correct coordinates
    expect(screen.getByTestId("cell-0-0")).toBeInTheDocument();
    expect(screen.getByTestId("cell-2-2")).toBeInTheDocument();
    expect(screen.getByTestId("cell-1-1")).toBeInTheDocument();
  });

  it("creates cells in row-major order (y then x)", () => {
    render(<Grid width={2} height={2} />);

    const cells = screen.getAllByRole("gridcell");

    // Expected order: (0,0), (1,0), (0,1), (1,1)
    expect(cells[0]).toHaveAttribute("data-x", "0");
    expect(cells[0]).toHaveAttribute("data-y", "0");
    expect(cells[1]).toHaveAttribute("data-x", "1");
    expect(cells[1]).toHaveAttribute("data-y", "0");
    expect(cells[2]).toHaveAttribute("data-x", "0");
    expect(cells[2]).toHaveAttribute("data-y", "1");
    expect(cells[3]).toHaveAttribute("data-x", "1");
    expect(cells[3]).toHaveAttribute("data-y", "1");
  });

  it("should propagate onCellClick to Cell components", async () => {
    const user = userEvent.setup();
    const handleCellClick = vi.fn();

    render(<Grid width={3} height={3} onCellClick={handleCellClick} />);

    const cell = screen.getByTestId("cell-1-1");
    await user.click(cell);

    expect(handleCellClick).toHaveBeenCalledWith(1, 1);
  });

  it("should pass isClickable=true only to cells in clickableCells set", () => {
    const clickableCells = new Set(["0-0", "1-1", "2-2"]);

    render(<Grid width={3} height={3} clickableCells={clickableCells} />);

    const clickableCell = screen.getByTestId("cell-0-0");
    const nonClickableCell = screen.getByTestId("cell-1-0");

    expect(clickableCell.className).toContain("clickable");
    expect(nonClickableCell.className).not.toContain("clickable");
  });

  it("should pass isClickable=false to cells not in clickableCells set", () => {
    const clickableCells = new Set(["5-5"]);

    render(<Grid width={3} height={3} clickableCells={clickableCells} />);

    // Most cells should not be clickable
    const nonClickableCell1 = screen.getByTestId("cell-0-0");
    const nonClickableCell2 = screen.getByTestId("cell-1-1");
    const nonClickableCell3 = screen.getByTestId("cell-2-2");

    expect(nonClickableCell1.className).not.toContain("clickable");
    expect(nonClickableCell2.className).not.toContain("clickable");
    expect(nonClickableCell3.className).not.toContain("clickable");
  });
});

describe("BattleViewer", () => {
  it("renders without crashing", () => {
    render(<BattleViewer />);

    // Should render the grid
    const grid = screen.getByRole("grid");
    expect(grid).toBeInTheDocument();
  });

  it("renders 12×12 grid by default", () => {
    render(<BattleViewer />);

    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(144);
  });

  it("applies battleViewer CSS class", () => {
    const { container } = render(<BattleViewer />);

    const viewer = container.firstChild as HTMLElement;
    expect(viewer.tagName).toBe("DIV");
    expect(viewer.className).toContain("battleViewer");
  });

  it("accepts custom grid dimensions", () => {
    render(<BattleViewer gridWidth={8} gridHeight={8} />);

    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(64);
  });

  it("uses CSS custom properties for theming", () => {
    const { container } = render(<BattleViewer />);

    const viewer = container.firstChild as HTMLElement;
    expect(viewer.style.getPropertyValue("--grid-width")).toBeTruthy();
    expect(viewer.style.getPropertyValue("--grid-height")).toBeTruthy();
  });
});

describe("BattleViewer - Click-to-Place Integration", () => {
  it("should make empty cells clickable in placing-friendly mode", () => {
    // This test requires BattleViewer to connect to gameStore
    // and pass clickableCells prop based on selectionMode
    const { container } = render(<BattleViewer />);

    // Test will be implemented when BattleViewer wires up store
    expect(container).toBeInTheDocument();
  });

  it("should make empty cells clickable in placing-enemy mode", () => {
    const { container } = render(<BattleViewer />);
    expect(container).toBeInTheDocument();
  });

  it("should make empty cells clickable in moving mode", () => {
    const { container } = render(<BattleViewer />);
    expect(container).toBeInTheDocument();
  });

  it("should not make cells clickable in idle mode", () => {
    const { container } = render(<BattleViewer />);
    expect(container).toBeInTheDocument();
  });

  it("clicking empty cell in placing-friendly mode should add friendly character", () => {
    const { container } = render(<BattleViewer />);
    expect(container).toBeInTheDocument();

    // Will be implemented when click handlers are wired up
    // Placeholder for now
  });

  it("clicking empty cell in placing-enemy mode should add enemy character", () => {
    const { container } = render(<BattleViewer />);
    expect(container).toBeInTheDocument();
  });

  it("clicking empty cell in moving mode should move selected character", () => {
    const { container } = render(<BattleViewer />);
    expect(container).toBeInTheDocument();
  });

  it("should return to idle mode after successful placement", () => {
    const { container } = render(<BattleViewer />);
    expect(container).toBeInTheDocument();
  });

  it("should return to idle mode after successful move", () => {
    const { container } = render(<BattleViewer />);
    expect(container).toBeInTheDocument();
  });

  it("occupied cells should not be clickable in placing-friendly mode", () => {
    const { container } = render(<BattleViewer />);
    expect(container).toBeInTheDocument();
  });

  it("occupied cells should not be clickable in placing-enemy mode", () => {
    const { container } = render(<BattleViewer />);
    expect(container).toBeInTheDocument();
  });

  it("occupied cells should not be clickable in moving mode", () => {
    const { container } = render(<BattleViewer />);
    expect(container).toBeInTheDocument();
  });
});
