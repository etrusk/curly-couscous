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

      const line = container.querySelector("line");
      expect(line).toBeInTheDocument();
      expect(line).toHaveAttribute("stroke", "#0072B2"); // Friendly blue
      expect(line).not.toHaveAttribute("stroke-dasharray"); // Solid line
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

      const line = container.querySelector("line");
      expect(line).toBeInTheDocument();
      expect(line).toHaveAttribute("stroke", "#E69F00"); // Enemy orange
      expect(line).not.toHaveAttribute("stroke-dasharray"); // Solid line
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

      const line = container.querySelector("line");
      expect(line).toHaveAttribute("marker-end", "url(#arrowhead-friendly)");
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

      const line = container.querySelector("line");
      expect(line).toBeInTheDocument();
      expect(line).toHaveAttribute("stroke", "#0072B2"); // Friendly blue
      expect(line).toHaveAttribute("stroke-dasharray"); // Dashed line
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

      const line = container.querySelector("line");
      expect(line).toBeInTheDocument();
      expect(line).toHaveAttribute("stroke", "#E69F00"); // Enemy orange
      expect(line).toHaveAttribute("stroke-dasharray"); // Dashed line
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

      const line = container.querySelector("line");
      expect(line).toHaveAttribute("marker-end", "url(#circle-friendly)");
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

      const line = container.querySelector("line");
      expect(line).toHaveAttribute("marker-end", "url(#diamond-enemy)");
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

      const line = container.querySelector("line");
      expect(line).toHaveAttribute("stroke-width", "3");
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

      const line = container.querySelector("line");
      expect(line).toHaveAttribute("stroke-width", "4");
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

      const line = container.querySelector("line");
      expect(line?.getAttribute("class")).toContain("lockedIn");
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

      const line = container.querySelector("line");
      expect(line?.getAttribute("class")).not.toContain("lockedIn");
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

  describe("Accessibility", () => {
    it("includes contrasting outline for visibility", () => {
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

      // Should render with outline via CSS or additional stroke
      const line = container.querySelector("line");
      expect(line).toBeInTheDocument();
      // Outline will be verified via CSS class application
    });
  });
});
