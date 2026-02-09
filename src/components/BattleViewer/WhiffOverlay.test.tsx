/**
 * Tests for WhiffOverlay component.
 * Tests rendering of whiff indicators as hex polygon overlays.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { useGameStore } from "../../stores/gameStore";
import { WhiffOverlay } from "./WhiffOverlay";
import { computeHexViewBox } from "../../engine/hex";
// @ts-expect-error - fs and path are available in vitest Node environment
import { readFileSync } from "fs";
// @ts-expect-error - fs and path are available in vitest Node environment
import { join } from "path";
import type { Character } from "../../engine/types";

describe("WhiffOverlay", () => {
  const createCharacter = (
    id: string,
    faction: "friendly" | "enemy",
    position: { q: number; r: number },
  ): Character => ({
    id,
    name: `Character ${id}`,
    faction,
    slotPosition: 1,
    hp: 100,
    maxHp: 100,
    position,
    skills: [],
    currentAction: null,
  });

  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("renders no polygons when no whiff data", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    const { container } = render(<WhiffOverlay hexSize={40} />);

    // SVG container should exist
    expect(container.querySelector("svg")).toBeInTheDocument();
    // No polygons rendered
    expect(container.querySelectorAll("polygon")).toHaveLength(0);
  });

  it("renders hex polygon for each whiff cell", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    const char2 = createCharacter("char2", "enemy", { q: 3, r: 0 });
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Add whiff event at tick 0
    useGameStore.getState().actions.addEvent({
      type: "whiff" as const,
      tick: 0,
      sourceId: "char1",
      actionType: "attack" as const,
      targetCell: { q: 1, r: 0 },
    });

    const { container } = render(<WhiffOverlay hexSize={40} />);

    const polygons = container.querySelectorAll("polygon");
    expect(polygons).toHaveLength(1);
    // Should have points attribute (hex vertices)
    expect(polygons[0]).toHaveAttribute("points");
  });

  it("attack whiff fill uses color-mix with action-attack color", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.addEvent({
      type: "whiff" as const,
      tick: 0,
      sourceId: "char1",
      actionType: "attack" as const,
      targetCell: { q: 1, r: 0 },
    });

    const { container } = render(<WhiffOverlay hexSize={40} />);

    const polygon = container.querySelector("polygon");
    const fill = polygon?.getAttribute("fill");
    expect(fill).toMatch(/color-mix\(/);
    expect(fill).toMatch(/var\(--action-attack\)/);
    expect(fill).toMatch(/20%/);
    expect(fill).toMatch(/transparent/);
  });

  it("heal whiff fill uses color-mix with action-heal color", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.addEvent({
      type: "whiff" as const,
      tick: 0,
      sourceId: "char1",
      actionType: "heal" as const,
      targetCell: { q: 1, r: 0 },
    });

    const { container } = render(<WhiffOverlay hexSize={40} />);

    const polygon = container.querySelector("polygon");
    const fill = polygon?.getAttribute("fill");
    expect(fill).toMatch(/color-mix\(/);
    expect(fill).toMatch(/var\(--action-heal\)/);
    expect(fill).toMatch(/20%/);
    expect(fill).toMatch(/transparent/);
  });

  it("whiff polygons have no opacity attribute", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    useGameStore.getState().actions.addEvent({
      type: "whiff" as const,
      tick: 0,
      sourceId: "char1",
      actionType: "attack" as const,
      targetCell: { q: 1, r: 0 },
    });

    const { container } = render(<WhiffOverlay hexSize={40} />);

    const polygon = container.querySelector("polygon");
    expect(polygon).not.toHaveAttribute("opacity");
  });

  it("whiff overlay source has no WHIFF_FILL_OPACITY constant", () => {
    // @ts-expect-error - __dirname is available in vitest Node environment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const sourcePath = join(__dirname, "WhiffOverlay.tsx");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, security/detect-non-literal-fs-filename
    const sourceContent: string = readFileSync(sourcePath, "utf-8");

    expect(sourceContent).not.toMatch(/WHIFF_FILL_OPACITY/);
  });

  it("whiff overlay has no pointer events CSS class", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    const { container } = render(<WhiffOverlay hexSize={40} />);

    const svg = container.querySelector("svg");
    // The SVG should have a CSS class containing "whiffOverlay"
    expect(svg?.getAttribute("class")).toMatch(/whiffOverlay/);
  });

  it("whiff overlay shares grid viewBox", () => {
    const char1 = createCharacter("char1", "friendly", { q: 0, r: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    const { container } = render(<WhiffOverlay hexSize={40} />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("viewBox");

    const expectedViewBox = computeHexViewBox(40).viewBox;
    expect(svg?.getAttribute("viewBox")).toBe(expectedViewBox);
  });
});
