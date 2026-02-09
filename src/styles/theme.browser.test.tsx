/**
 * Browser-mode tests for theme CSS variable resolution.
 * These tests run in a real Chromium browser via Vitest Browser Mode + Playwright.
 * They validate behaviors that jsdom cannot test: light-dark() function resolution,
 * color-mix() computed values, and CSS custom property cascade into child elements.
 *
 * Existing jsdom tests cover:
 * - theme-variables.test.ts: static CSS source analysis (structural/architectural)
 * - theme.integration.test.tsx: DOM attribute mechanism (data-theme set/remove)
 *
 * These browser tests validate what the CSS actually produces at runtime.
 *
 * Note: getComputedStyle(el).getPropertyValue('--custom-prop') returns the raw
 * declaration text (e.g. "light-dark(#fafafa, #242424)"), not the resolved value.
 * CSS custom properties are only resolved when substituted into standard properties.
 * Therefore, all tests use a probe element with background-color: var(--prop) to
 * read the resolved color via getComputedStyle(probe).backgroundColor.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "./theme.css"; // Explicit import so Vite processes it

/**
 * Sets or removes the data-theme attribute on the document root element.
 * - setTheme("dark") sets data-theme="dark"
 * - setTheme("light") sets data-theme="light"
 * - setTheme("high-contrast") sets data-theme="high-contrast"
 * - setTheme(null) removes data-theme (reverts to default dark)
 */
