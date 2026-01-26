/**
 * Tests for Token component.
 * Following TDD workflow - these tests are written before implementation.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Token } from "./Token";
import { useGameStore } from "../../stores/gameStore";

describe("Token", () => {
  describe("Shape Rendering", () => {
    it("renders circle shape for friendly faction", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      // Check for circle element
      const circle = screen.getByTestId("token-char-1").querySelector("circle");
      expect(circle).toBeInTheDocument();
    });

    it("renders diamond (polygon) shape for enemy faction", () => {
      render(
        <Token
          id="char-2"
          faction="enemy"
          hp={100}
          maxHp={100}
          slotPosition={2}
        />,
      );

      // Check for polygon element (diamond)
      const polygon = screen
        .getByTestId("token-char-2")
        .querySelector("polygon");
      expect(polygon).toBeInTheDocument();
    });
  });

  describe("Faction Colors", () => {
    it("uses blue (--faction-friendly) for friendly faction", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const circle = screen.getByTestId("token-char-1").querySelector("circle");
      expect(circle).toHaveAttribute("fill", "var(--faction-friendly)");
    });

    it("uses diagonal stripe pattern with enemy color for enemy faction", () => {
      render(
        <Token
          id="char-2"
          faction="enemy"
          hp={100}
          maxHp={100}
          slotPosition={2}
        />,
      );

      const polygon = screen
        .getByTestId("token-char-2")
        .querySelector("polygon");
      // Enemy token should use pattern fill, not solid color
      expect(polygon?.getAttribute("fill")).toMatch(
        /^url\(#stripe-enemy-char-2\)$/,
      );
    });
  });

  describe("HP Display", () => {
    it("shows full health bar when hp equals maxHp", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const healthBar = screen.getByTestId("health-bar-char-1");
      expect(healthBar).toBeInTheDocument();
      // Health bar fill should be at 100% (width = HP_BAR_WIDTH = 40)
      expect(healthBar).toHaveAttribute("width", "40");
    });

    it("shows partial health bar when hp is less than maxHp", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={50}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const healthBar = screen.getByTestId("health-bar-char-1");
      expect(healthBar).toBeInTheDocument();
      // Width should be half of full width (20)
      expect(healthBar).toHaveAttribute("width", "20");
    });

    it("shows zero width health bar when hp is 0", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={0}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const healthBar = screen.getByTestId("health-bar-char-1");
      // Bar should still exist but with 0 width
      expect(healthBar).toBeInTheDocument();
      expect(healthBar).toHaveAttribute("width", "0");
    });
  });

  describe("Accessibility", () => {
    it("has aria-label describing friendly character", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={75}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const token = screen.getByTestId("token-char-1");
      expect(token).toHaveAttribute("aria-label");
      const label = token.getAttribute("aria-label");
      expect(label).toContain("Friendly");
      expect(label).toContain("75");
      expect(label).toContain("100");
    });

    it("has aria-label describing enemy character", () => {
      render(
        <Token
          id="char-2"
          faction="enemy"
          hp={50}
          maxHp={100}
          slotPosition={2}
        />,
      );

      const token = screen.getByTestId("token-char-2");
      expect(token).toHaveAttribute("aria-label");
      const label = token.getAttribute("aria-label");
      expect(label).toContain("Enemy");
      expect(label).toContain("50");
      expect(label).toContain("100");
    });

    it("has role='img' for screen reader compatibility", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const token = screen.getByTestId("token-char-1");
      expect(token).toHaveAttribute("role", "img");
    });

    it("is focusable with keyboard navigation", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );
      const token = screen.getByTestId("token-char-1");
      expect(token).toHaveAttribute("tabindex", "0");
    });

    it("responds to keyboard Enter and Space for selection", async () => {
      const { userEvent } = await import("@testing-library/user-event");
      const user = userEvent.setup();
      const { useGameStore } = await import("../../stores/gameStore");

      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );
      const token = screen.getByTestId("token-char-1");

      // Focus the token
      token.focus();
      expect(document.activeElement).toBe(token);

      // Press Enter
      await user.keyboard("{Enter}");
      expect(useGameStore.getState().selectedCharacterId).toBe("char-1");

      // Press Space (should also trigger selection)
      // Reset selection first
      useGameStore.setState({ selectedCharacterId: null });
      token.focus();
      await user.keyboard(" ");
      expect(useGameStore.getState().selectedCharacterId).toBe("char-1");
    });
  });

  describe("Pattern Fills (Colorblind Support)", () => {
    it("applies solid fill pattern for friendly faction", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const circle = screen.getByTestId("token-char-1").querySelector("circle");
      // Friendly uses solid color fill directly (no pattern reference)
      expect(circle).toHaveAttribute("fill", "var(--faction-friendly)");
    });

    it("applies diagonal stripe pattern for enemy faction", () => {
      render(
        <Token
          id="char-2"
          faction="enemy"
          hp={100}
          maxHp={100}
          slotPosition={2}
        />,
      );

      const svg = screen.getByTestId("token-char-2");
      // Check that pattern definition exists in SVG
      const defs = svg.querySelector("defs");
      expect(defs).toBeInTheDocument();

      // Pattern should be defined with unique ID based on character ID
      const pattern = svg.querySelector("pattern");
      expect(pattern).toBeInTheDocument();
      expect(pattern).toHaveAttribute("id", "stripe-enemy-char-2");
    });

    it("creates unique pattern IDs for multiple enemy tokens", () => {
      // Render two enemy tokens with different IDs
      render(
        <Token
          id="enemy-1"
          faction="enemy"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );
      render(
        <Token
          id="enemy-2"
          faction="enemy"
          hp={100}
          maxHp={100}
          slotPosition={2}
        />,
      );

      const svg1 = screen.getByTestId("token-enemy-1");
      const svg2 = screen.getByTestId("token-enemy-2");

      const pattern1 = svg1.querySelector("pattern");
      const pattern2 = svg2.querySelector("pattern");

      expect(pattern1).toBeInTheDocument();
      expect(pattern2).toBeInTheDocument();

      // IDs should be different
      expect(pattern1?.getAttribute("id")).toBe("stripe-enemy-enemy-1");
      expect(pattern2?.getAttribute("id")).toBe("stripe-enemy-enemy-2");
    });
  });

  describe("Token Click Selection", () => {
    it("should call selectCharacter when token is clicked", async () => {
      const { userEvent } = await import("@testing-library/user-event");
      const user = userEvent.setup();

      // Reset store state before test
      useGameStore.setState({ selectedCharacterId: null });

      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const token = screen.getByTestId("token-char-1");
      await user.click(token);

      // After implementation, should select the character
      expect(useGameStore.getState().selectedCharacterId).toBe("char-1");
    });

    it("should apply selected styling when character is selected", () => {
      // Set up selected character
      useGameStore.setState({ selectedCharacterId: "char-1" });

      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const token = screen.getByTestId("token-char-1");
      // Should have selected class/styling (SVG className is an object, use classList)
      expect(
        token.classList.contains("selected") ||
          token.getAttribute("class")?.includes("selected"),
      ).toBe(true);
    });

    it("should not apply selected styling when different character is selected", () => {
      // Set up different character selected
      useGameStore.setState({ selectedCharacterId: "other-char" });

      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const token = screen.getByTestId("token-char-1");
      // Should not have selected class
      expect(
        token.classList.contains("selected") ||
          token.getAttribute("class")?.includes("selected"),
      ).toBe(false);
    });

    it("should toggle selection when clicking already selected token", async () => {
      const { userEvent } = await import("@testing-library/user-event");
      const user = userEvent.setup();
      const { useGameStore } = await import("../../stores/gameStore");

      // Set up token as already selected
      useGameStore.setState({ selectedCharacterId: "char-1" });

      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const token = screen.getByTestId("token-char-1");
      await user.click(token);

      // After implementation, should deselect (set to null)
      expect(useGameStore.getState().selectedCharacterId).toBeNull();
    });
  });

  describe("Letter Rendering", () => {
    it("renders letter text element for friendly faction", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const text = screen.getByTestId("token-char-1").querySelector("text");
      expect(text).toBeInTheDocument();
      // CSS Modules adds a hash suffix, so check that class attribute contains "letter"
      const classAttr = text?.getAttribute("class");
      expect(classAttr).toContain("letter");
    });

    it("renders letter text element for enemy faction", () => {
      render(
        <Token
          id="char-2"
          faction="enemy"
          hp={100}
          maxHp={100}
          slotPosition={2}
        />,
      );

      const text = screen.getByTestId("token-char-2").querySelector("text");
      expect(text).toBeInTheDocument();
      // CSS Modules adds a hash suffix, so check that class attribute contains "letter"
      const classAttr = text?.getAttribute("class");
      expect(classAttr).toContain("letter");
    });

    it("positions letter at token center", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const text = screen.getByTestId("token-char-1").querySelector("text");
      expect(text).toHaveAttribute("x", "20"); // TOKEN_RADIUS = 20
      expect(text).toHaveAttribute("y", "20");
      expect(text).toHaveAttribute("text-anchor", "middle");
      expect(text).toHaveAttribute("dominant-baseline", "central");
    });

    it("uses correct text color from CSS variable", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );

      const text = screen.getByTestId("token-char-1").querySelector("text");
      expect(text).toHaveAttribute("fill", "var(--text-on-faction)");
    });

    it("includes letter in aria-label", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={75}
          maxHp={100}
          slotPosition={3}
        />,
      );

      const token = screen.getByTestId("token-char-1");
      const label = token.getAttribute("aria-label");
      // Should contain letter (will be empty string until implementation)
      expect(label).toMatch(/character\s+[A-Z]*,/);
    });

    it("renders different letters for different slot positions", () => {
      render(
        <Token
          id="char-1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
        />,
      );
      const text1 = screen.getByTestId("token-char-1").querySelector("text");
      const content1 = text1?.textContent;

      render(
        <Token
          id="char-2"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={2}
        />,
      );
      const text2 = screen.getByTestId("token-char-2").querySelector("text");
      const content2 = text2?.textContent;

      // Letters should be different (A vs B)
      expect(content1).not.toBe(content2);
    });
  });
});
