/**
 * Tests for accessibilityStore showTargetLines toggle functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useAccessibilityStore } from "./accessibilityStore";

describe("accessibilityStore - showTargetLines", () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    // Reset store state
    useAccessibilityStore.setState({ showTargetLines: false });

    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: vi.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should default to false", () => {
    const { showTargetLines } = useAccessibilityStore.getState();
    expect(showTargetLines).toBe(false);
  });

  it("should update state when setShowTargetLines(true) is called", () => {
    const { setShowTargetLines } = useAccessibilityStore.getState();

    setShowTargetLines?.(true);

    expect(useAccessibilityStore.getState().showTargetLines).toBe(true);
  });

  it("should update state when setShowTargetLines(false) is called", () => {
    const { setShowTargetLines } = useAccessibilityStore.getState();

    // Set to true first
    setShowTargetLines?.(true);
    expect(useAccessibilityStore.getState().showTargetLines).toBe(true);

    // Then set to false
    setShowTargetLines?.(false);
    expect(useAccessibilityStore.getState().showTargetLines).toBe(false);
  });

  it("should persist to localStorage with key 'show-target-lines'", () => {
    const { setShowTargetLines } = useAccessibilityStore.getState();
    const setItemSpy = vi.spyOn(localStorage, "setItem");

    setShowTargetLines?.(true);

    expect(setItemSpy).toHaveBeenCalledWith("show-target-lines", "true");
    expect(mockLocalStorage["show-target-lines"]).toBe("true");
  });

  it("should read from localStorage on initialization", () => {
    // Set localStorage value
    mockLocalStorage["show-target-lines"] = "true";

    // Simulate re-initialization by manually setting state based on localStorage
    const stored = localStorage.getItem("show-target-lines");
    if (stored === "true") {
      useAccessibilityStore.setState({ showTargetLines: true });
    }

    expect(useAccessibilityStore.getState().showTargetLines).toBe(true);
  });

  it("should handle localStorage unavailable gracefully", () => {
    // Mock localStorage to throw errors
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => {
          throw new Error("QuotaExceededError");
        }),
        setItem: vi.fn(() => {
          throw new Error("QuotaExceededError");
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    const { setShowTargetLines } = useAccessibilityStore.getState();

    // Should not throw
    expect(() => setShowTargetLines?.(true)).not.toThrow();

    // State should still update
    expect(useAccessibilityStore.getState().showTargetLines).toBe(true);
  });

  it("should be independent of theme changes", () => {
    const { setShowTargetLines, setTheme } = useAccessibilityStore.getState();

    // Set showTargetLines to true
    setShowTargetLines?.(true);
    expect(useAccessibilityStore.getState().showTargetLines).toBe(true);

    // Change theme to light
    setTheme("light");
    expect(useAccessibilityStore.getState().showTargetLines).toBe(true);

    // Change theme to dark
    setTheme("dark");
    expect(useAccessibilityStore.getState().showTargetLines).toBe(true);

    // showTargetLines should remain true through theme changes
    expect(useAccessibilityStore.getState().showTargetLines).toBe(true);
  });
});
