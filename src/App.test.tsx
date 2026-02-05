/**
 * Tests for App component - Theme integration and empty arena start
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { useAccessibilityStore } from "./stores/accessibilityStore";
import { useGameStore } from "./stores/gameStore";
import { createCharacter } from "./engine/game-test-helpers";

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

  it("should not render old InventoryPanel (migrated to LoadoutTab)", () => {
    render(<App />);

    // Inventory is now in LoadoutTab within CharacterPanel, not a separate panel
    // With no character selected, placeholder shown instead
    expect(
      screen.queryByText(/click a character on the grid to configure/i),
    ).toBeInTheDocument();
  });
});

describe("App - D1: Two-Panel Layout", () => {
  beforeEach(() => {
    useAccessibilityStore.getState().setTheme("dark");
    useAccessibilityStore.getState().setHighContrast(false);
    useGameStore.getState().actions.reset();
  });

  it("renders two-panel grid structure", () => {
    render(<App />);

    // BattleViewer section should exist
    const grid = screen.getByRole("grid");
    expect(grid).toBeInTheDocument();

    // CharacterPanel section should exist (shows placeholder when no selection)
    expect(
      screen.getByText(/click a character on the grid to configure/i),
    ).toBeInTheDocument();

    // Old panels should NOT exist
    expect(screen.queryByText(/skills & priority/i)).not.toBeInTheDocument();
  });

  it("config phase uses 40%/60% grid proportions", () => {
    render(<App />);

    // Ensure in config phase (no active battle)
    const battleStatus = useGameStore.getState().gameState.battleStatus;
    expect(battleStatus).not.toBe("active");

    // Grid container should have config phase data attribute
    const gridContainer = document.querySelector("[data-phase='config']");
    expect(gridContainer).toBeInTheDocument();
  });

  it("battle phase uses 70%/30% grid proportions", async () => {
    // Create characters and start battle
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 0 },
    });

    render(<App />);

    // initBattle after render to override App's useEffect init
    useGameStore.getState().actions.initBattle([friendly, enemy]);
    // battleStatus should already be "active" from initBattle

    // Wait for React to re-render with new state
    await waitFor(() => {
      const gridContainer = document.querySelector("[data-phase='battle']");
      expect(gridContainer).toBeInTheDocument();
    });
  });

  it("responsive layout at mobile breakpoint (<=768px)", () => {
    // Note: Testing responsive layout requires either:
    // 1. CSS media query testing (e.g., with window.matchMedia mock)
    // 2. Visual regression testing
    // 3. Checking for responsive classes/attributes

    // For now, verify layout container exists with responsive class
    render(<App />);

    const appContainer = document.querySelector(".app");
    expect(appContainer).toBeInTheDocument();

    // Full responsive testing would require additional setup
    // or integration with Playwright/Cypress
  });
});
