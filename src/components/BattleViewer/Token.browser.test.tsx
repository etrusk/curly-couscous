/**
 * Browser-mode tests for Token selection glow and animation.
 * These tests run in a real Chromium browser via Vitest Browser Mode + Playwright.
 * They validate CSS-driven visual feedback that jsdom cannot verify: selection glow
 * filter, animation properties, focus-visible filter, and HP bar width in a real browser.
 *
 * Existing jsdom tests cover: click behavior, ARIA attributes, content rendering.
 * These browser tests validate computed CSS styles on rendered Token elements.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { page } from "vitest/browser";
import { BattleViewer } from "./BattleViewer";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter } from "../RuleEvaluations/rule-evaluations-test-helpers";
import "../../styles/theme.css"; // Theme CSS variables needed for filter resolution

describe("Token - Selection Glow and Animation (Browser)", () => {
  beforeEach(() => {
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
    // Ensure default dark theme
    document.documentElement.removeAttribute("data-theme");
  });

  // Test 1: selected-token-has-drop-shadow-filter
  it("selected token has drop-shadow filter", async () => {
    await page.viewport(1280, 720);

    const character = createCharacter({
      id: "char-1",
      position: { q: 0, r: 0 },
    });
    const enemy = createCharacter({
      id: "enemy-1",
      faction: "enemy",
      position: { q: 2, r: 0 },
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([character, enemy]);
    actions.selectCharacter("char-1");

    render(<BattleViewer />);

    const token = screen.getByTestId("token-char-1");
    const filter = getComputedStyle(token).filter;

    // A filter is applied (not none or empty)
    expect(filter).not.toBe("none");
    expect(filter).not.toBe("");
    // The correct filter type from .selected { filter: drop-shadow(...) }
    expect(filter).toContain("drop-shadow");
    // The .selected class uses three stacked drop-shadows (8px, 16px, 24px)
    const dropShadowCount = (filter.match(/drop-shadow/g) || []).length;
    expect(dropShadowCount).toBeGreaterThanOrEqual(2);
  });

  // Test 2: unselected-token-has-no-drop-shadow-filter
  it("unselected token has no drop-shadow filter", async () => {
    await page.viewport(1280, 720);

    const character = createCharacter({
      id: "char-1",
      position: { q: 0, r: 0 },
    });
    const enemy = createCharacter({
      id: "enemy-1",
      faction: "enemy",
      position: { q: 2, r: 0 },
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([character, enemy]);
    // Do NOT call selectCharacter (no character selected)

    render(<BattleViewer />);

    const token = screen.getByTestId("token-char-1");
    const filter = getComputedStyle(token).filter;

    // No glow applied: filter is either "none" or does not contain drop-shadow
    expect(filter === "none" || !filter.includes("drop-shadow")).toBe(true);
  });

  // Test 3: selected-token-has-active-animation
  it("selected token has active animation", async () => {
    await page.viewport(1280, 720);

    const character = createCharacter({
      id: "char-1",
      position: { q: 0, r: 0 },
    });
    const enemy = createCharacter({
      id: "enemy-1",
      faction: "enemy",
      position: { q: 2, r: 0 },
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([character, enemy]);
    actions.selectCharacter("char-1");

    render(<BattleViewer />);

    const token = screen.getByTestId("token-char-1");
    const computedStyle = getComputedStyle(token);

    // An animation is active (CSS Modules may mangle the keyframe name)
    expect(computedStyle.animationName).not.toBe("none");
    // Duration from .selected { animation: selectionPulse 2s ease-in-out infinite }
    expect(computedStyle.animationDuration).toBe("2s");
    // The pulse loops forever while selected
    expect(computedStyle.animationIterationCount).toBe("infinite");
    // Matches the declared timing function
    expect(computedStyle.animationTimingFunction).toBe("ease-in-out");
  });

  // Test 4: focus-visible-token-has-drop-shadow-filter
  it("focus-visible token has drop-shadow filter", async () => {
    await page.viewport(1280, 720);

    const character = createCharacter({
      id: "char-1",
      position: { q: 0, r: 0 },
    });
    const enemy = createCharacter({
      id: "enemy-1",
      faction: "enemy",
      position: { q: 2, r: 0 },
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([character, enemy]);
    // Do NOT select any character (so .selected filter is not applied)

    render(<BattleViewer />);

    const user = userEvent.setup();

    // Press Tab to move keyboard focus to the first focusable token element
    await user.tab();

    // Verify focus reached a token
    const activeElement = document.activeElement;
    expect(activeElement).not.toBeNull();
    const testId = activeElement?.getAttribute("data-testid") ?? "";
    expect(testId).toMatch(/^token-/);

    // Read the filter on the focused element
    const filter = getComputedStyle(activeElement!).filter;

    // The :focus-visible rule applies drop-shadow
    expect(filter).toContain("drop-shadow");
    // Focus shadows use 4px blur radius (distinct from selection's 8px, 16px, 24px)
    expect(filter).toContain("4px");
  });

  // Test 5: hp-bar-fill-width-reflects-hp-proportion
  it("HP bar fill width reflects HP proportion", async () => {
    await page.viewport(1280, 720);

    const character = createCharacter({
      id: "char-1",
      hp: 50,
      maxHp: 100,
      position: { q: 0, r: 0 },
    });
    const enemy = createCharacter({
      id: "enemy-1",
      faction: "enemy",
      position: { q: 2, r: 0 },
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([character, enemy]);

    render(<BattleViewer />);

    const healthBar = screen.getByTestId("health-bar-char-1");

    // The data-testid="health-bar-char-1" is present in the real SVG DOM
    expect(healthBar).toBeTruthy();
    // Width attribute: 50% of HP_BAR_WIDTH=40 -> (50/100) * 40 = 20
    expect(healthBar.getAttribute("width")).toBe("20");
    // It is an SVG rect element
    expect(healthBar.tagName.toLowerCase()).toBe("rect");
  });
});
