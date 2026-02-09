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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, security/detect-non-literal-fs-filename
  return readFileSync(themeCssPath, "utf-8");
}

function getIndexCssContent(): string {
  // @ts-expect-error - __dirname is available in vitest Node environment
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const indexCssPath = join(__dirname, "..", "index.css");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, security/detect-non-literal-fs-filename
  return readFileSync(indexCssPath, "utf-8");
}

function extractRootBlock(cssContent: string): string {
  const rootBlockMatch = cssContent.match(/:root\s*\{([^}]+)\}/s);
  if (!rootBlockMatch) {
    throw new Error("Could not find :root block in theme.css");
  }

  return rootBlockMatch[1]!;
}

function extractLightBlock(cssContent: string): string {
  const lightBlockMatch = cssContent.match(
    /:root\[data-theme="light"\]\s*\{([^}]+)\}/s,
  );
  if (!lightBlockMatch) {
    throw new Error(
      'Could not find :root[data-theme="light"] block in theme.css',
    );
  }

  return lightBlockMatch[1]!;
}

function extractHighContrastBlock(cssContent: string): string {
  const highContrastBlockMatch = cssContent.match(
    /:root\[data-theme="high-contrast"\]\s*\{([^}]+)\}/s,
  );
  if (!highContrastBlockMatch) {
    throw new Error(
      'Could not find :root[data-theme="high-contrast"] block in theme.css',
    );
  }

  return highContrastBlockMatch[1]!;
}

