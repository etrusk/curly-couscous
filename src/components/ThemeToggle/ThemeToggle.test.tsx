/**
 * Tests for ThemeToggle component
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle";
import { useAccessibilityStore } from "../../stores/accessibilityStore";

describe("ThemeToggle", () => {
  beforeEach(() => {
    // Reset store to dark theme
    useAccessibilityStore.setState({ theme: "dark", highContrast: false });
  });

  it("should render with current theme indicator", () => {
    const { rerender } = render(<ThemeToggle />);

    // Should show "Dark" label when theme is dark
    expect(screen.getByText("Dark")).toBeInTheDocument();

    // Change to light theme and rerender
    useAccessibilityStore.setState({ theme: "light" });
    rerender(<ThemeToggle />);

    // Should show "Light" label when theme is light
    expect(screen.getByText("Light")).toBeInTheDocument();
  });

  it("should toggle between dark and light when clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    // Initial state: dark
    expect(useAccessibilityStore.getState().theme).toBe("dark");

    // Click to switch to light
    const button = screen.getByRole("button");
    await user.click(button);

    expect(useAccessibilityStore.getState().theme).toBe("light");

    // Click again to switch back to dark
    await user.click(button);

    expect(useAccessibilityStore.getState().theme).toBe("dark");
  });

  it("should update store theme when clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button");

    // Verify initial state
    expect(useAccessibilityStore.getState().theme).toBe("dark");

    // Click to toggle
    await user.click(button);

    // Verify store was updated
    expect(useAccessibilityStore.getState().theme).toBe("light");
  });

  it("should have accessible label indicating current theme and action", () => {
    const { rerender } = render(<ThemeToggle />);

    // When dark, should indicate switching to light
    const buttonDark = screen.getByRole("button", {
      name: /Dark mode.*switch to light mode/i,
    });
    expect(buttonDark).toBeInTheDocument();

    // Change to light theme and rerender
    useAccessibilityStore.setState({ theme: "light" });
    rerender(<ThemeToggle />);

    // When light, should indicate switching to dark
    const buttonLight = screen.getByRole("button", {
      name: /Light mode.*switch to dark mode/i,
    });
    expect(buttonLight).toBeInTheDocument();
  });

  it("should be keyboard accessible via Enter and Space", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button");

    // Focus the button
    button.focus();
    expect(button).toHaveFocus();

    // Press Enter to toggle
    await user.keyboard("{Enter}");
    expect(useAccessibilityStore.getState().theme).toBe("light");

    // Press Space to toggle back
    await user.keyboard(" ");
    expect(useAccessibilityStore.getState().theme).toBe("dark");
  });

  it("should display visible focus indicator when focused", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button");

    // Focus the button
    await user.tab();

    // Verify button is focused
    expect(button).toHaveFocus();

    // Note: Visual focus indicator is tested via CSS :focus-visible
    // We verify the button can receive focus, actual styling verified in browser
  });

  it("should render sun icon for dark theme (indicating switch target)", () => {
    useAccessibilityStore.setState({ theme: "dark" });
    render(<ThemeToggle />);

    // Sun emoji indicates "switch to light"
    expect(screen.getByText("☀️")).toBeInTheDocument();
  });

  it("should render moon icon for light theme (indicating switch target)", () => {
    useAccessibilityStore.setState({ theme: "light" });
    render(<ThemeToggle />);

    // Moon emoji indicates "switch to dark"
    expect(screen.getByText("🌙")).toBeInTheDocument();
  });
});
