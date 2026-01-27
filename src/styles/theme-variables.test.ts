/**
 * Tests for CSS theme variables.
 * Uses static file analysis to verify required CSS variables are defined.
 * jsdom cannot process CSS custom properties, so we read the file directly.
 */

import { describe, it, expect } from "vitest";
// @ts-expect-error - fs and path are available in vitest Node environment
import { readFileSync } from "fs";
// @ts-expect-error - fs and path are available in vitest Node environment
import { join } from "path";

function getThemeCssContent(): string {
  // @ts-expect-error - __dirname is available in vitest Node environment
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const themeCssPath = join(__dirname, "theme.css");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
  return readFileSync(themeCssPath, "utf-8");
}

describe("Theme Variables", () => {
  describe("--text-on-faction variable", () => {
    it("should be defined in dark theme", () => {
      const themeCssContent = getThemeCssContent();
      // Dark theme is :root { ... }
      // Extract :root block
      const rootBlockMatch = themeCssContent.match(/:root\s*\{([^}]+)\}/s);
      if (!rootBlockMatch) {
        throw new Error("Could not find :root block in theme.css");
      }
      const rootBlock = rootBlockMatch[1];

      // Should contain --text-on-faction variable
      expect(rootBlock).toMatch(/--text-on-faction\s*:/);
    });

    it("should be defined in light theme", () => {
      const themeCssContent = getThemeCssContent();
      // Light theme is :root[data-theme="light"] { ... }
      const lightBlockMatch = themeCssContent.match(
        /:root\[data-theme="light"\]\s*\{([^}]+)\}/s
      );
      if (!lightBlockMatch) {
        throw new Error(
          'Could not find :root[data-theme="light"] block in theme.css'
        );
      }
      const lightBlock = lightBlockMatch[1];

      // Should contain --text-on-faction variable
      expect(lightBlock).toMatch(/--text-on-faction\s*:/);
    });

    it("should be defined in high-contrast theme", () => {
      const themeCssContent = getThemeCssContent();
      // High contrast theme is :root[data-theme="high-contrast"] { ... }
      const highContrastBlockMatch = themeCssContent.match(
        /:root\[data-theme="high-contrast"\]\s*\{([^}]+)\}/s
      );
      if (!highContrastBlockMatch) {
        throw new Error(
          'Could not find :root[data-theme="high-contrast"] block in theme.css'
        );
      }
      const highContrastBlock = highContrastBlockMatch[1];

      // Should contain --text-on-faction variable
      expect(highContrastBlock).toMatch(/--text-on-faction\s*:/);
    });
  });

  describe("--accent-primary variable", () => {
    it("should be defined in dark theme", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlockMatch = themeCssContent.match(/:root\s*\{([^}]+)\}/s);
      if (!rootBlockMatch) {
        throw new Error("Could not find :root block in theme.css");
      }
      const rootBlock = rootBlockMatch[1];

      // Should contain --accent-primary variable
      expect(rootBlock).toMatch(/--accent-primary\s*:/);
    });

    it("should be defined in light theme", () => {
      const themeCssContent = getThemeCssContent();
      const lightBlockMatch = themeCssContent.match(
        /:root\[data-theme="light"\]\s*\{([^}]+)\}/s
      );
      if (!lightBlockMatch) {
        throw new Error(
          'Could not find :root[data-theme="light"] block in theme.css'
        );
      }
      const lightBlock = lightBlockMatch[1];

      // Should contain --accent-primary variable
      expect(lightBlock).toMatch(/--accent-primary\s*:/);
    });

    it("should be defined in high-contrast theme", () => {
      const themeCssContent = getThemeCssContent();
      const highContrastBlockMatch = themeCssContent.match(
        /:root\[data-theme="high-contrast"\]\s*\{([^}]+)\}/s
      );
      if (!highContrastBlockMatch) {
        throw new Error(
          'Could not find :root[data-theme="high-contrast"] block in theme.css'
        );
      }
      const highContrastBlock = highContrastBlockMatch[1];

      // Should contain --accent-primary variable
      expect(highContrastBlock).toMatch(/--accent-primary\s*:/);
    });
  });
});
