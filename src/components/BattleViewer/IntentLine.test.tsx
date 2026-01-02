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
    from: { x: 0, y: 0 } as Position,
    to: { x: 5, y: 5 } as Position,
    cellSize: 40,
  };

  describe("Attack Lines", () => {
    it("renders solid line for friendly attack", () => {
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
      expect(mainLine).toHaveAttribute("stroke", "#0072B2"); // Friendly blue
      expect(mainLine).not.toHaveAttribute("stroke-dasharray"); // Solid line
    });

    it("renders solid line for enemy attack", () => {
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
      expect(mainLine).toHaveAttribute("stroke", "#E69F00"); // Enemy orange
      expect(mainLine).not.toHaveAttribute("stroke-dasharray"); // Solid line
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
      expect(mainLine).toHaveAttribute(
        "marker-end",
        "url(#arrowhead-friendly)",
      );
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
      expect(mainLine).toHaveAttribute("stroke", "#0072B2"); // Friendly blue
      expect(mainLine).toHaveAttribute("stroke-dasharray"); // Dashed line
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
      expect(mainLine).toHaveAttribute("stroke", "#E69F00"); // Enemy orange
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
    it("uses 3px stroke for confirmed actions (1 tick remaining)", () => {
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
      expect(mainLine).toHaveAttribute("stroke-width", "3");
    });

    it("uses 4px stroke for locked-in actions (2+ ticks remaining)", () => {
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
      expect(mainLine).toHaveAttribute("stroke-width", "4");
    });

    it("applies pulsing animation class for locked-in actions", () => {
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
      expect(group?.getAttribute("class")).toContain("lockedIn");
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
      expect(group?.getAttribute("class")).not.toContain("lockedIn");
    });
  });

  describe("Line Positioning", () => {
    it("calculates correct start position (cell center)", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            from={{ x: 2, y: 3 }}
            to={{ x: 5, y: 7 }}
            type="attack"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );

      const line = container.querySelector("line");
      // From (2, 3) center: (2 * 40 + 20, 3 * 40 + 20) = (100, 140)
      expect(line).toHaveAttribute("x1", "100");
      expect(line).toHaveAttribute("y1", "140");
    });

    it("calculates correct end position (cell center)", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            from={{ x: 2, y: 3 }}
            to={{ x: 5, y: 7 }}
            type="attack"
            faction="friendly"
            ticksRemaining={1}
          />
        </svg>,
      );

      const line = container.querySelector("line");
      // To (5, 7) center: (5 * 40 + 20, 7 * 40 + 20) = (220, 300)
      expect(line).toHaveAttribute("x2", "220");
      expect(line).toHaveAttribute("y2", "300");
    });
  });

  describe("Accessibility - Contrasting Outlines", () => {
    it("should render two lines for attack intent (outline + main)", () => {
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
      expect(lines).toHaveLength(2);
    });

    it("should render two lines for move intent (outline + main)", () => {
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
      expect(lines).toHaveLength(2);
    });

    it("should render outline line first in DOM order (behind main)", () => {
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
      const outlineLine = lines[0];
      const mainLine = lines[1];

      // Outline should be white
      expect(outlineLine).toHaveAttribute("stroke", "white");
      // Main should be colored
      expect(mainLine).toHaveAttribute("stroke", "#0072B2");
    });

    it("should use white stroke for outline", () => {
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
      const outlineLine = lines[0];
      expect(outlineLine).toHaveAttribute("stroke", "white");
    });

    it("should use 5px outline stroke for confirmed actions (3px main + 2)", () => {
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
      const outlineLine = lines[0];
      const mainLine = lines[1];

      expect(outlineLine).toHaveAttribute("stroke-width", "5");
      expect(mainLine).toHaveAttribute("stroke-width", "3");
    });

    it("should use 6px outline stroke for locked-in actions (4px main + 2)", () => {
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
      const outlineLine = lines[0];
      const mainLine = lines[1];

      expect(outlineLine).toHaveAttribute("stroke-width", "6");
      expect(mainLine).toHaveAttribute("stroke-width", "4");
    });

    it("should not apply marker to outline line", () => {
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
      const outlineLine = lines[0];
      expect(outlineLine).not.toHaveAttribute("marker-end");
    });

    it("should apply marker to main line only", () => {
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
      expect(mainLine).toHaveAttribute(
        "marker-end",
        "url(#arrowhead-friendly)",
      );
    });

    it("should wrap lines in group element", () => {
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
      expect(group).toBeInTheDocument();

      const lines = group?.querySelectorAll("line");
      expect(lines).toHaveLength(2);
    });

    it("should apply lockedIn class to group for locked-in actions", () => {
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
      expect(group?.getAttribute("class")).toContain("lockedIn");
    });

    it("should not apply lockedIn class to group for confirmed actions", () => {
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
      expect(group?.getAttribute("class")).not.toContain("lockedIn");
    });
  });
});
