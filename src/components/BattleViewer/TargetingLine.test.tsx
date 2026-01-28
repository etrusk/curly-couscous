/**
 * Tests for TargetingLine component.
 * Tests line rendering, styling, and positioning for movement target lines.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TargetingLine } from "./TargetingLine";
import type { Position } from "../../engine/types";

describe("TargetingLine", () => {
  const defaultProps = {
    from: { x: 0, y: 0 } as Position,
    to: { x: 5, y: 5 } as Position,
    cellSize: 40,
  };

  it("should render exactly one line element (no outline)", () => {
    const { container } = render(
      <svg>
        <TargetingLine {...defaultProps} />
      </svg>,
    );

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(1);
  });

  it("should use neutral gray color via CSS variable", () => {
    const { container } = render(
      <svg>
        <TargetingLine {...defaultProps} />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).toHaveAttribute("stroke", "var(--targeting-line-color)");
  });

  it("should use dotted pattern (1 3)", () => {
    const { container } = render(
      <svg>
        <TargetingLine {...defaultProps} />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).toHaveAttribute("stroke-dasharray", "1 3");
  });

  it("should use thin stroke width (1.5px)", () => {
    const { container } = render(
      <svg>
        <TargetingLine {...defaultProps} />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).toHaveAttribute("stroke-width", "1.5");
  });

  it("should use reduced opacity (0.4)", () => {
    const { container } = render(
      <svg>
        <TargetingLine {...defaultProps} />
      </svg>,
    );

    const line = container.querySelector("line");
    const group = container.querySelector("g");

    // Opacity can be on line or group
    const lineOpacity = line?.getAttribute("opacity");
    const groupOpacity = group?.getAttribute("opacity");

    expect(lineOpacity === "0.4" || groupOpacity === "0.4").toBe(true);
  });

  it("should calculate correct start position (cell center)", () => {
    const { container } = render(
      <svg>
        <TargetingLine
          from={{ x: 2, y: 3 }}
          to={{ x: 5, y: 7 }}
          cellSize={40}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    // From (2, 3) center: (2 * 40 + 20, 3 * 40 + 20) = (100, 140)
    expect(line).toHaveAttribute("x1", "100");
    expect(line).toHaveAttribute("y1", "140");
  });

  it("should calculate correct end position (cell center)", () => {
    const { container } = render(
      <svg>
        <TargetingLine
          from={{ x: 2, y: 3 }}
          to={{ x: 5, y: 7 }}
          cellSize={40}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    // To (5, 7) center: (5 * 40 + 20, 7 * 40 + 20) = (220, 300)
    expect(line).toHaveAttribute("x2", "220");
    expect(line).toHaveAttribute("y2", "300");
  });

  it("should have no endpoint markers", () => {
    const { container } = render(
      <svg>
        <TargetingLine {...defaultProps} />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).not.toHaveAttribute("marker-end");
    expect(line).not.toHaveAttribute("marker-start");
  });

  it("should use uniform color for all factions (no faction prop)", () => {
    const { container: container1 } = render(
      <svg>
        <TargetingLine {...defaultProps} />
      </svg>,
    );

    const { container: container2 } = render(
      <svg>
        <TargetingLine {...defaultProps} />
      </svg>,
    );

    const line1 = container1.querySelector("line");
    const line2 = container2.querySelector("line");

    // Both should have identical stroke color (no faction distinction)
    expect(line1?.getAttribute("stroke")).toBe("var(--targeting-line-color)");
    expect(line2?.getAttribute("stroke")).toBe("var(--targeting-line-color)");
    expect(line1?.getAttribute("stroke")).toBe(line2?.getAttribute("stroke"));
  });

  it("should apply perpendicular offset when provided", () => {
    const { container } = render(
      <svg>
        <TargetingLine
          from={{ x: 0, y: 0 }}
          to={{ x: 5, y: 0 }}
          cellSize={40}
          offset={{ x: 0, y: 4 }}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    // From (0, 0) center: (0 * 40 + 20, 0 * 40 + 20) = (20, 20)
    // With offset (0, 4): (20 + 0, 20 + 4) = (20, 24)
    expect(line).toHaveAttribute("x1", "20");
    expect(line).toHaveAttribute("y1", "24");
    // To (5, 0) center: (5 * 40 + 20, 0 * 40 + 20) = (220, 20)
    // With offset (0, 4): (220 + 0, 20 + 4) = (220, 24)
    expect(line).toHaveAttribute("x2", "220");
    expect(line).toHaveAttribute("y2", "24");
  });

  it("should default to zero offset when offset prop is not provided", () => {
    const { container } = render(
      <svg>
        <TargetingLine
          from={{ x: 0, y: 0 }}
          to={{ x: 5, y: 0 }}
          cellSize={40}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    // No offset, so just cell centers
    expect(line).toHaveAttribute("x1", "20");
    expect(line).toHaveAttribute("y1", "20");
    expect(line).toHaveAttribute("x2", "220");
    expect(line).toHaveAttribute("y2", "20");
  });
});
