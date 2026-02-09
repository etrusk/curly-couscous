/**
 * Browser-mode tests for CharacterTooltip positioning.
 * These tests run in a real Chromium browser via Vitest Browser Mode + Playwright.
 * They validate behaviors that jsdom cannot test: real getBoundingClientRect dimensions,
 * positioning with actual rendered dimensions, and viewport constraint behavior.
 *
 * Existing jsdom tests in CharacterTooltip.test.tsx cover content, ARIA, callbacks, and portal.
 * These browser tests intentionally avoid duplicating any of that.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { page } from "vitest/browser";
import { CharacterTooltip } from "./CharacterTooltip";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createTarget,
} from "../RuleEvaluations/rule-evaluations-test-helpers";

describe("CharacterTooltip - Browser Positioning", () => {
  beforeEach(() => {
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
  });

  // Test 1: browser-environment-is-real-browser
  it("runs in a real browser, not jsdom", () => {
    // navigator.userAgent should not contain "jsdom"
    expect(navigator.userAgent).not.toContain("jsdom");

    // Real browser has a viewport with nonzero dimensions
    expect(window.innerWidth).toBeGreaterThan(0);
    expect(window.innerHeight).toBeGreaterThan(0);

    // Verify getBoundingClientRect works with real layout:
    // attach an element with explicit dimensions and measure it
    const div = document.createElement("div");
    div.style.width = "100px";
    div.style.height = "50px";
    document.body.appendChild(div);
    const rect = div.getBoundingClientRect();
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(50);
    document.body.removeChild(div);
  });

  // Test 2: tooltip-gets-real-dimensions-from-getBoundingClientRect
  it("tooltip gets real dimensions from getBoundingClientRect", () => {
    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    const anchorRect = new DOMRect(200, 200, 40, 40);

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    const rect = tooltip.getBoundingClientRect();

    // jsdom always returns 0; real browser returns actual dimensions
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
    // CSS min-width: 280px should be respected by the browser layout engine
    expect(rect.width).toBeGreaterThanOrEqual(280);
  });

  // Test 3: tooltip-positions-using-real-dimensions-not-fallback
  it("tooltip positions using real dimensions, not fallback", async () => {
    // Ensure a wide viewport so the tooltip fits to the right of the anchor.
    // The default Vitest browser iframe may be narrow; set explicitly.
    await page.viewport(1280, 720);

    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    const anchorRect = new DOMRect(200, 200, 40, 40);

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    const tooltip = screen.getByRole("tooltip");

    // Wait for useLayoutEffect position update to propagate
    await waitFor(() => {
      const left = parseInt(tooltip.style.left);
      expect(left).toBeGreaterThan(0);
    });

    const tooltipRect = tooltip.getBoundingClientRect();
    const left = parseInt(tooltip.style.left);
    const top = parseInt(tooltip.style.top);

    // OFFSET constant is 12; with wide viewport, right-side positioning is preferred
    // left should be approximately anchorRect.right + 12 = 252
    expect(Math.abs(left - 252)).toBeLessThanOrEqual(2);

    // Vertical centering uses real tooltip height (not 150px fallback)
    // Expected: anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2
    //         = 200 + 20 - tooltipRect.height / 2 = 220 - realHeight/2
    const expectedTop = 220 - tooltipRect.height / 2;
    expect(Math.abs(top - expectedTop)).toBeLessThanOrEqual(2);

    // Confirm real dimensions were used (not zero-rect path)
    expect(tooltipRect.width).toBeGreaterThan(0);
  });

  // Test 4: tooltip-flips-to-left-in-narrow-viewport
  it("tooltip flips to left side in narrow viewport", async () => {
    // Set a viewport narrow enough that the tooltip (~280-320px wide) cannot fit
    // to the right of the anchor, but wide enough that it CAN fit to the left.
    // The component uses strict inequality (left - OFFSET - tooltipWidth > MARGIN),
    // so anchor.left must exceed OFFSET + tooltipWidth + MARGIN + 1.
    await page.viewport(620, 600);

    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    // Anchor placed so right side overflows but left side fits:
    // Right check: 390 + 12 + ~280 + 8 = ~690 > 620 (fails => won't place right)
    // Left check: 350 - 12 - ~280 = ~58 > 8 (passes => places left)
    const anchorRect = new DOMRect(350, 200, 40, 40);

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    const tooltip = screen.getByRole("tooltip");

    // Wait for useLayoutEffect position update to propagate
    await waitFor(() => {
      const left = parseInt(tooltip.style.left);
      expect(left).toBeGreaterThan(0);
    });

    const left = parseInt(tooltip.style.left);

    // Tooltip should be positioned to the left of the anchor
    expect(left).toBeLessThan(anchorRect.left);
    // Tooltip should not go off the left edge (MARGIN = 8)
    expect(left).toBeGreaterThanOrEqual(8);
    // Real dimensions were used for the constraint check
    expect(tooltip.getBoundingClientRect().width).toBeGreaterThan(0);
  });
});

describe("CharacterTooltip - Fade-in Animation (Browser)", () => {
  beforeEach(() => {
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
  });

  // Test 8 (Phase 4): tooltip-has-active-fade-in-animation-properties
  it("tooltip has active fade-in animation properties", () => {
    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    const anchorRect = new DOMRect(200, 200, 40, 40);

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    const computedStyle = getComputedStyle(tooltip);

    // An animation is active (CSS Modules will mangle the keyframe name)
    expect(computedStyle.animationName).not.toBe("none");
    // Duration from animation: fadeIn 150ms ease-out forwards (browsers normalize to 0.15s)
    expect(computedStyle.animationDuration).toBe("0.15s");
    // Timing function
    expect(computedStyle.animationTimingFunction).toBe("ease-out");
    // Fill mode
    expect(computedStyle.animationFillMode).toBe("forwards");
  });
});
