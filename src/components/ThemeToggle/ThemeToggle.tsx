/**
 * ThemeToggle - Toggle between light and dark themes
 * Simple 2-way toggle (dark ↔ light)
 * High-contrast is a separate accessibility control
 */

import { useAccessibilityStore } from "../../stores/accessibilityStore";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const theme = useAccessibilityStore((state) => state.theme);
  const setTheme = useAccessibilityStore((state) => state.setTheme);

  const isDark = theme === "dark" || theme === "high-contrast";
  const currentThemeLabel = isDark ? "Dark" : "Light";
  const targetThemeLabel = isDark ? "light" : "dark";

  const handleToggle = () => {
    // Toggle between dark and light (high-contrast is separate)
    setTheme(isDark ? "light" : "dark");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <button
      className={styles.toggle}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      aria-label={`${currentThemeLabel} mode. Click to switch to ${targetThemeLabel} mode.`}
      type="button"
    >
      <span className={styles.icon} aria-hidden="true">
        {isDark ? "☀️" : "🌙"}
      </span>
      <span className={styles.label}>{currentThemeLabel}</span>
    </button>
  );
}
