/**
 * Tests for action-based color system in IntentLine.
 * Validates that colors are determined by action type (attack/heal/move), not faction.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { IntentLine } from "./IntentLine";
import type { Position } from "../../engine/types";

describe("IntentLine - Action Colors", () => {
  const defaultProps = {
    from: { x: 0, y: 0 } as Position,
    to: { x: 5, y: 5 } as Position,
    cellSize: 40,
  };

  describe("Attack Color", () => {
    it("attack-line-uses-action-attack-color-friendly", () => {
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
      expect(mainLine).toHaveAttribute("stroke", "var(--action-attack)");
      expect(mainLine).not.toHaveAttribute("stroke", "var(--faction-friendly)");
    });

    it("attack-line-uses-action-attack-color-enemy", () => {
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
      const mainLine = lines[1];
      expect(mainLine).toHaveAttribute("stroke", "var(--action-attack)");
    });

    it("attack-line-uses-arrowhead-attack-marker", () => {
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
      expect(mainLine).not.toHaveAttribute(
        "marker-end",
        "url(#arrowhead-friendly)",
      );
    });

    it("attack-line-enemy-uses-same-arrowhead-attack-marker", () => {
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
      const mainLine = lines[1];
      expect(mainLine).toHaveAttribute("marker-end", "url(#arrowhead-attack)");
    });
  });

  describe("Heal Color", () => {
    it("heal-line-uses-action-heal-color-friendly", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="heal"
            faction="friendly"
            ticksRemaining={0}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1];
      expect(mainLine).toHaveAttribute("stroke", "var(--action-heal)");
      expect(mainLine).not.toHaveAttribute("stroke-dasharray");
    });

    it("heal-line-uses-action-heal-color-enemy", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="heal"
            faction="enemy"
            ticksRemaining={0}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1];
      expect(mainLine).toHaveAttribute("stroke", "var(--action-heal)");
    });

    it("heal-line-uses-cross-marker", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="heal"
            faction="friendly"
            ticksRemaining={0}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      const mainLine = lines[1];
      expect(mainLine).toHaveAttribute("marker-end", "url(#cross-heal)");
    });

    it("heal-line-renders-two-lines", () => {
      const { container } = render(
        <svg>
          <IntentLine
            {...defaultProps}
            type="heal"
            faction="friendly"
            ticksRemaining={0}
          />
        </svg>,
      );

      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(2);
      expect(lines[0]).toHaveAttribute("stroke", "var(--contrast-line)");
      expect(lines[1]).toHaveAttribute("stroke", "var(--action-heal)");
    });
  });

  describe("Move Color", () => {
    it("move-line-uses-action-move-color-friendly", () => {
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
      const mainLine = lines[1];
      expect(mainLine).toHaveAttribute("stroke", "var(--action-move)");
    });

    it("move-line-uses-action-move-color-enemy", () => {
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
      const mainLine = lines[1];
      expect(mainLine).toHaveAttribute("stroke", "var(--action-move)");
    });
  });
});
