/**
 * Tests for IntentOverlay component - marker definitions and outline rendering.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { IntentOverlay } from "./IntentOverlay";

describe("IntentOverlay", () => {
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

      // First polygon is white outline
      const outlinePolygon = polygons?.[0];
      expect(outlinePolygon).toHaveAttribute("fill", "white");
      expect(outlinePolygon).toHaveAttribute("stroke", "white");

      // Second polygon is colored main
      const mainPolygon = polygons?.[1];
      expect(mainPolygon).toHaveAttribute("fill", "#0072B2");
    });

    it("should render arrowhead-enemy marker with outline polygon first", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="arrowhead-enemy"]');
      expect(marker).toBeInTheDocument();

      const polygons = marker?.querySelectorAll("polygon");
      expect(polygons).toHaveLength(2);

      // First polygon is white outline
      const outlinePolygon = polygons?.[0];
      expect(outlinePolygon).toHaveAttribute("fill", "white");
      expect(outlinePolygon).toHaveAttribute("stroke", "white");

      // Second polygon is colored main
      const mainPolygon = polygons?.[1];
      expect(mainPolygon).toHaveAttribute("fill", "#E69F00");
    });

    it("should render circle-friendly marker with outline stroke behind", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="circle-friendly"]');
      expect(marker).toBeInTheDocument();

      const circles = marker?.querySelectorAll("circle");
      expect(circles).toHaveLength(2);

      // First circle is white outline (thicker)
      const outlineCircle = circles?.[0];
      expect(outlineCircle).toHaveAttribute("stroke", "white");
      expect(outlineCircle).toHaveAttribute("stroke-width", "4");
      expect(outlineCircle).toHaveAttribute("fill", "none");

      // Second circle is colored main
      const mainCircle = circles?.[1];
      expect(mainCircle).toHaveAttribute("stroke", "#0072B2");
      expect(mainCircle).toHaveAttribute("stroke-width", "2");
    });

    it("should render diamond-enemy marker with outline stroke behind", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="diamond-enemy"]');
      expect(marker).toBeInTheDocument();

      const polygons = marker?.querySelectorAll("polygon");
      expect(polygons).toHaveLength(2);

      // First polygon is white outline (thicker)
      const outlinePolygon = polygons?.[0];
      expect(outlinePolygon).toHaveAttribute("stroke", "white");
      expect(outlinePolygon).toHaveAttribute("stroke-width", "4");
      expect(outlinePolygon).toHaveAttribute("fill", "none");

      // Second polygon is colored main
      const mainPolygon = polygons?.[1];
      expect(mainPolygon).toHaveAttribute("stroke", "#E69F00");
      expect(mainPolygon).toHaveAttribute("stroke-width", "2");
    });

    it("should set overflow='visible' on all markers", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const markers = container.querySelectorAll("marker");
      expect(markers.length).toBeGreaterThanOrEqual(4);

      markers.forEach((marker) => {
        expect(marker).toHaveAttribute("overflow", "visible");
      });
    });
  });
});
