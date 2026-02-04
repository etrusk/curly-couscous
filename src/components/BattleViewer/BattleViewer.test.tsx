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
    render(<BattleViewer />);

    const grid = screen.getByRole("grid");
    const gridViewBox = grid.getAttribute("viewBox");

    // Query all SVG elements in the container
    const { container } = render(<BattleViewer />);
    const allSvgs = container.querySelectorAll("svg");

    // All SVGs should share the same viewBox if overlays are present
    // For now, just verify grid has a viewBox
    expect(gridViewBox).toBeTruthy();

    // If overlays render, they should match
    // This test will be more useful once we have game state with intents/damage
    for (const svg of Array.from(allSvgs)) {
      const vb = svg.getAttribute("viewBox");
      if (vb && svg !== grid) {
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
            position: { q: 1, r: -1 },
            faction: "friendly",
            hp: 100,
            maxHp: 100,
            slotPosition: 1,
            skills: [],
            behaviorRules: [],
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
            position: { q: 0, r: 0 },
            faction: "friendly",
            hp: 100,
            maxHp: 100,
            slotPosition: 1,
            skills: [],
            behaviorRules: [],
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
});