describe("Theme Variables", () => {
  describe("--text-on-faction variable", () => {
    it("should be defined in dark theme", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlock = extractRootBlock(themeCssContent);

      // Should contain --text-on-faction variable
      expect(rootBlock).toMatch(/--text-on-faction\s*:/);
    });

    it("should be defined in high-contrast theme", () => {
      const themeCssContent = getThemeCssContent();
      const highContrastBlock = extractHighContrastBlock(themeCssContent);

      // Should contain --text-on-faction variable
      expect(highContrastBlock).toMatch(/--text-on-faction\s*:/);
    });
  });

  describe("--accent-primary variable", () => {
    it("should be defined in dark theme", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlock = extractRootBlock(themeCssContent);

      // Should contain --accent-primary variable
      expect(rootBlock).toMatch(/--accent-primary\s*:/);
    });

    it("should be defined in high-contrast theme", () => {
      const themeCssContent = getThemeCssContent();
      const highContrastBlock = extractHighContrastBlock(themeCssContent);

      // Should contain --accent-primary variable
      expect(highContrastBlock).toMatch(/--accent-primary\s*:/);
    });
  });

  describe("color-scheme declarations", () => {
    it("root block has color-scheme dark", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlock = extractRootBlock(themeCssContent);

      expect(rootBlock).toMatch(/color-scheme\s*:\s*dark\s*;/);
    });

    it("light theme block sets color-scheme light", () => {
      const themeCssContent = getThemeCssContent();
      const lightBlock = extractLightBlock(themeCssContent);

      expect(lightBlock).toMatch(/color-scheme\s*:\s*light\s*;/);
    });

    it("high-contrast block has color-scheme dark", () => {
      const themeCssContent = getThemeCssContent();
      const highContrastBlock = extractHighContrastBlock(themeCssContent);

      expect(highContrastBlock).toMatch(/color-scheme\s*:\s*dark\s*;/);
    });
  });

  describe("light theme block minimality", () => {
    it("light theme block contains no custom property declarations", () => {
      const themeCssContent = getThemeCssContent();
      const lightBlock = extractLightBlock(themeCssContent);

      // Should NOT contain any --variable declarations
      expect(lightBlock).not.toMatch(/--[\w-]+\s*:/);
      // Should still contain color-scheme (block is not empty)
      expect(lightBlock).toMatch(/color-scheme/);
    });
  });

  describe("light-dark() usage in :root block", () => {
    it("uses light-dark() for variables that differ between dark and light", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlock = extractRootBlock(themeCssContent);

      expect(rootBlock).toMatch(/--surface-ground\s*:\s*light-dark\(/);
      expect(rootBlock).toMatch(/--content-primary\s*:\s*light-dark\(/);
      expect(rootBlock).toMatch(/--accent-primary\s*:\s*light-dark\(/);
      expect(rootBlock).toMatch(/--grid-bg\s*:\s*light-dark\(/);
      expect(rootBlock).toMatch(/--ground\s*:\s*light-dark\(/);
    });

    it("keeps simple values for variables identical across themes", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlock = extractRootBlock(themeCssContent);

      // Extract individual variable values and verify they don't use light-dark()
      // --faction-friendly is #0072b2 in both themes
      expect(rootBlock).toMatch(/--faction-friendly\s*:/);
      expect(rootBlock).not.toMatch(/--faction-friendly\s*:\s*light-dark\(/);

      // --action-attack is #d55e00 in both themes
      expect(rootBlock).toMatch(/--action-attack\s*:/);
      expect(rootBlock).not.toMatch(/--action-attack\s*:\s*light-dark\(/);

      // --text-on-faction is #ffffff in both themes
      expect(rootBlock).toMatch(/--text-on-faction\s*:/);
      expect(rootBlock).not.toMatch(/--text-on-faction\s*:\s*light-dark\(/);

      // --radius-sm is a design token, identical across themes
      expect(rootBlock).toMatch(/--radius-sm\s*:/);
      expect(rootBlock).not.toMatch(/--radius-sm\s*:\s*light-dark\(/);
    });

    it("accent-primary uses light-dark() in root", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlock = extractRootBlock(themeCssContent);

      expect(rootBlock).toMatch(/--accent-primary\s*:\s*light-dark\(/);
    });

    it("light-dark() argument order is light first", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlock = extractRootBlock(themeCssContent);

      // --surface-ground: light-dark(#fafafa, #242424)
      // Light value (#fafafa) must come first, dark value (#242424) second
      expect(rootBlock).toMatch(
        /--surface-ground\s*:\s*light-dark\(\s*#fafafa\s*,\s*#242424\s*\)/,
      );
    });
  });

  describe("color-mix() for derived tokens", () => {
    it("faction bg tokens use color-mix() with var() references", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlock = extractRootBlock(themeCssContent);

      // --faction-friendly-bg uses color-mix() referencing var(--faction-friendly)
      expect(rootBlock).toMatch(/--faction-friendly-bg\s*:[^;]*color-mix\(/);
      expect(rootBlock).toMatch(
        /--faction-friendly-bg\s*:[^;]*var\(--faction-friendly\)/,
      );

      // --faction-enemy-bg uses color-mix() referencing var(--faction-enemy)
      expect(rootBlock).toMatch(/--faction-enemy-bg\s*:[^;]*color-mix\(/);
      expect(rootBlock).toMatch(
        /--faction-enemy-bg\s*:[^;]*var\(--faction-enemy\)/,
      );
    });

    it("faction bg color-mix() is nested in light-dark()", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlock = extractRootBlock(themeCssContent);

      // --faction-friendly-bg should have both light-dark() and color-mix()
      expect(rootBlock).toMatch(
        /--faction-friendly-bg\s*:[^;]*light-dark\([^;]*color-mix\(/,
      );
      // Light-theme opaque hex value #e6f2ff should come before color-mix()
      expect(rootBlock).toMatch(
        /--faction-friendly-bg\s*:[^;]*light-dark\(\s*#e6f2ff\s*,\s*color-mix\(/,
      );
    });

    it("status bg tokens use color-mix() with var() references", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlock = extractRootBlock(themeCssContent);

      expect(rootBlock).toMatch(/--status-success-bg\s*:[^;]*color-mix\(/);
      expect(rootBlock).toMatch(
        /--status-success-bg\s*:[^;]*var\(--status-success\)/,
      );

      expect(rootBlock).toMatch(/--status-error-bg\s*:[^;]*color-mix\(/);
      expect(rootBlock).toMatch(
        /--status-error-bg\s*:[^;]*var\(--status-error\)/,
      );

      expect(rootBlock).toMatch(/--status-warning-bg\s*:[^;]*color-mix\(/);
      expect(rootBlock).toMatch(
        /--status-warning-bg\s*:[^;]*var\(--status-warning\)/,
      );

      expect(rootBlock).toMatch(/--status-neutral-bg\s*:[^;]*color-mix\(/);
      expect(rootBlock).toMatch(
        /--status-neutral-bg\s*:[^;]*var\(--status-neutral\)/,
      );
    });

    it("accent and danger subtle tokens use color-mix() with var() references", () => {
      const themeCssContent = getThemeCssContent();
      const rootBlock = extractRootBlock(themeCssContent);

      expect(rootBlock).toMatch(/--accent-subtle\s*:[^;]*color-mix\(/);
      expect(rootBlock).toMatch(/--accent-subtle\s*:[^;]*var\(--accent\)/);

      expect(rootBlock).toMatch(/--accent-muted\s*:[^;]*color-mix\(/);
      expect(rootBlock).toMatch(/--accent-muted\s*:[^;]*var\(--accent\)/);

      expect(rootBlock).toMatch(/--danger-subtle\s*:[^;]*color-mix\(/);
      expect(rootBlock).toMatch(/--danger-subtle\s*:[^;]*var\(--danger\)/);
    });

    it("high-contrast block uses color-mix() for bg tokens", () => {
      const themeCssContent = getThemeCssContent();
      const highContrastBlock = extractHighContrastBlock(themeCssContent);

      expect(highContrastBlock).toMatch(
        /--faction-friendly-bg\s*:[^;]*color-mix\(/,
      );
      expect(highContrastBlock).toMatch(
        /--faction-friendly-bg\s*:[^;]*var\(--faction-friendly\)/,
      );

      expect(highContrastBlock).toMatch(
        /--status-success-bg\s*:[^;]*color-mix\(/,
      );
      expect(highContrastBlock).toMatch(
        /--status-success-bg\s*:[^;]*var\(--status-success\)/,
      );
    });
  });

  describe("architectural boundaries", () => {
    it("high-contrast block does not use light-dark()", () => {
      const themeCssContent = getThemeCssContent();
      const highContrastBlock = extractHighContrastBlock(themeCssContent);

      expect(highContrastBlock).not.toMatch(/light-dark\(/);
    });

    it("index.css has no color-scheme declaration", () => {
      const indexCssContent = getIndexCssContent();

      expect(indexCssContent).not.toMatch(/color-scheme\s*:/);
    });
  });
});
