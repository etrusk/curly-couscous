/**
 * Browser-mode tests for IntentOverlay SVG marker definitions and rendering.
 * These tests run in a real Chromium browser via Vitest Browser Mode + Playwright.
 * They validate behaviors that jsdom cannot test: SVG marker rendering context,
 * CSS custom property resolution within marker elements, getBoundingClientRect
 * on SVG line elements, and marker-end reference chain validation.
 *
 * Existing jsdom tests cover: marker-end attribute strings on intent lines,
 * intent data selector filtering, action type mapping.
 * These browser tests validate the full SVG marker rendering pipeline.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { page } from "vitest/browser";
import { BattleViewer } from "./BattleViewer";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createAttackAction,
  createMoveAction,
} from "../RuleEvaluations/rule-evaluations-test-helpers";
import "../../styles/theme.css";

/**
 * Resolves a CSS custom property to its computed color value by using a probe element.
 * Creates a temporary div, sets its background-color to var(--name), appends it to
 * the document, reads getComputedStyle(div).backgroundColor, then removes the div.
 */
function resolveColorVar(name: string): string {
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(${name})`;
  document.documentElement.appendChild(probe);
  const resolved = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return resolved;
}

describe("IntentOverlay - SVG Markers (Browser)", () => {
  beforeEach(() => {
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
    document.documentElement.removeAttribute("data-theme");
  });

  // Test 1: all-four-marker-definitions-exist-in-rendered-SVG-defs
  it("all four marker definitions exist in rendered SVG defs", async () => {
    await page.viewport(1280, 720);

    const friendly = createCharacter({
      id: "friendly-1",
      position: { q: 0, r: 0 },
    });
    const enemy = createCharacter({
      id: "enemy-1",
      faction: "enemy",
      position: { q: 2, r: 0 },
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([friendly, enemy]);

    render(<BattleViewer />);

    // Assert each marker exists
    const arrowhead = document.getElementById("arrowhead-attack");
    const cross = document.getElementById("cross-heal");
    const circle = document.getElementById("circle-friendly");
    const diamond = document.getElementById("diamond-enemy");

    expect(arrowhead).not.toBeNull();
    expect(cross).not.toBeNull();
    expect(circle).not.toBeNull();
    expect(diamond).not.toBeNull();

    // Assert child shape elements
    expect(arrowhead!.querySelectorAll("polygon")).toHaveLength(2);
    expect(cross!.querySelectorAll("path")).toHaveLength(2);
    expect(circle!.querySelectorAll("circle")).toHaveLength(2);
    expect(diamond!.querySelectorAll("polygon")).toHaveLength(2);

    // Assert marker attributes on all 4 markers
    const markers = [arrowhead!, cross!, circle!, diamond!];
    for (const marker of markers) {
      expect(marker.getAttribute("markerUnits")).toBe("userSpaceOnUse");
      expect(marker.getAttribute("overflow")).toBe("visible");
      expect(marker.getAttribute("orient")).toBe("auto");
    }
  });

  // Test 2: marker-CSS-variables-resolve-to-correct-action-colors
  it("marker CSS variables resolve to correct action colors", () => {
    // No component rendering needed -- uses probe element pattern
    expect(resolveColorVar("--action-attack")).toBe("rgb(213, 94, 0)");
    expect(resolveColorVar("--action-heal")).toBe("rgb(0, 158, 115)");
    expect(resolveColorVar("--action-move")).toBe("rgb(0, 114, 178)");
    expect(resolveColorVar("--contrast-line")).toBe("rgb(255, 255, 255)");
  });

  // Test 3: intent-line-with-marker-end-produces-non-zero-visual-extent
  it("intent line with marker-end produces non-zero visual extent", async () => {
    await page.viewport(1280, 720);

    const friendly = createCharacter({
      id: "attacker-1",
      position: { q: 0, r: 0 },
      currentAction: createAttackAction(
        "light-punch",
        "Light Punch",
        { q: 2, r: 0 },
        null,
        0,
        2,
      ),
    });
    const enemy = createCharacter({
      id: "target-1",
      faction: "enemy",
      position: { q: 2, r: 0 },
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([friendly, enemy]);

    render(<BattleViewer />);

    // Query all <line> elements that have a marker-end attribute
    const linesWithMarker = document.querySelectorAll("line[marker-end]");
    expect(linesWithMarker.length).toBeGreaterThanOrEqual(1);

    // Find the line with arrowhead-attack marker
    const attackLine = Array.from(linesWithMarker).find((line) =>
      line.getAttribute("marker-end")?.includes("arrowhead-attack"),
    );
    expect(attackLine).toBeDefined();

    // Measure the parent <g> element bounding rect
    const parentG = attackLine!.parentElement!;
    const rect = parentG.getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  });

  // Test 4: attack-intent-uses-arrowhead-marker-heal-uses-cross-marker
  it("attack intent uses arrowhead marker, heal uses cross marker", async () => {
    await page.viewport(1280, 720);

    // Friendly attacker
    const attacker = createCharacter({
      id: "attacker-1",
      faction: "friendly",
      position: { q: -2, r: 0 },
      currentAction: createAttackAction(
        "light-punch",
        "Light Punch",
        { q: 2, r: 0 },
        null,
        0,
        2,
      ),
    });

    // Enemy target
    const target = createCharacter({
      id: "target-1",
      faction: "enemy",
      position: { q: 2, r: 0 },
      skills: [],
    });

    // Enemy healer with heal currentAction
    const healer = createCharacter({
      id: "healer-1",
      faction: "enemy",
      position: { q: 4, r: 0 },
      currentAction: {
        type: "heal",
        skill: {
          id: "heal",
          instanceId: "heal",
          name: "Heal",
          actionType: "heal",
          tickCost: 1,
          range: 2,
          healing: 15,
          behavior: "",
          enabled: true,
          trigger: { scope: "ally", condition: "always" },
          target: "ally",
          criterion: "nearest",
        },
        targetCell: { q: 3, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    });

    // Wounded enemy ally (same faction as healer)
    const woundedAlly = createCharacter({
      id: "wounded-1",
      faction: "enemy",
      position: { q: 3, r: 0 },
      hp: 50,
      skills: [],
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([attacker, target, healer, woundedAlly]);

    render(<BattleViewer />);

    // Query all <line> elements with marker-end
    const linesWithMarker = document.querySelectorAll("line[marker-end]");
    expect(linesWithMarker.length).toBeGreaterThanOrEqual(2);

    // At least one line has arrowhead-attack marker
    const hasArrowhead = Array.from(linesWithMarker).some((line) =>
      line.getAttribute("marker-end")?.includes("arrowhead-attack"),
    );
    expect(hasArrowhead).toBe(true);

    // At least one line has cross-heal marker
    const hasCross = Array.from(linesWithMarker).some((line) =>
      line.getAttribute("marker-end")?.includes("cross-heal"),
    );
    expect(hasCross).toBe(true);

    // Referenced markers exist in the DOM
    expect(document.getElementById("arrowhead-attack")).not.toBeNull();
    expect(document.getElementById("cross-heal")).not.toBeNull();
  });

  // Test 5: friendly-and-enemy-movement-intents-use-different-marker-shapes
  it("friendly and enemy movement intents use different marker shapes", async () => {
    await page.viewport(1280, 720);

    const friendly = createCharacter({
      id: "mover-friendly",
      faction: "friendly",
      position: { q: -2, r: 0 },
      currentAction: createMoveAction(
        "move",
        "Move",
        "towards",
        { q: -1, r: 0 },
        0,
        1,
      ),
    });

    const enemy = createCharacter({
      id: "mover-enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
      currentAction: createMoveAction(
        "move",
        "Move",
        "towards",
        { q: 1, r: 0 },
        0,
        1,
      ),
    });

    const { actions } = useGameStore.getState();
    actions.initBattle([friendly, enemy]);

    render(<BattleViewer />);

    // Query all <line> elements with marker-end
    const linesWithMarker = document.querySelectorAll("line[marker-end]");
    expect(linesWithMarker.length).toBeGreaterThanOrEqual(2);

    // At least one line has circle-friendly marker
    const hasCircle = Array.from(linesWithMarker).some((line) =>
      line.getAttribute("marker-end")?.includes("circle-friendly"),
    );
    expect(hasCircle).toBe(true);

    // At least one line has diamond-enemy marker
    const hasDiamond = Array.from(linesWithMarker).some((line) =>
      line.getAttribute("marker-end")?.includes("diamond-enemy"),
    );
    expect(hasDiamond).toBe(true);

    // Referenced markers exist in the DOM
    expect(document.getElementById("circle-friendly")).not.toBeNull();
    expect(document.getElementById("diamond-enemy")).not.toBeNull();

    // Sanity check: no line has both circle and diamond
    for (const line of Array.from(linesWithMarker)) {
      const markerEnd = line.getAttribute("marker-end") ?? "";
      const hasCircleRef = markerEnd.includes("circle");
      const hasDiamondRef = markerEnd.includes("diamond");
      expect(hasCircleRef && hasDiamondRef).toBe(false);
    }
  });
});
