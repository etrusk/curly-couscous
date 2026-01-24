/**
 * Tests for App component - Theme integration and empty arena start
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { useAccessibilityStore } from "./stores/accessibilityStore";
import { useGameStore } from "./stores/gameStore";

describe("App - Theme Integration", () => {
  beforeEach(() => {
    // Reset document state
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-high-contrast");
    // Reset store using the action (which also applies to DOM)
    useAccessibilityStore.getState().setTheme("dark");
    useAccessibilityStore.getState().setHighContrast(false);
  });

  it("should render ThemeToggle in header area", () => {
    render(<App />);

    // Verify ThemeToggle is present by checking for its button
    const themeToggle = screen.getByRole("button", {
      name: /mode.*switch to/i,
    });

    expect(themeToggle).toBeInTheDocument();
  });

  it("should apply data-theme attribute to document root on mount", () => {
    // Set theme before rendering using the action (applies to DOM)
    useAccessibilityStore.getState().setTheme("light");

    render(<App />);

    // Verify document root has the theme attribute
    // Note: The accessibilityStore applies this via setTheme action
    const dataTheme = document.documentElement.getAttribute("data-theme");

    expect(dataTheme).toBe("light");
  });
});

describe("App - Empty Arena Start", () => {
  beforeEach(() => {
    // Reset document state
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-high-contrast");
    // Reset stores
    useAccessibilityStore.getState().setTheme("dark");
    useAccessibilityStore.getState().setHighContrast(false);
    useGameStore.getState().actions.reset();
  });

  it("should start with empty arena (no characters)", () => {
    render(<App />);

    const characters = useGameStore.getState().gameState.characters;
    expect(characters.length).toBe(0);
  });

  it("should show draw status with empty arena", () => {
    render(<App />);

    // Empty battle is a draw per existing logic
    const battleStatus = useGameStore.getState().gameState.battleStatus;
    expect(battleStatus).toBe("draw");
  });

  it("should render CharacterControls component", () => {
    render(<App />);

    // Verify CharacterControls buttons are present
    const addFriendlyButton = screen.queryByRole("button", {
      name: /add friendly/i,
    });
    const addEnemyButton = screen.queryByRole("button", { name: /add enemy/i });
    const removeButton = screen.queryByRole("button", { name: /remove/i });

    expect(addFriendlyButton).toBeInTheDocument();
    expect(addEnemyButton).toBeInTheDocument();
    expect(removeButton).toBeInTheDocument();
  });
});
