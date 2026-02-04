/**
 * Tests for Cell component (SVG hex rendering).
 * Following TDD workflow - tests written first.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Cell } from "./Cell";
import type { CellProps } from "./Cell";
import { hexVertices } from "../../engine/hex";

// Helper to render Cell inside SVG context
function renderCell(
  props: Partial<CellProps> & {
    q: number;
    r: number;
    centerX: number;
    centerY: number;
    hexSize: number;
  },
) {
  const defaultProps = {
    q: 0,
    r: 0,
    centerX: 0,
    centerY: 0,
    hexSize: 30,
    ...props,
  };
  return render(
    <svg>
      <Cell {...defaultProps} />
    </svg>,
  );
}

describe("Cell - SVG Hex Rendering", () => {
  it("renders as SVG group with testid", () => {
    renderCell({
      q: 3,
      r: -2,
      centerX: 135,
      centerY: -25.98,
      hexSize: 30,
    });

    const cell = screen.getByTestId("cell-3--2");
    expect(cell).toBeInTheDocument();
    expect(cell.tagName.toLowerCase()).toBe("g");
  });

  it("has gridcell role for accessibility", () => {
    renderCell({ q: 0, r: 0, centerX: 0, centerY: 0, hexSize: 30 });

    const cell = screen.getByRole("gridcell");
    expect(cell).toBeInTheDocument();
  });

  it("has hex coordinate aria-label", () => {
    renderCell({ q: 2, r: -1, centerX: 90, centerY: -25.98, hexSize: 30 });

    const cell = screen.getByRole("gridcell");
    expect(cell).toHaveAttribute("aria-label", "Hex cell at q 2, r -1");
  });

  it("contains polygon for hex shape", () => {
    renderCell({ q: 0, r: 0, centerX: 0, centerY: 0, hexSize: 30 });

    const cell = screen.getByTestId("cell-0-0");
    const polygon = cell.querySelector("polygon");

    expect(polygon).toBeInTheDocument();

    // Polygon should have points attribute with 6 coordinate pairs
    const points = polygon?.getAttribute("points");
    expect(points).toBeTruthy();

    // Split points into coordinate pairs (format: "x1,y1 x2,y2 ...")
    const coords = points!.trim().split(/\s+/);
    // Should have 6 pairs
    expect(coords.length).toBe(6);
  });

  it("polygon points match hex vertices", () => {
    renderCell({ q: 0, r: 0, centerX: 0, centerY: 0, hexSize: 30 });

    const cell = screen.getByTestId("cell-0-0");
    const polygon = cell.querySelector("polygon");

    const points = polygon?.getAttribute("points");
    expect(points).toBeTruthy();

    // Compute expected vertices
    const expectedVertices = hexVertices({ x: 0, y: 0 }, 30);

    // Parse polygon points (format: "x1,y1 x2,y2 ..." or "x1 y1 x2 y2 ...")
    const pointsStr = points!.trim();
    const coords: number[] = [];

    // Handle both comma-separated and space-separated formats
    const pairs = pointsStr.split(/\s+/);
    for (const pair of pairs) {
      if (pair.includes(",")) {
        const [x, y] = pair.split(",").map(parseFloat);
        coords.push(x, y);
      } else {
        coords.push(parseFloat(pair));
      }
    }

    // Should have 6 pairs of coordinates
    expect(coords.length).toBe(12);

    // Check each vertex matches (with floating point tolerance)
    for (let i = 0; i < 6; i++) {
      const x = coords[i * 2];
      const y = coords[i * 2 + 1];
      const expected = expectedVertices[i];

      expect(x).toBeCloseTo(expected.x, 1);
      expect(y).toBeCloseTo(expected.y, 1);
    }
  });

  it("has clickable class when isClickable is true", () => {
    renderCell({
      q: 1,
      r: 0,
      centerX: 45,
      centerY: 25.98,
      hexSize: 30,
      isClickable: true,
    });

    const cell = screen.getByTestId("cell-1-0");
    const className = cell.getAttribute("class");
    expect(className).toContain("clickable");
  });

  it("does not have clickable class when isClickable is false", () => {
    renderCell({
      q: 1,
      r: 0,
      centerX: 45,
      centerY: 25.98,
      hexSize: 30,
      isClickable: false,
    });

    const cell = screen.getByTestId("cell-1-0");
    const className = cell.getAttribute("class");
    expect(className).not.toContain("clickable");
  });

  it("calls onClick with hex coordinates on click", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    renderCell({
      q: 1,
      r: -1,
      centerX: 45,
      centerY: -25.98,
      hexSize: 30,
      onClick: handleClick,
    });

    const cell = screen.getByTestId("cell-1--1");
    await user.click(cell);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(1, -1);
  });

  it("renders token when character is provided", () => {
    const character = {
      id: "c1",
      faction: "friendly" as const,
      hp: 100,
      maxHp: 100,
      position: { q: 0, r: 0 },
      slotPosition: 1,
    };

    renderCell({
      q: 0,
      r: 0,
      centerX: 0,
      centerY: 0,
      hexSize: 30,
      character,
    });

    const token = screen.getByTestId("token-c1");
    expect(token).toBeInTheDocument();
  });

  it("does not render token when no character", () => {
    renderCell({ q: 0, r: 0, centerX: 0, centerY: 0, hexSize: 30 });

    const token = screen.queryByTestId(/token-/);
    expect(token).not.toBeInTheDocument();
  });
});
