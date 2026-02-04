/**
 * Tests for IntentOverlay component - marker definitions and outline rendering.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { IntentOverlay } from "./IntentOverlay";

describe("IntentOverlay - Marker Definitions", () => {
  const defaultProps = {
    hexSize: 40,
  };

  describe("Marker Outline Rendering", () => {
    it("should render arrowhead-attack marker with outline polygon first", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="arrowhead-attack"]');
      expect(marker).toBeInTheDocument();

      const polygons = marker?.querySelectorAll("polygon");
      expect(polygons).toHaveLength(2);

      // First polygon is contrast-line outline
      const outlinePolygon = polygons?.[0];
      expect(outlinePolygon).toHaveAttribute("fill", "var(--contrast-line)");
      expect(outlinePolygon).toHaveAttribute("stroke", "var(--contrast-line)");

      // Second polygon is colored main
      const mainPolygon = polygons?.[1];
      expect(mainPolygon).toHaveAttribute("fill", "var(--action-attack)");
    });

    it("should render cross-heal marker with outline path first", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="cross-heal"]');
      expect(marker).toBeInTheDocument();

      const paths = marker?.querySelectorAll("path");
      expect(paths).toHaveLength(2);

      // First path is contrast-line outline
      const outlinePath = paths?.[0];
      expect(outlinePath).toHaveAttribute("stroke", "var(--contrast-line)");

      // Second path is colored main
      const mainPath = paths?.[1];
      expect(mainPath).toHaveAttribute("stroke", "var(--action-heal)");
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
      expect(mainCircle).toHaveAttribute("stroke", "var(--action-move)");
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
      expect(outlinePolygon).toHaveAttribute("stroke", "var(--contrast-line)");
      expect(outlinePolygon).toHaveAttribute("stroke-width", "3");
      expect(outlinePolygon).toHaveAttribute("fill", "none");

      // Second polygon is colored main
      const mainPolygon = polygons?.[1];
      expect(mainPolygon).toHaveAttribute("stroke", "var(--action-move)");
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

      const arrowheadAttack = container.querySelector(
        'marker[id="arrowhead-attack"]',
      );
      const crossHeal = container.querySelector('marker[id="cross-heal"]');
      const circleFriendly = container.querySelector(
        'marker[id="circle-friendly"]',
      );
      const diamondEnemy = container.querySelector(
        'marker[id="diamond-enemy"]',
      );

      expect(arrowheadAttack).toHaveAttribute("markerUnits", "userSpaceOnUse");
      expect(crossHeal).toHaveAttribute("markerUnits", "userSpaceOnUse");
      expect(circleFriendly).toHaveAttribute("markerUnits", "userSpaceOnUse");
      expect(diamondEnemy).toHaveAttribute("markerUnits", "userSpaceOnUse");
    });

    it("attack and heal markers have appropriate fixed dimensions", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const arrowheadAttack = container.querySelector(
        'marker[id="arrowhead-attack"]',
      );
      const crossHeal = container.querySelector('marker[id="cross-heal"]');

      expect(arrowheadAttack).toHaveAttribute("markerWidth", "12");
      expect(arrowheadAttack).toHaveAttribute("markerHeight", "8");
      expect(crossHeal).toHaveAttribute("markerWidth", "12");
      expect(crossHeal).toHaveAttribute("markerHeight", "12");
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
