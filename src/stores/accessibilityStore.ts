/**
 * Accessibility Store - Theme and accessibility preferences
 * Manages light/dark theme and high-contrast mode with localStorage persistence
 */

import { create } from "zustand";

export type Theme = "light" | "dark" | "high-contrast";

interface AccessibilityState {
  theme: Theme;
  highContrast: boolean;
  showTargetLines: boolean;
  setTheme: (theme: Theme) => void;
  setHighContrast: (enabled: boolean) => void;
  setShowTargetLines: (enabled: boolean) => void;
}

/**
 * Check if localStorage is available (may fail in private browsing, quota exceeded)
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get initial theme with precedence: localStorage > system preference > dark
 */
function getInitialTheme(): Theme {
  // Try localStorage first
  if (isLocalStorageAvailable()) {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "high-contrast") {
      return stored;
    }
  }

  // Check system preference
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }

  // Default to dark
  return "dark";
}

/**
 * Get initial high-contrast preference from localStorage
 */
function getInitialHighContrast(): boolean {
  if (isLocalStorageAvailable()) {
    const stored = localStorage.getItem("high-contrast");
    return stored === "true";
  }
  return false;
}

/**
 * Get initial show target lines preference from localStorage
 */
function getInitialShowTargetLines(): boolean {
  if (isLocalStorageAvailable()) {
    const stored = localStorage.getItem("show-target-lines");
    return stored === "true";
  }
  return false;
}

/**
 * Apply theme to document root
 */
function applyTheme(theme: Theme): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

/**
 * Apply high-contrast mode to document root
 */
function applyHighContrast(enabled: boolean): void {
  if (typeof document !== "undefined") {
    if (enabled) {
      document.documentElement.setAttribute("data-high-contrast", "true");
    } else {
      document.documentElement.removeAttribute("data-high-contrast");
    }
  }
}

/**
 * Persist theme to localStorage if available
 */
function persistTheme(theme: Theme): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }
}

/**
 * Persist high-contrast preference to localStorage if available
 */
function persistHighContrast(enabled: boolean): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem("high-contrast", String(enabled));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }
}

/**
 * Persist show target lines preference to localStorage if available
 */
function persistShowTargetLines(enabled: boolean): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem("show-target-lines", String(enabled));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }
}

/**
 * Create accessibility store with theme and high-contrast management
 */
export const useAccessibilityStore = create<AccessibilityState>((set) => {
  const initialTheme = getInitialTheme();
  const initialHighContrast = getInitialHighContrast();
  const initialShowTargetLines = getInitialShowTargetLines();

  // Apply initial theme and high-contrast on store creation
  applyTheme(initialTheme);
  applyHighContrast(initialHighContrast);

  // Listen for system preference changes (only if no localStorage value)
  if (typeof window !== "undefined") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if no localStorage value exists (user hasn't made explicit choice)
      if (!isLocalStorageAvailable() || !localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        set({ theme: newTheme });
        applyTheme(newTheme);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
  }

  return {
    theme: initialTheme,
    highContrast: initialHighContrast,
    showTargetLines: initialShowTargetLines,

    setTheme: (theme: Theme) => {
      set({ theme });
      applyTheme(theme);
      persistTheme(theme);
    },

    setHighContrast: (enabled: boolean) => {
      set({ highContrast: enabled });
      applyHighContrast(enabled);
      persistHighContrast(enabled);
    },

    setShowTargetLines: (enabled: boolean) => {
      set({ showTargetLines: enabled });
      persistShowTargetLines(enabled);
    },
  };
});
