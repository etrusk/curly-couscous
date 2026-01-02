/**
 * Tests for BattleViewer, Grid, and Cell components.
 * Following TDD workflow - tests written first.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
