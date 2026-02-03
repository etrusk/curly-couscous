/**
 * Tests for IntentLine component accessibility features.
 * Tests contrasting outlines, line grouping, and visual clarity enhancements.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { IntentLine } from "./IntentLine";
import type { Position } from "../../engine/types";

describe("IntentLine - Accessibility", () => {
  const defaultProps = {
    from: { x: 0, y: 0 } as Position,
    to: { x: 5, y: 5 } as Position,
    cellSize: 40,
  };

  describe("Contrasting Outlines", () => {
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
      expect(outlineLine).toHaveAttribute("stroke", "var(--contrast-line)");
      // Main should be colored
      expect(mainLine).toHaveAttribute("stroke", "var(--action-attack)");
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
      expect(outlineLine).toHaveAttribute("stroke", "var(--contrast-line)");
    });

    it("uses 3px outline stroke for dashed actions (2px main + 1)", () => {
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

      expect(outlineLine).toHaveAttribute("stroke-width", "3"); // 2px + 1
      expect(mainLine).toHaveAttribute("stroke-width", "2"); // Dashed (future)
    });

    it("uses 5px outline stroke for solid actions (4px main + 1)", () => {
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
      const outlineLine = lines[0];
      const mainLine = lines[1];

      expect(outlineLine).toHaveAttribute("stroke-width", "5"); // 4px + 1
      expect(mainLine).toHaveAttribute("stroke-width", "4"); // Solid (immediate)
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
      expect(mainLine).toHaveAttribute("marker-end", "url(#arrowhead-attack)");
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

    it("should not apply lockedIn class to group for locked-in actions", () => {
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
      expect(group?.getAttribute("class") ?? "").not.toContain("lockedIn");
    });

    it("uses round line caps on main line for softer appearance", () => {
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
      expect(mainLine).toHaveAttribute("stroke-linecap", "round");
    });

    it("uses round line caps on outline line for consistency", () => {
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
      const outlineLine = lines[0]; // First line is the outline
      expect(outlineLine).toHaveAttribute("stroke-linecap", "round");
    });
  });
});
