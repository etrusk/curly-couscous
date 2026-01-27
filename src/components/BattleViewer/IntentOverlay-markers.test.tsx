/**
 * Tests for IntentOverlay component - marker definitions and outline rendering.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { IntentOverlay } from "./IntentOverlay";

describe("IntentOverlay - Marker Definitions", () => {
  const defaultProps = {
    gridWidth: 12,
    gridHeight: 12,
    cellSize: 40,
  };

  describe("Marker Outline Rendering", () => {
    it("should render arrowhead-friendly marker with outline polygon first", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="arrowhead-friendly"]');
      expect(marker).toBeInTheDocument();

      const polygons = marker?.querySelectorAll("polygon");
      expect(polygons).toHaveLength(2);

      // First polygon is contrast-line outline
      const outlinePolygon = polygons?.[0];
      expect(outlinePolygon).toHaveAttribute("fill", "var(--contrast-line)");
      expect(outlinePolygon).toHaveAttribute("stroke", "var(--contrast-line)");

      // Second polygon is colored main
      const mainPolygon = polygons?.[1];
      expect(mainPolygon).toHaveAttribute("fill", "var(--faction-friendly)");
    });

    it("should render arrowhead-enemy marker with outline polygon first", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="arrowhead-enemy"]');
      expect(marker).toBeInTheDocument();

      const polygons = marker?.querySelectorAll("polygon");
      expect(polygons).toHaveLength(2);

      // First polygon is contrast-line outline
      const outlinePolygon = polygons?.[0];
      expect(outlinePolygon).toHaveAttribute("fill", "var(--contrast-line)");
      expect(outlinePolygon).toHaveAttribute("stroke", "var(--contrast-line)");

      // Second polygon is colored main
      const mainPolygon = polygons?.[1];
      expect(mainPolygon).toHaveAttribute("fill", "var(--faction-enemy)");
    });

    it("circle-friendly marker uses reduced stroke widths (3/1.5)", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="circle-friendly"]');
      expect(marker).toBeInTheDocument();

      const circles = marker?.querySelectorAll("circle");
      expect(circles).toHaveLength(2);

      // First circle is contrast-line outline (thicker)
      const outlineCircle = circles?.[0];
      expect(outlineCircle).toHaveAttribute("stroke", "var(--contrast-line)");
      expect(outlineCircle).toHaveAttribute("stroke-width", "3");
      expect(outlineCircle).toHaveAttribute("fill", "none");

      // Second circle is colored main
      const mainCircle = circles?.[1];
      expect(mainCircle).toHaveAttribute("stroke", "var(--faction-friendly)");
      expect(mainCircle).toHaveAttribute("stroke-width", "1.5");
    });

    it("diamond-enemy marker uses reduced stroke widths (3/1.5)", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="diamond-enemy"]');
      expect(marker).toBeInTheDocument();

      const polygons = marker?.querySelectorAll("polygon");
      expect(polygons).toHaveLength(2);

      // First polygon is white outline (thicker)
      const outlinePolygon = polygons?.[0];
      expect(outlinePolygon).toHaveAttribute("stroke", "white");
      expect(outlinePolygon).toHaveAttribute("stroke-width", "3");
      expect(outlinePolygon).toHaveAttribute("fill", "none");

      // Second polygon is colored main
      const mainPolygon = polygons?.[1];
      expect(mainPolygon).toHaveAttribute("stroke", "#E69F00");
      expect(mainPolygon).toHaveAttribute("stroke-width", "1.5");
    });

    it("should set overflow='visible' on all markers", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const markers = container.querySelectorAll("marker");
      expect(markers.length).toBeGreaterThanOrEqual(4);

      markers.forEach((marker) => {
        expect(marker).toHaveAttribute("overflow", "visible");
      });
    });

    it("markers use userSpaceOnUse for consistent sizing", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const arrowheadFriendly = container.querySelector(
        'marker[id="arrowhead-friendly"]',
      );
      const arrowheadEnemy = container.querySelector(
        'marker[id="arrowhead-enemy"]',
      );
      const circleFriendly = container.querySelector(
        'marker[id="circle-friendly"]',
      );
      const diamondEnemy = container.querySelector(
        'marker[id="diamond-enemy"]',
      );

      expect(arrowheadFriendly).toHaveAttribute(
        "markerUnits",
        "userSpaceOnUse",
      );
      expect(arrowheadEnemy).toHaveAttribute("markerUnits", "userSpaceOnUse");
      expect(circleFriendly).toHaveAttribute("markerUnits", "userSpaceOnUse");
      expect(diamondEnemy).toHaveAttribute("markerUnits", "userSpaceOnUse");
    });

    it("arrowhead markers have appropriate fixed dimensions", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const arrowheadFriendly = container.querySelector(
        'marker[id="arrowhead-friendly"]',
      );
      const arrowheadEnemy = container.querySelector(
        'marker[id="arrowhead-enemy"]',
      );

      expect(arrowheadFriendly).toHaveAttribute("markerWidth", "12");
      expect(arrowheadFriendly).toHaveAttribute("markerHeight", "8");
      expect(arrowheadEnemy).toHaveAttribute("markerWidth", "12");
      expect(arrowheadEnemy).toHaveAttribute("markerHeight", "8");
    });

    it("movement markers have appropriate fixed dimensions", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const circleFriendly = container.querySelector(
        'marker[id="circle-friendly"]',
      );
      const diamondEnemy = container.querySelector(
        'marker[id="diamond-enemy"]',
      );

      expect(circleFriendly).toHaveAttribute("markerWidth", "12");
      expect(circleFriendly).toHaveAttribute("markerHeight", "12");
      expect(diamondEnemy).toHaveAttribute("markerWidth", "12");
      expect(diamondEnemy).toHaveAttribute("markerHeight", "12");
    });
  });
});
