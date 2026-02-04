/**
 * Interaction tests for Token component.
 * Following TDD workflow - these tests are written before implementation.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Token } from "./Token";
import { useGameStore } from "../../stores/gameStore";

describe("Token - SVG Rendering", () => {
  it("renders as SVG group (not standalone SVG)", () => {
    render(
      <svg>
        <Token
          id="c1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
          cx={0}
          cy={0}
        />
      </svg>,
    );

    const token = screen.getByTestId("token-c1");
    expect(token.tagName.toLowerCase()).toBe("g");
    expect(token.hasAttribute("viewBox")).toBe(false);
  });

  it("has transform attribute for positioning", () => {
    render(
      <svg>
        <Token
          id="c1"
          faction="friendly"
          hp={100}
          maxHp={100}
          slotPosition={1}
          cx={45}
          cy={25.98}
        />
      </svg>,
    );

    const token = screen.getByTestId("token-c1");
    const transform = token.getAttribute("transform");

    expect(transform).toBeTruthy();
    expect(transform).toContain("translate(");

    // Token should be positioned at cx - TOKEN_RADIUS, cy - TOKEN_RADIUS
    // TOKEN_RADIUS = 20 (half of TOKEN_SIZE = 40)
    // So expected translate is (45 - 20, 25.98 - 20) = (25, 5.98)
    expect(transform).toContain("25");
    expect(transform).toContain("5.98");
  });

  it("preserves role, aria-label, and tabIndex", () => {
    render(
      <svg>
        <Token
          id="c1"
          faction="friendly"
          hp={75}
          maxHp={100}
          slotPosition={1}
          cx={0}
          cy={0}
        />
      </svg>,
    );

    const token = screen.getByTestId("token-c1");
    expect(token).toHaveAttribute("role", "img");
    expect(token).toHaveAttribute("tabindex", "0");

    const label = token.getAttribute("aria-label");
    expect(label).toContain("Friendly");
    expect(label).toContain("75");
    expect(label).toContain("100");
  });
});

describe("Token Interaction", () => {
  describe("Accessibility", () => {
    it("has aria-label describing friendly character", () => {
      render(
        <svg>
          <Token
            id="char-1"
            faction="friendly"
            hp={75}
            maxHp={100}
            slotPosition={1}
            cx={0}
            cy={0}
          />
        </svg>,
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
        <svg>
          <Token
            id="char-2"
            faction="enemy"
            hp={50}
            maxHp={100}
            slotPosition={2}
            cx={0}
            cy={0}
          />
        </svg>,
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
        <svg>
          <Token
            id="char-1"
            faction="friendly"
            hp={100}
            maxHp={100}
            slotPosition={1}
            cx={0}
            cy={0}
          />
        </svg>,
      );

      const token = screen.getByTestId("token-char-1");
      expect(token).toHaveAttribute("role", "img");
    });

    it("is focusable with keyboard navigation", () => {
      render(
        <svg>
          <Token
            id="char-1"
            faction="friendly"
            hp={100}
            maxHp={100}
            slotPosition={1}
            cx={0}
            cy={0}
          />
        </svg>,
      );
      const token = screen.getByTestId("token-char-1");
      expect(token).toHaveAttribute("tabindex", "0");
    });

    it("responds to keyboard Enter and Space for selection", async () => {
      const { userEvent } = await import("@testing-library/user-event");
      const user = userEvent.setup();
      const { useGameStore } = await import("../../stores/gameStore");

      render(
        <svg>
          <Token
            id="char-1"
            faction="friendly"
            hp={100}
            maxHp={100}
            slotPosition={1}
            cx={0}
            cy={0}
          />
        </svg>,
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

  describe("Token Click Selection", () => {
    it("should call selectCharacter when token is clicked", async () => {
      const { userEvent } = await import("@testing-library/user-event");
      const user = userEvent.setup();

      // Reset store state before test
      useGameStore.setState({ selectedCharacterId: null });

      render(
        <svg>
          <Token
            id="char-1"
            faction="friendly"
            hp={100}
            maxHp={100}
            slotPosition={1}
            cx={0}
            cy={0}
          />
        </svg>,
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
        <svg>
          <Token
            id="char-1"
            faction="friendly"
            hp={100}
            maxHp={100}
            slotPosition={1}
            cx={0}
            cy={0}
          />
        </svg>,
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
        <svg>
          <Token
            id="char-1"
            faction="friendly"
            hp={100}
            maxHp={100}
            slotPosition={1}
            cx={0}
            cy={0}
          />
        </svg>,
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
        <svg>
          <Token
            id="char-1"
            faction="friendly"
            hp={100}
            maxHp={100}
            slotPosition={1}
            cx={0}
            cy={0}
          />
        </svg>,
      );

      const token = screen.getByTestId("token-char-1");
      await user.click(token);

      // After implementation, should deselect (set to null)
      expect(useGameStore.getState().selectedCharacterId).toBeNull();
    });
  });
});
