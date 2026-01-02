/**
 * Tests for App component - Theme integration
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { useAccessibilityStore } from "./stores/accessibilityStore";

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
