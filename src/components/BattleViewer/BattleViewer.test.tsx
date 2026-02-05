/**
 * Tests for BattleViewer and Grid components (SVG hex rendering).
 * Following TDD workflow - tests written first.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BattleViewer } from "./BattleViewer";
import { Grid } from "./Grid";
import { useGameStore } from "../../stores/gameStore";

describe("Grid - SVG Hex Grid", () => {
  it("renders 91 hex cells for radius 5", () => {
    render(<Grid hexSize={30} />);

    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(91);
  });

  it("renders as SVG element", () => {
    render(<Grid hexSize={30} />);

    const grid = screen.getByRole("grid");
    expect(grid).toBeInTheDocument();
    expect(grid.tagName.toLowerCase()).toBe("svg");
  });

  it("has hex grid aria-label", () => {
    render(<Grid hexSize={30} />);

    const grid = screen.getByRole("grid");
    expect(grid).toHaveAttribute("aria-label", "Hex battle grid, 91 cells");
  });

  it("has viewBox attribute", () => {
    render(<Grid hexSize={30} />);

    const grid = screen.getByRole("grid");
    const viewBox = grid.getAttribute("viewBox");

    expect(viewBox).toBeTruthy();

    // Should have 4 space-separated numbers
    const parts = viewBox!.trim().split(/\s+/);
    expect(parts).toHaveLength(4);
    for (const part of parts) {
      expect(Number.isFinite(parseFloat(part))).toBe(true);
    }
  });

  it("includes center hex at origin", () => {
    render(<Grid hexSize={30} />);

    const centerCell = screen.getByTestId("cell-0-0");
    expect(centerCell).toBeInTheDocument();
  });

  it("includes all 6 boundary vertex hexes", () => {
    render(<Grid hexSize={30} />);

    // Boundary vertices for radius 5
    expect(screen.getByTestId("cell-5-0")).toBeInTheDocument();
    expect(screen.getByTestId("cell-0-5")).toBeInTheDocument();
    expect(screen.getByTestId("cell--5-5")).toBeInTheDocument();
    expect(screen.getByTestId("cell--5-0")).toBeInTheDocument();
    expect(screen.getByTestId("cell-0--5")).toBeInTheDocument();
    expect(screen.getByTestId("cell-5--5")).toBeInTheDocument();
  });

  it("propagates onCellClick with hex coordinates", async () => {
    const user = userEvent.setup();
    const handleCellClick = vi.fn();

    render(<Grid hexSize={30} onCellClick={handleCellClick} />);

    const cell = screen.getByTestId("cell-1--1");
    await user.click(cell);

    expect(handleCellClick).toHaveBeenCalledWith(1, -1);
  });

  it("uses positionKey format for clickable cells", () => {
    const clickableCells = new Set(["0,0", "1,-1"]);

    render(<Grid hexSize={30} clickableCells={clickableCells} />);

    const cell00 = screen.getByTestId("cell-0-0");
    const cell11 = screen.getByTestId("cell-1--1");
    const cell20 = screen.getByTestId("cell-2-0");

    expect(cell00.getAttribute("class")).toContain("clickable");
    expect(cell11.getAttribute("class")).toContain("clickable");
    expect(cell20.getAttribute("class")).not.toContain("clickable");
  });

  it("renders character tokens in correct cells", () => {
    const characters = [
      {
        id: "c1",
        position: { q: 0, r: 0 },
        faction: "friendly" as const,
        hp: 100,
        maxHp: 100,
        slotPosition: 1,
      },
    ];

    render(<Grid hexSize={30} characters={characters} />);

    const token = screen.getByTestId("token-c1");
    expect(token).toBeInTheDocument();

    // Token should be inside cell-0-0
    const cell = screen.getByTestId("cell-0-0");
    expect(cell.contains(token)).toBe(true);
  });

  it("does not have CSS Grid layout styles", () => {
    render(<Grid hexSize={30} />);

    const grid = screen.getByRole("grid");
    const style = grid.getAttribute("style");

    // Should not have gridTemplateColumns or gridTemplateRows
    // SVG elements may not have a style attribute, which is fine
    if (style) {
      expect(style).not.toContain("gridTemplateColumns");
      expect(style).not.toContain("gridTemplateRows");
    }
    // Also verify it's an SVG element (not a div with CSS Grid)
    expect(grid.tagName.toLowerCase()).toBe("svg");
  });
});

describe("BattleViewer - Container", () => {
  it("renders without crashing", () => {
    render(<BattleViewer />);

    const grid = screen.getByRole("grid");
    expect(grid).toBeInTheDocument();
  });

  it("renders 91 hex cells by default", () => {
    render(<BattleViewer />);

    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(91);
  });

  it("has battleViewer CSS class", () => {
    const { container } = render(<BattleViewer />);

    const viewer = container.firstChild as HTMLElement;
    expect(viewer.tagName).toBe("DIV");
    expect(viewer.className).toContain("battleViewer");
  });

  it("does not set grid width/height CSS custom properties", () => {
    const { container } = render(<BattleViewer />);

    const viewer = container.firstChild as HTMLElement;
    const style = viewer.getAttribute("style");

    // Should not have grid width/height CSS custom properties
    // (may be null if no inline styles)
    if (style) {
      expect(style).not.toContain("--grid-width");
      expect(style).not.toContain("--grid-height");
    }
  });

  it("accepts hexSize prop", () => {
    render(<BattleViewer hexSize={40} />);

    const grid = screen.getByRole("grid");
    expect(grid).toBeInTheDocument();

    // Should still have 91 cells (hexSize changes size, not count)
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(91);
  });
});

describe("BattleViewer - Integration", () => {
  it("overlay viewBox matches grid viewBox", () => {
    const { container } = render(<BattleViewer />);

    const grid = screen.getByRole("grid");
    const gridViewBox = grid.getAttribute("viewBox");

    // Query all SVG elements in the container
    const allSvgs = container.querySelectorAll("svg");

    // All SVGs should share the same viewBox if overlays are present
    // For now, just verify grid has a viewBox
    expect(gridViewBox).toBeTruthy();

    // If overlays render, they should match
    // This test will be more useful once we have game state with intents/damage
    // Find the grid SVG element for comparison
    const gridSvg = Array.from(allSvgs).find(
      (svg) => svg.getAttribute("role") === "grid",
    );

    for (const svg of Array.from(allSvgs)) {
      const vb = svg.getAttribute("viewBox");
      if (vb && svg !== gridSvg) {
        // Overlay SVG should match grid viewBox
        expect(vb).toBe(gridViewBox);
      }
    }
  });

  it("character placement on hex cell", () => {
    // Set up character at position {q: 1, r: -1}
    useGameStore.setState({
      gameState: {
        ...useGameStore.getState().gameState,
        characters: [
          {
            id: "test-char",
            name: "Test Character",
            position: { q: 1, r: -1 },
            faction: "friendly",
            hp: 100,
            maxHp: 100,
            slotPosition: 1,
            skills: [],
            currentAction: null,
          },
        ],
      },
    });

    render(<BattleViewer />);

    const token = screen.getByTestId("token-test-char");
    expect(token).toBeInTheDocument();

    // Token should be inside cell-1--1
    const cell = screen.getByTestId("cell-1--1");
    expect(cell.contains(token)).toBe(true);
  });

  it("click handling on SVG cells in placing mode", async () => {
    const user = userEvent.setup();

    // Set up placing mode
    useGameStore.setState({
      selectionMode: "placing-friendly",
      gameState: {
        ...useGameStore.getState().gameState,
        characters: [],
      },
    });

    render(<BattleViewer />);

    // Click on cell-0-0
    const cell = screen.getByTestId("cell-0-0");
    await user.click(cell);

    // After click, should have a new character at {q: 0, r: 0}
    const state = useGameStore.getState();
    const charAtOrigin = state.gameState.characters.find(
      (c) => c.position.q === 0 && c.position.r === 0,
    );
    expect(charAtOrigin).toBeDefined();
    expect(charAtOrigin?.faction).toBe("friendly");

    // Selection mode should return to idle
    expect(state.selectionMode).toBe("idle");
  });
});

describe("BattleViewer - Click-to-Place", () => {
  it("empty cells clickable in placing-friendly mode", () => {
    useGameStore.setState({
      selectionMode: "placing-friendly",
      gameState: {
        ...useGameStore.getState().gameState,
        characters: [],
      },
    });

    render(<BattleViewer />);

    // All 91 cells should be clickable (all empty)
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(91);

    for (const cell of cells) {
      expect(cell.getAttribute("class")).toContain("clickable");
    }
  });

  it("occupied cells not clickable in placing mode", () => {
    useGameStore.setState({
      selectionMode: "placing-friendly",
      gameState: {
        ...useGameStore.getState().gameState,
        characters: [
          {
            id: "existing",
            name: "Existing Character",
            position: { q: 0, r: 0 },
            faction: "friendly",
            hp: 100,
            maxHp: 100,
            slotPosition: 1,
            skills: [],
            currentAction: null,
          },
        ],
      },
    });

    render(<BattleViewer />);

    const occupiedCell = screen.getByTestId("cell-0-0");
    const emptyCell = screen.getByTestId("cell-1-0");

    expect(occupiedCell.getAttribute("class")).not.toContain("clickable");
    expect(emptyCell.getAttribute("class")).toContain("clickable");
  });

  describe("D3: Hex Grid Rotation Integration", () => {
    it("grid renders flat-top hexes (pointy-top orientation)", () => {
      // D3: After rotation, hexes should have flat edges at top/bottom
      render(<BattleViewer />);

      const grid = screen.getByRole("grid");
      const polygons = grid.querySelectorAll("polygon");

      expect(polygons.length).toBeGreaterThan(0);

      // Check first polygon has pointy-top vertex arrangement
      const firstPolygon = polygons[0];
      if (!firstPolygon) throw new Error("Expected at least one polygon");
      const points = firstPolygon.getAttribute("points");
      expect(points).toBeTruthy();

      // Parse points to verify flat top edge
      const coords = points!
        .trim()
        .split(/\s+/)
        .map((pair) => {
          const parts = pair.split(",").map(parseFloat);
          if (
            parts.length < 2 ||
            parts[0] === undefined ||
            parts[1] === undefined
          ) {
            throw new Error("Invalid point format");
          }
          return { x: parts[0], y: parts[1] };
        });

      // Should have 6 vertices
      expect(coords).toHaveLength(6);

      // For pointy-top hexes:
      // - 1 vertex at top (smallest Y)
      // - 2 vertices forming upper flat edge (same Y)
      // - 2 vertices forming lower flat edge (same Y)
      // - 1 vertex at bottom (largest Y)
      const sortedByY = [...coords].sort((a, b) => a.y - b.y);

      // Group vertices by Y coordinate (within tolerance)
      const yGroups = sortedByY.reduce(
        (groups, coord) => {
          const existing = groups.find((g) => Math.abs(g[0]!.y - coord.y) < 1);
          if (existing) {
            existing.push(coord);
          } else {
            groups.push([coord]);
          }
          return groups;
        },
        [] as Array<Array<{ x: number; y: number }>>,
      );

      // Should have 4 Y-levels: top point, upper edge, lower edge, bottom point
      expect(yGroups.length).toBe(4);

      // Top and bottom should be single vertices (points)
      const topGroup = yGroups[0];
      const bottomGroup = yGroups[3];
      if (!topGroup || !bottomGroup) throw new Error("Expected 4 Y-groups");
      expect(topGroup.length).toBe(1); // top point
      expect(bottomGroup.length).toBe(1); // bottom point

      // Middle two should be pairs (flat edges)
      const upperEdge = yGroups[1];
      const lowerEdge = yGroups[2];
      if (!upperEdge || !lowerEdge)
        throw new Error("Expected middle edge groups");
      expect(upperEdge.length).toBe(2); // upper flat edge
      expect(lowerEdge.length).toBe(2); // lower flat edge
    });

    it("grid viewBox has landscape aspect ratio (width > height)", () => {
      // D3: Flat-top board is wider than tall
      render(<BattleViewer />);

      const grid = screen.getByRole("grid");
      const viewBox = grid.getAttribute("viewBox");
      expect(viewBox).toBeTruthy();

      const viewBoxParts = viewBox!.split(/\s+/).map(parseFloat);
      if (viewBoxParts.length < 4) throw new Error("Invalid viewBox format");
      const width = viewBoxParts[2];
      const height = viewBoxParts[3];
      if (width === undefined || height === undefined)
        throw new Error("Invalid viewBox values");

      // Width should be greater than height
      expect(width).toBeGreaterThan(height);
    });

    it("token centers in pointy-top hex", () => {
      // D3: Character tokens should center correctly after rotation
      useGameStore.setState({
        gameState: {
          ...useGameStore.getState().gameState,
          characters: [
            {
              id: "test-token",
              name: "Test",
              position: { q: 1, r: 0 },
              faction: "friendly",
              hp: 100,
              maxHp: 100,
              slotPosition: 1,
              skills: [],
              currentAction: null,
            },
          ],
        },
      });

      render(<BattleViewer />);

      const token = screen.getByTestId("token-test-token");
      expect(token).toBeInTheDocument();

      // Token should be positioned using transform attribute
      const transform = token.getAttribute("transform");
      expect(transform).toContain("translate");

      // Extract translate values and verify they match expected pointy-top pixel coordinates
      // For (1,0) with size 30: hex center at x ≈ 51.96, y = 0
      // Token transform offsets by TOKEN_RADIUS (20), so translate is at (31.96, -20)
      const match = transform?.match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/);
      if (match) {
        const [, x, y] = match.map(parseFloat);
        const sqrt3 = Math.sqrt(3);
        const TOKEN_RADIUS = 20;
        expect(x).toBeCloseTo(30 * sqrt3 - TOKEN_RADIUS, 0);
        expect(y).toBeCloseTo(0 - TOKEN_RADIUS, 0);
      }
    });
  });
});
