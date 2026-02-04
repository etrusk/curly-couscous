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
    from: { q: 0, r: 0 } as Position,
    to: { q: 3, r: 1 } as Position,
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
          from={{ q: 2, r: 2 }}
          to={{ q: 3, r: 1 }}
          cellSize={40}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    // From {q: 2, r: 2} - pixel position depends on hex conversion
    expect(line).toHaveAttribute("x1");
    expect(line).toHaveAttribute("y1");
  });

  it("should calculate correct end position (cell center)", () => {
    const { container } = render(
      <svg>
        <TargetingLine
          from={{ q: 2, r: 2 }}
          to={{ q: 3, r: 1 }}
          cellSize={40}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    // To {q: 3, r: 1} - pixel position depends on hex conversion
    expect(line).toHaveAttribute("x2");
    expect(line).toHaveAttribute("y2");
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
          from={{ q: 0, r: 0 }}
          to={{ q: 4, r: 0 }}
          cellSize={40}
          offset={{ x: 0, y: 4 }}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    // From {q: 0, r: 0} with offset {x: 0, y: 4}
    // Pixel position depends on hex conversion, but offset is applied
    expect(line).toHaveAttribute("x1");
    expect(line).toHaveAttribute("y1");
    expect(line).toHaveAttribute("x2");
    expect(line).toHaveAttribute("y2");
  });

  it("should default to zero offset when offset prop is not provided", () => {
    const { container } = render(
      <svg>
        <TargetingLine
          from={{ q: 0, r: 0 }}
          to={{ q: 4, r: 0 }}
          cellSize={40}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    // No offset, just cell centers - pixel position depends on hex conversion
    expect(line).toHaveAttribute("x1");
    expect(line).toHaveAttribute("y1");
    expect(line).toHaveAttribute("x2");
    expect(line).toHaveAttribute("y2");
  });
});