function setTheme(theme: string | null): void {
  if (theme === null) {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

/**
 * Resolves a CSS custom property to its computed color value by using a probe element.
 * Creates a temporary div, sets its background-color to var(--name), appends it to
 * the document, reads getComputedStyle(div).backgroundColor, then removes the div.
 *
 * This approach is necessary because getPropertyValue('--custom-prop') returns raw
 * declaration text (including unresolved light-dark() and color-mix() functions),
 * while standard properties trigger full CSS resolution.
 */
function resolveColorVar(name: string): string {
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(${name})`;
  document.documentElement.appendChild(probe);
  const resolved = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return resolved;
}

/**
 * Parses a color string into numeric components (r, g, b as 0-255, a as 0-1).
 * Handles formats:
 * - rgb(r, g, b), rgba(r, g, b, a) -- components in 0-255 range
 * - color(srgb r g b / a) -- components in 0-1 range (newer Chromium format)
 * Returns { r, g, b, a } where r/g/b are 0-255 and a defaults to 1.
 */
function parseColor(colorString: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  const trimmed = colorString.trim();

  // Handle rgba() / rgb() format by extracting content between parens
  if (trimmed.startsWith("rgb")) {
    const inner = trimmed.slice(
      trimmed.indexOf("(") + 1,
      trimmed.lastIndexOf(")"),
    );
    const parts = inner.split(",").map((s) => s.trim());
    if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
      return {
        r: parseFloat(parts[0]),
        g: parseFloat(parts[1]),
        b: parseFloat(parts[2]),
        a: parts[3] !== undefined ? parseFloat(parts[3]) : 1,
      };
    }
  }

  // Handle color(srgb r g b / a) format: values are 0-1, convert to 0-255
  if (trimmed.startsWith("color(srgb")) {
    const inner = trimmed.slice(
      trimmed.indexOf("srgb") + 4,
      trimmed.lastIndexOf(")"),
    );
    const [colorPart, alphaPart] = inner.split("/");
    if (colorPart) {
      const parts = colorPart.trim().split(/\s+/);
      if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
        return {
          r: Math.round(parseFloat(parts[0]) * 255),
          g: Math.round(parseFloat(parts[1]) * 255),
          b: Math.round(parseFloat(parts[2]) * 255),
          a: alphaPart !== undefined ? parseFloat(alphaPart.trim()) : 1,
        };
      }
    }
  }

  throw new Error(`Could not parse color string: ${colorString}`);
}

describe("Theme CSS Variable Resolution (Browser)", () => {
  beforeEach(() => {
    // Restore default dark theme state
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-high-contrast");
  });

  // Test 1: dark-theme-resolves-surface-ground-to-dark-value
  it("dark theme resolves surface-ground to dark value", () => {
    const value = resolveColorVar("--surface-ground");

    // CSS loaded successfully (smoke test for entire file)
    expect(value).not.toBe("");
    // Browser resolved the light-dark() function to an actual color
    expect(value).toMatch(/^rgb/);
    // The dark branch of light-dark(#fafafa, #242424) = rgb(36, 36, 36)
    expect(value).toBe("rgb(36, 36, 36)");
  });

  // Test 2: light-theme-resolves-surface-ground-to-light-value
  it("light theme resolves surface-ground to light value", () => {
    setTheme("light");

    const value = resolveColorVar("--surface-ground");

    // Resolved, not raw function string
    expect(value).toMatch(/^rgb/);
    // The light branch of light-dark(#fafafa, #242424) = rgb(250, 250, 250)
    expect(value).toBe("rgb(250, 250, 250)");
  });

  // Test 3: high-contrast-theme-resolves-surface-ground-to-pure-black
  it("high-contrast theme resolves surface-ground to pure black", () => {
    setTheme("high-contrast");

    const value = resolveColorVar("--surface-ground");

    // Resolved to actual color
    expect(value).toMatch(/^rgb/);
    // Explicit override --surface-ground: #000000 = rgb(0, 0, 0)
    expect(value).toBe("rgb(0, 0, 0)");
  });

  // Test 4: light-dark-resolves-differently-for-dark-vs-light-themes
  it("light-dark() resolves differently for dark vs light themes", () => {
    // Read computed values in default (dark) state
    const darkContentPrimary = resolveColorVar("--content-primary");
    const darkGridBg = resolveColorVar("--grid-bg");
    const darkCellBg = resolveColorVar("--cell-bg");

    // Switch to light theme
    setTheme("light");

    // Read the same variables again
    const lightContentPrimary = resolveColorVar("--content-primary");
    const lightGridBg = resolveColorVar("--grid-bg");
    const lightCellBg = resolveColorVar("--cell-bg");

    // All six values resolved successfully
    expect(darkContentPrimary).toMatch(/^rgb/);
    expect(darkGridBg).toMatch(/^rgb/);
    expect(darkCellBg).toMatch(/^rgb/);
    expect(lightContentPrimary).toMatch(/^rgb/);
    expect(lightGridBg).toMatch(/^rgb/);
    expect(lightCellBg).toMatch(/^rgb/);

    // Values differ between dark and light themes
    expect(darkContentPrimary).not.toBe(lightContentPrimary);
    expect(darkGridBg).not.toBe(lightGridBg);
    expect(darkCellBg).not.toBe(lightCellBg);
  });

  // Test 5: color-mix-produces-resolved-color-for-faction-friendly-bg
  it("color-mix() produces resolved color for faction-friendly-bg", () => {
    const value = resolveColorVar("--faction-friendly-bg");

    // Browser resolved the function (not raw color-mix string)
    expect(value).not.toBe("");
    expect(value).not.toContain("color-mix");

    // The mix with transparent produces a semi-transparent result.
    // Browser may return rgba() or color(srgb ... / alpha) format.
    const hasAlpha = value.includes("rgba") || value.includes("/");
    expect(hasAlpha).toBe(true);

    // Parse and validate components with tolerance
    const parsed = parseColor(value);

    // Alpha should be approximately 0.15 (within tolerance of 0.05)
    expect(parsed.a).toBeGreaterThanOrEqual(0.1);
    expect(parsed.a).toBeLessThanOrEqual(0.2);

    // RGB channels of the non-transparent color are preserved (not scaled)
    // #0072b2 = rgb(0, 114, 178), tolerance +/- 5
    expect(parsed.r).toBeGreaterThanOrEqual(0);
    expect(parsed.r).toBeLessThanOrEqual(5);
    expect(parsed.g).toBeGreaterThanOrEqual(109);
    expect(parsed.g).toBeLessThanOrEqual(119);
    expect(parsed.b).toBeGreaterThanOrEqual(173);
    expect(parsed.b).toBeLessThanOrEqual(183);
  });

  // Test 6: high-contrast-faction-colors-differ-from-dark-theme
  it("high-contrast faction colors differ from dark theme", () => {
    // Read in default dark state
    const darkFriendly = resolveColorVar("--faction-friendly");
    const darkAttack = resolveColorVar("--action-attack");

    // Switch to high-contrast
    setTheme("high-contrast");

    const hcFriendly = resolveColorVar("--faction-friendly");
    const hcAttack = resolveColorVar("--action-attack");

    // Dark theme values
    expect(darkFriendly).toBe("rgb(0, 114, 178)");
    expect(darkAttack).toBe("rgb(213, 94, 0)");

    // High-contrast theme values (brighter)
    expect(hcFriendly).toBe("rgb(0, 153, 255)");
    expect(hcAttack).toBe("rgb(255, 102, 51)");

    // Values differ between themes
    expect(darkFriendly).not.toBe(hcFriendly);
    expect(darkAttack).not.toBe(hcAttack);
  });

  // Test 7: css-variables-cascade-into-rendered-element-backgrounds
  it("CSS variables cascade into rendered element backgrounds", () => {
    render(
      <div
        data-testid="cascade-test"
        style={{ backgroundColor: "var(--surface-ground)" }}
      />,
    );

    const div = screen.getByTestId("cascade-test");
    const bgColor = getComputedStyle(div).backgroundColor;

    // CSS processed and cascaded (not empty)
    expect(bgColor).not.toBe("");
    // Variable was resolved, not passed through raw
    expect(bgColor).not.toContain("var(");
    // It is a resolved color value
    expect(bgColor).toMatch(/^rgb/);
    // Matches --surface-ground dark value
    expect(bgColor).toBe("rgb(36, 36, 36)");
  });

  // Test 8 (Phase 4): WhiffOverlay-color-mix-inline-fill-resolves-to-semi-transparent-color
  it("WhiffOverlay color-mix() inline fill resolves to semi-transparent color", () => {
    // Test attack color-mix expression
    const attackProbe = document.createElement("div");
    attackProbe.style.backgroundColor =
      "color-mix(in srgb, var(--action-attack) 20%, transparent)";
    document.documentElement.appendChild(attackProbe);
    const attackResolved = getComputedStyle(attackProbe).backgroundColor;
    attackProbe.remove();

    // Browser resolved the color-mix function
    expect(attackResolved).not.toContain("color-mix");
    expect(attackResolved).not.toContain("var(");

    // Parse and validate attack color components
    const attackParsed = parseColor(attackResolved);
    // Alpha should be approximately 0.2 (tolerance +/- 0.05)
    expect(attackParsed.a).toBeGreaterThanOrEqual(0.15);
    expect(attackParsed.a).toBeLessThanOrEqual(0.25);
    // RGB channels approximate #d55e00 (213, 94, 0), tolerance +/- 5
    expect(attackParsed.r).toBeGreaterThanOrEqual(208);
    expect(attackParsed.r).toBeLessThanOrEqual(218);
    expect(attackParsed.g).toBeGreaterThanOrEqual(89);
    expect(attackParsed.g).toBeLessThanOrEqual(99);
    expect(attackParsed.b).toBeGreaterThanOrEqual(0);
    expect(attackParsed.b).toBeLessThanOrEqual(5);

    // Test heal color-mix expression
    const healProbe = document.createElement("div");
    healProbe.style.backgroundColor =
      "color-mix(in srgb, var(--action-heal) 20%, transparent)";
    document.documentElement.appendChild(healProbe);
    const healResolved = getComputedStyle(healProbe).backgroundColor;
    healProbe.remove();

    // Parse and validate heal color components
    const healParsed = parseColor(healResolved);
    // Alpha should be approximately 0.2 (tolerance +/- 0.05)
    expect(healParsed.a).toBeGreaterThanOrEqual(0.15);
    expect(healParsed.a).toBeLessThanOrEqual(0.25);
    // RGB channels approximate #009e73 (0, 158, 115), tolerance +/- 5
    expect(healParsed.r).toBeGreaterThanOrEqual(0);
    expect(healParsed.r).toBeLessThanOrEqual(5);
    expect(healParsed.g).toBeGreaterThanOrEqual(153);
    expect(healParsed.g).toBeLessThanOrEqual(163);
    expect(healParsed.b).toBeGreaterThanOrEqual(110);
    expect(healParsed.b).toBeLessThanOrEqual(120);
  });
});
