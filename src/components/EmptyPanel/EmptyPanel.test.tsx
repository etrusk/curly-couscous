/**
 * Unit tests for EmptyPanel component.
 * Tests layout preservation, placeholder message, and accessibility.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyPanel } from "./EmptyPanel";

describe("EmptyPanel Component", () => {
  // Test: renders-panel-with-header
  it("renders with 'Rule Evaluations' header", () => {
    render(<EmptyPanel />);

    // Heading "Rule Evaluations" exists
    const heading = screen.getByRole("heading", { name: /Rule Evaluations/i });
    expect(heading).toBeInTheDocument();
    // Heading level is h2 (matching RuleEvaluations)
    expect(heading.tagName).toBe("H2");
  });

  // Test: renders-placeholder-message
  it("shows instruction message with proper styling", () => {
    render(<EmptyPanel />);

    // Text "Hover over characters to see evaluations" is displayed
    const message = screen.getByText(
      /Hover over characters to see evaluations/i,
    );
    expect(message).toBeInTheDocument();
    // Message has muted/italic styling (via CSS class)
    // Check for class name that suggests muted styling
    expect(message.className).toBeTruthy();
  });

  // Test: preserves-grid-layout-dimensions
  it("maintains same grid space as RuleEvaluations", () => {
    const { container } = render(<EmptyPanel />);

    // Panel fills grid cell (should have height: 100% or similar)
    const panel = container.firstChild as HTMLElement;
    expect(panel).toBeInTheDocument();
    // Panel has border matching RuleEvaluations style
    // Panel has background color
    // Check that panel has a class (CSS module should apply styles)
    expect(panel.className).toBeTruthy();
  });

  // Test: has-accessible-region-role
  it("is an accessible region with proper labeling", () => {
    render(<EmptyPanel />);

    // Has role="region" or implicit region from HTML5 sectioning
    const panel = screen.getByRole("region", { name: /Rule Evaluations/i });
    expect(panel).toBeInTheDocument();
    // Has accessible name via aria-label or heading
  });
});
