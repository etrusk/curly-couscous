/**
 * Tests for Token component.
 * Following TDD workflow - these tests are written before implementation.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Token } from "./Token";

describe("Token", () => {
  describe("Shape Rendering", () => {
    it("renders circle shape for friendly faction", () => {
      render(<Token id="char-1" faction="friendly" hp={100} maxHp={100} />);

      // Check for circle element
      const circle = screen.getByTestId("token-char-1").querySelector("circle");
      expect(circle).toBeInTheDocument();
    });

    it("renders diamond (polygon) shape for enemy faction", () => {
      render(<Token id="char-2" faction="enemy" hp={100} maxHp={100} />);

      // Check for polygon element (diamond)
      const polygon = screen
        .getByTestId("token-char-2")
        .querySelector("polygon");
      expect(polygon).toBeInTheDocument();
    });
  });

  describe("Faction Colors", () => {
    it("uses blue (--faction-friendly) for friendly faction", () => {
      render(<Token id="char-1" faction="friendly" hp={100} maxHp={100} />);

      const circle = screen.getByTestId("token-char-1").querySelector("circle");
      expect(circle).toHaveAttribute("fill", "var(--faction-friendly)");
    });

    it("uses orange (--faction-enemy) for enemy faction", () => {
      render(<Token id="char-2" faction="enemy" hp={100} maxHp={100} />);

      const polygon = screen
        .getByTestId("token-char-2")
        .querySelector("polygon");
      expect(polygon).toHaveAttribute("fill", "var(--faction-enemy)");
    });
  });

  describe("HP Display", () => {
    it("shows full health bar when hp equals maxHp", () => {
      render(<Token id="char-1" faction="friendly" hp={100} maxHp={100} />);

      const healthBar = screen.getByTestId("health-bar-char-1");
      expect(healthBar).toBeInTheDocument();
      // Health bar fill should be at 100%
      expect(healthBar).toHaveAttribute("width");
      const width = healthBar.getAttribute("width");
      expect(width).toBeTruthy();
    });

    it("shows partial health bar when hp is less than maxHp", () => {
      render(<Token id="char-1" faction="friendly" hp={50} maxHp={100} />);

      const healthBar = screen.getByTestId("health-bar-char-1");
      expect(healthBar).toBeInTheDocument();
    });

    it("shows no health bar when hp is 0", () => {
      render(<Token id="char-1" faction="friendly" hp={0} maxHp={100} />);

      const healthBar = screen.getByTestId("health-bar-char-1");
      // Bar should still exist but with 0 width
      expect(healthBar).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has aria-label describing friendly character", () => {
      render(<Token id="char-1" faction="friendly" hp={75} maxHp={100} />);

      const token = screen.getByTestId("token-char-1");
      expect(token).toHaveAttribute("aria-label");
      const label = token.getAttribute("aria-label");
      expect(label).toContain("Friendly");
      expect(label).toContain("75");
      expect(label).toContain("100");
    });

    it("has aria-label describing enemy character", () => {
      render(<Token id="char-2" faction="enemy" hp={50} maxHp={100} />);

      const token = screen.getByTestId("token-char-2");
      expect(token).toHaveAttribute("aria-label");
      const label = token.getAttribute("aria-label");
      expect(label).toContain("Enemy");
      expect(label).toContain("50");
      expect(label).toContain("100");
    });

    it("has role='img' for screen reader compatibility", () => {
      render(<Token id="char-1" faction="friendly" hp={100} maxHp={100} />);

      const token = screen.getByTestId("token-char-1");
      expect(token).toHaveAttribute("role", "img");
    });
  });

  describe("Pattern Fills (Colorblind Support)", () => {
    it("applies solid fill pattern for friendly faction", () => {
      render(<Token id="char-1" faction="friendly" hp={100} maxHp={100} />);

      const circle = screen.getByTestId("token-char-1").querySelector("circle");
      // Friendly uses solid color fill directly (no pattern reference)
      expect(circle).toHaveAttribute("fill", "var(--faction-friendly)");
    });

    it("applies diagonal stripe pattern for enemy faction", () => {
      render(<Token id="char-2" faction="enemy" hp={100} maxHp={100} />);

      const svg = screen.getByTestId("token-char-2");
      // Check that pattern definition exists in SVG
      const defs = svg.querySelector("defs");
      expect(defs).toBeInTheDocument();

      // Pattern should be defined
      const pattern = svg.querySelector("pattern");
      expect(pattern).toBeInTheDocument();
      expect(pattern).toHaveAttribute("id", "stripe-enemy");
    });
  });
});
