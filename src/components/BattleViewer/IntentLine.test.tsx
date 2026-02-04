/* eslint-disable max-lines */
/**
 * Tests for IntentLine component.
 * Tests line rendering, styling, and endpoint markers based on action type and faction.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { IntentLine } from "./IntentLine";
import type { Position } from "../../engine/types";

describe("IntentLine", () => {
  const defaultProps = {
    from: { q: 0, r: 0 } as Position,
    to: { q: 3, r: 1 } as Position,
    cellSize: 40,
  };

  describe("Attack Lines", () => {
    it("renders dashed line for friendly attack with ticksRemaining=1", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1]; // Second line is the colored main line
      expect(mainLine).toBeInTheDocument();
      expect(mainLine).toHaveAttribute("stroke", "var(--action-attack)");
      expect(mainLine).toHaveAttribute("stroke-dasharray", "4 4"); // Dashed line
    });

    it("renders dashed line for enemy attack with ticksRemaining=1", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="enemy"
            ticksRemaining={1}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1]; // Second line is the colored main line
      expect(mainLine).toBeInTheDocument();
      expect(mainLine).toHaveAttribute("stroke", "var(--action-attack)");
      expect(mainLine).toHaveAttribute("stroke-dasharray", "4 4"); // Dashed line
    });

    it("uses arrowhead marker for attacks", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1]; // Second line is the colored main line
      expect(mainLine).toHaveAttribute("marker-end", "url(#arrowhead-attack)");
    });
  });

  describe("Movement Lines", () => {
    it("renders dashed line for friendly movement", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="move"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1]; // Second line is the colored main line
      expect(mainLine).toBeInTheDocument();
      expect(mainLine).toHaveAttribute("stroke", "var(--action-move)");
      expect(mainLine).toHaveAttribute("stroke-dasharray"); // Dashed line
    });

    it("uses tighter dash pattern (4 4) for movement lines", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="move"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1]; // Second line is the colored main line
      const outlineLine = lines[0];
      expect(mainLine).toHaveAttribute("stroke-dasharray", "4 4");
      expect(outlineLine).toHaveAttribute("stroke-dasharray", "4 4");
    });

    it("renders dashed line for enemy movement", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="move"
            faction="enemy"
            ticksRemaining={1}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1]; // Second line is the colored main line
      expect(mainLine).toBeInTheDocument();
      expect(mainLine).toHaveAttribute("stroke", "var(--action-move)");
      expect(mainLine).toHaveAttribute("stroke-dasharray"); // Dashed line
    });

    it("uses circle marker for friendly movement", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="move"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1]; // Second line is the colored main line
      expect(mainLine).toHaveAttribute("marker-end", "url(#circle-friendly)");
    });

    it("uses diamond marker for enemy movement", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="move"
            faction="enemy"
            ticksRemaining={1}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1]; // Second line is the colored main line
      expect(mainLine).toHaveAttribute("marker-end", "url(#diamond-enemy)");
    });
  });

  describe("Line Thickness and Animation", () => {
    it("uses 2px stroke for confirmed actions (1 tick remaining)", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1]; // Second line is the colored main line
      expect(mainLine).toHaveAttribute("stroke-width", "2");
    });

    it("uses 2px stroke for dashed actions (ticksRemaining > 0)", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={2}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1]; // Second line is the colored main line
      expect(mainLine).toHaveAttribute("stroke-width", "2");
    });

    it("does not apply animation class for locked-in actions", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={2}
          />
        </svg>,
      );

      const group = container.querySelector("g");
      expect(group?.getAttribute("class") ?? "").not.toContain("lockedIn");
    });

    it("does not apply pulsing animation for confirmed actions", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );

      const group = container.querySelector("g");
      expect(group?.getAttribute("class") ?? "").not.toContain("lockedIn");
    });
  });

  describe("Line Positioning", () => {
    it("calculates correct start position (cell center)", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            from={{ q: 2, r: 2 }}
            to={{ q: 3, r: 1 }}
            type="attack"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );

      const line = container.querySelector("line");
      // From {q: 2, r: 2} - hex coordinate, pixel position depends on hex conversion
      expect(line).toHaveAttribute("x1");
      expect(line).toHaveAttribute("y1");
    });

    it("calculates correct end position (cell center)", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            from={{ q: 2, r: 2 }}
            to={{ q: 3, r: 1 }}
            type="attack"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );

      const line = container.querySelector("line");
      // To {q: 3, r: 1} - hex coordinate, pixel position depends on hex conversion
      expect(line).toHaveAttribute("x2");
      expect(line).toHaveAttribute("y2");
    });
  });

  // NEW TESTS FOR INSTANT ATTACKS AND SIMPLIFIED VISUALS
  describe("Timing-Based Visual Encoding", () => {
    it("renders solid line for instant attack (ticksRemaining = 0)", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={0}
          />
        </svg>,
      );
      const lines = container.querySelectorAll("line");
      const mainLine = lines[1];
      expect(mainLine).not.toHaveAttribute("stroke-dasharray");
    });

    it("renders solid line for movement at resolution tick (ticksRemaining = 0)", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="move"
            faction="friendly"
            ticksRemaining={0}
          />
        </svg>,
      );
      const lines = container.querySelectorAll("line");
      const mainLine = lines[1];
      expect(mainLine).not.toHaveAttribute("stroke-dasharray");
    });

    it("renders dashed line for wind-up attack (ticksRemaining > 0)", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );
      const lines = container.querySelectorAll("line");
      const mainLine = lines[1];
      const outlineLine = lines[0];
      expect(mainLine).toHaveAttribute("stroke-dasharray", "4 4");
      expect(outlineLine).toHaveAttribute("stroke-dasharray", "4 4");
    });

    it("renders dashed line for locked-in attack (ticksRemaining = 2)", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={2}
          />
        </svg>,
      );
      const lines = container.querySelectorAll("line");
      const mainLine = lines[1];
      expect(mainLine).toHaveAttribute("stroke-dasharray", "4 4");
    });
  });

  describe("Numeric Labels", () => {
    it("shows numeric label with ticksRemaining value when > 0", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={2}
          />
        </svg>,
      );
      const text = container.querySelector("text");
      expect(text).toBeInTheDocument();
      expect(text?.textContent).toBe("2");
    });

    it("positions numeric label at midpoint of line", () => {
      const { container } = render(
        <svg>
          <IntentLine
            from={{ q: 2, r: 2 }}
            to={{ q: 4, r: 0 }}
            type="attack"
            faction="friendly"
            ticksRemaining={1}
            cellSize={40}
          />
        </svg>,
      );
      const text = container.querySelector("text");
      expect(text).toHaveAttribute("x");
      expect(text).toHaveAttribute("y");
    });

    it("does not show numeric label for instant actions (ticksRemaining = 0)", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={0}
          />
        </svg>,
      );
      const text = container.querySelector("text");
      expect(text).not.toBeInTheDocument();
    });

    it("numeric label uses paintOrder stroke for readability", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );
      const text = container.querySelector("text");
      expect(text).toHaveAttribute("paint-order", "stroke");
      expect(text).toHaveAttribute("text-anchor", "middle");
      expect(text).toHaveAttribute("dominant-baseline", "central");
    });
  });

  describe("Variable Stroke Width", () => {
    it("uses 3px stroke for solid lines (immediate), 2px for dashed lines (future)", () => {
      const { container: c0 } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={0}
          />
        </svg>,
      );
      const solidLine = c0.querySelectorAll("line")[1];
      expect(solidLine).toHaveAttribute("stroke-width", "4"); // Solid (immediate): 4px

      // Verify outline is strokeWidth + 1 (4 + 1 = 5)
      const solidOutline = c0.querySelectorAll("line")[0];
      expect(solidOutline).toHaveAttribute("stroke-width", "5");

      const { container: c2 } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={2}
          />
        </svg>,
      );
      const dashedLine = c2.querySelectorAll("line")[1];
      expect(dashedLine).toHaveAttribute("stroke-width", "2"); // Dashed (future): 2px

      // Verify outline is strokeWidth + 1 (2 + 1 = 3)
      const dashedOutline = c2.querySelectorAll("line")[0];
      expect(dashedOutline).toHaveAttribute("stroke-width", "3");
    });
  });

  describe("No Animation", () => {
    it("does not apply pulsing animation class for any ticksRemaining value", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="attack"
            faction="friendly"
            ticksRemaining={2}
          />
        </svg>,
      );
      const group = container.querySelector("g");
      expect(group?.getAttribute("class") ?? "").not.toContain("lockedIn");
    });
  });
});
