/**
 * Browser-mode tests for BattleViewer token hover SVG geometry and tooltip z-index stacking.
 * These tests run in a real Chromium browser via Vitest Browser Mode + Playwright.
 * They validate behaviors that jsdom cannot test: real SVG getBoundingClientRect dimensions,
 * hover-to-tooltip flow with real SVG anchors, and z-index stacking across CSS Modules.
 *
 * Phase 1 browser tests (CharacterTooltip.browser.test.tsx) tested tooltip positioning with
 * synthetic DOMRect anchors. These Phase 2 tests validate the full integration flow where
 * anchor rects come from actual SVG token elements.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { page } from "vitest/browser";
import { BattleViewer } from "./BattleViewer";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter } from "../RuleEvaluations/rule-evaluations-test-helpers";

describe("BattleViewer - Token SVG Geometry (Browser)", () => {
  beforeEach(() => {
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
  });

  // Test 1: token-svg-element-has-non-zero-bounding-rect
  it("token SVG element has non-zero bounding rect in real browser", async () => {
    await page.viewport(1280, 720);

    const character = createCharacter({
      id: "char-1",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "enemy-1",
      faction: "enemy",
      position: { q: 2, r: 0 },
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    render(<BattleViewer />);

    const token = screen.getByTestId("token-char-1");
    const rect = token.getBoundingClientRect();

    // Token has real horizontal extent
    expect(rect.width).toBeGreaterThan(0);
    // Token has real vertical extent
    expect(rect.height).toBeGreaterThan(0);
    // Dimensions are within a plausible range (SVG token scaled from 40x46 SVG units)
    expect(rect.width).toBeGreaterThanOrEqual(5);
    expect(rect.width).toBeLessThanOrEqual(200);
    expect(rect.height).toBeGreaterThanOrEqual(5);
    expect(rect.height).toBeLessThanOrEqual(200);
    // Token shape is roughly square (ratio between 0.5 and 2.0), accounting for HP bar
    const ratio = rect.width / rect.height;
    expect(ratio).toBeGreaterThanOrEqual(0.5);
    expect(ratio).toBeLessThanOrEqual(2.0);
  });

  // Test 2: hovering-token-shows-tooltip-positioned-near-token
  it("hovering token shows tooltip positioned near token", async () => {
    await page.viewport(1280, 720);

    const character = createCharacter({
      id: "char-1",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "enemy-1",
      faction: "enemy",
      position: { q: 2, r: 0 },
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    render(<BattleViewer />);

    const user = userEvent.setup();
    const token = screen.getByTestId("token-char-1");
    const tokenRect = token.getBoundingClientRect();

    await user.hover(token);

    // Tooltip appears in the document
    const tooltip = await screen.findByRole("tooltip");

    // Wait for positioning to settle
    await waitFor(() => {
      expect(parseInt(tooltip.style.left)).toBeGreaterThan(0);
    });

    const tooltipLeft = parseInt(tooltip.style.left);
    const tooltipTop = parseInt(tooltip.style.top);

    // Tooltip is positioned to the right of the token (OFFSET = 12px gap)
    expect(tooltipLeft).toBeGreaterThan(tokenRect.right);
    // Tooltip is reasonably close to the token, not at an absurd position
    expect(tooltipLeft).toBeLessThan(tokenRect.right + 50);
    // Tooltip is vertically near the token center (allowing for tooltip height offset)
    const tokenCenterY = tokenRect.top + tokenRect.height / 2;
    expect(Math.abs(tooltipTop - tokenCenterY)).toBeLessThan(200);
  });

  // Test 3: token-bounding-rects-differ-by-hex-position
  it("token bounding rects differ by hex position", async () => {
    await page.viewport(1280, 720);

    const charLeft = createCharacter({
      id: "char-left",
      faction: "friendly",
      position: { q: -2, r: 0 },
      slotPosition: 1,
    });
    const charRight = createCharacter({
      id: "char-right",
      faction: "enemy",
      position: { q: 2, r: 0 },
      slotPosition: 2,
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([charLeft, charRight]);

    render(<BattleViewer />);

    const tokenLeft = screen.getByTestId("token-char-left");
    const tokenRight = screen.getByTestId("token-char-right");
    const rectLeft = tokenLeft.getBoundingClientRect();
    const rectRight = tokenRight.getBoundingClientRect();

    // Token at q:-2 is to the left of token at q:2
    expect(rectLeft.left).toBeLessThan(rectRight.left);
    // Both tokens are on the same row (r=0), so vertical positions nearly identical
    expect(Math.abs(rectLeft.top - rectRight.top)).toBeLessThan(5);
    // Meaningful horizontal separation (not just a 1px rounding difference)
    expect(rectRight.left - rectLeft.left).toBeGreaterThan(20);
  });

  // Test 4: full-hover-to-tooltip-flow-with-off-center-token
  it("full hover-to-tooltip flow with off-center token", async () => {
    await page.viewport(1280, 720);

    const character = createCharacter({
      id: "char-offset",
      faction: "friendly",
      position: { q: 3, r: -1 },
      slotPosition: 1,
    });
    const target = createCharacter({
      id: "enemy-far",
      faction: "enemy",
      position: { q: -2, r: 2 },
      slotPosition: 2,
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    render(<BattleViewer />);

    const user = userEvent.setup();
    const token = screen.getByTestId("token-char-offset");
    const tokenRect = token.getBoundingClientRect();

    await user.hover(token);

    // Tooltip appears
    const tooltip = await screen.findByRole("tooltip");

    // Wait for positioning to settle
    await waitFor(() => {
      expect(parseInt(tooltip.style.left)).toBeGreaterThan(0);
    });

    const tooltipLeft = parseInt(tooltip.style.left);

    // Off-center token is not at the default origin
    expect(tokenRect.left).toBeGreaterThan(0);
    expect(tokenRect.top).toBeGreaterThan(0);
    // Positioning used a real anchor, not a zero DOMRect
    expect(tooltip.style.left).not.toBe("0px");
    // Tooltip left is approximately tokenRect.right + 12 (within 15px tolerance)
    expect(Math.abs(tooltipLeft - (tokenRect.right + 12))).toBeLessThanOrEqual(
      15,
    );
    // Tooltip content contains the character letter (correct character association)
    expect(tooltip.textContent).toMatch(/[A-Z]/);
  });
});

describe("BattleViewer - Tooltip Z-Index Stacking (Browser)", () => {
  beforeEach(() => {
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
  });

  // Test 5: tooltip-z-index-is-1000-via-real-css-resolution
  it("tooltip z-index is 1000 via real CSS resolution", async () => {
    const character = createCharacter({
      id: "char-1",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "enemy-1",
      faction: "enemy",
      position: { q: 1, r: 0 },
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    render(<BattleViewer />);

    const user = userEvent.setup();
    await user.hover(screen.getByTestId("token-char-1"));

    const tooltip = await screen.findByRole("tooltip");

    // Exact z-index value from CSS Module
    expect(window.getComputedStyle(tooltip).zIndex).toBe("1000");
    // Tooltip is in the root stacking context (portaled to document.body)
    expect(window.getComputedStyle(tooltip).position).toBe("fixed");
  });

  // Test 6: tooltip-z-index-exceeds-all-overlay-z-indices
  it("tooltip z-index exceeds all overlay z-indices", async () => {
    const character = createCharacter({
      id: "char-1",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "enemy-1",
      faction: "enemy",
      position: { q: 1, r: 0 },
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    // Advance a tick to generate intent/overlay data
    actions.nextTick();

    render(<BattleViewer />);

    const user = userEvent.setup();
    await user.hover(screen.getByTestId("token-char-1"));

    const tooltip = await screen.findByRole("tooltip");
    const tooltipZIndex = parseInt(window.getComputedStyle(tooltip).zIndex);

    // Query overlay elements within .gridContainer
    // Overlays are absolutely-positioned children of the grid container div
    const gridContainer = document.querySelector(
      "[class*='gridContainer']",
    ) as HTMLElement;
    expect(gridContainer).not.toBeNull();

    const overlayElements: Element[] = [];
    for (const child of Array.from(gridContainer.children)) {
      const computedStyle = window.getComputedStyle(child);
      if (computedStyle.position === "absolute") {
        overlayElements.push(child);
      }
    }

    // At least one overlay element is found (test validity check)
    expect(overlayElements.length).toBeGreaterThanOrEqual(1);

    // Every overlay z-index is below the tooltip z-index
    // Note: z-index "auto" parses to NaN; treat as 0 (default stacking level)
    for (const overlay of overlayElements) {
      const raw = parseInt(window.getComputedStyle(overlay).zIndex);
      const overlayZIndex = Number.isNaN(raw) ? 0 : raw;
      expect(overlayZIndex).toBeLessThan(tooltipZIndex);
    }

    // Specifically validate known z-index values are present among the overlays
    // z-index "auto" is treated as 0 for comparison purposes
    const overlayZIndices = overlayElements.map((el) => {
      const raw = parseInt(window.getComputedStyle(el).zIndex);
      return Number.isNaN(raw) ? 0 : raw;
    });
    const knownZIndices = [5, 10, 20];
    const matchingKnown = knownZIndices.filter((z) =>
      overlayZIndices.includes(z),
    );
    // At least 1 known z-index value should be present
    expect(matchingKnown.length).toBeGreaterThanOrEqual(1);

    // Cross-check tooltip z-index with Test 5
    expect(tooltipZIndex).toBe(1000);
  });
});
