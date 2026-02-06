/**
 * Tests for data-testid attributes on smoke-test-critical components.
 * Verifies that components render elements with expected data-testid attributes
 * used by smoke tests for reliable element targeting.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BattleStatusBadge } from "./BattleStatus/BattleStatusBadge";
import { PlayControls } from "./PlayControls/PlayControls";
import { CharacterControls } from "./CharacterControls/CharacterControls";
import { CharacterPanel } from "./CharacterPanel/CharacterPanel";
import { useGameStore } from "../stores/gameStore";

describe("data-testid attributes", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.initBattle([]);
  });

  it("BattleStatusBadge has battle-status and tick-display testids", () => {
    render(<BattleStatusBadge />);

    const battleStatus = screen.getByTestId("battle-status");
    expect(battleStatus).toBeInTheDocument();
    expect(battleStatus.textContent).not.toBe("");

    const tickDisplay = screen.getByTestId("tick-display");
    expect(tickDisplay).toBeInTheDocument();
    expect(tickDisplay.textContent).toMatch(/tick/i);
  });

  it("PlayControls has btn-step, btn-play-pause, btn-reset testids", () => {
    render(<PlayControls />);

    const stepBtn = screen.getByTestId("btn-step");
    expect(stepBtn).toBeInTheDocument();
    expect(stepBtn.tagName.toLowerCase()).toBe("button");

    const playPauseBtn = screen.getByTestId("btn-play-pause");
    expect(playPauseBtn).toBeInTheDocument();
    expect(playPauseBtn.tagName.toLowerCase()).toBe("button");

    const resetBtn = screen.getByTestId("btn-reset");
    expect(resetBtn).toBeInTheDocument();
    expect(resetBtn.tagName.toLowerCase()).toBe("button");
  });

  it("CharacterControls has btn-add-friendly and btn-add-enemy testids", () => {
    render(<CharacterControls />);

    const addFriendlyBtn = screen.getByTestId("btn-add-friendly");
    expect(addFriendlyBtn).toBeInTheDocument();
    expect(addFriendlyBtn.tagName.toLowerCase()).toBe("button");

    const addEnemyBtn = screen.getByTestId("btn-add-enemy");
    expect(addEnemyBtn).toBeInTheDocument();
    expect(addEnemyBtn.tagName.toLowerCase()).toBe("button");
  });

  it("CharacterPanel renders panel and tab testids when character is selected", () => {
    // Add a character and select it
    useGameStore.getState().actions.addCharacter("friendly");
    const charId = useGameStore.getState().gameState.characters[0]!.id;
    useGameStore.getState().actions.selectCharacter(charId);

    render(<CharacterPanel />);

    const panel = screen.getByTestId("character-panel");
    expect(panel).toBeInTheDocument();

    const panelTitle = screen.getByTestId("character-panel-title");
    expect(panelTitle).toBeInTheDocument();
    // Title should contain the character's faction and letter
    expect(panelTitle.textContent).toMatch(/friendly/i);

    const loadoutTab = screen.getByTestId("tab-loadout");
    expect(loadoutTab).toBeInTheDocument();
    expect(loadoutTab).toHaveAttribute("role", "tab");

    const priorityTab = screen.getByTestId("tab-priority");
    expect(priorityTab).toBeInTheDocument();
    expect(priorityTab).toHaveAttribute("role", "tab");
  });

  it("CharacterPanel placeholder state does not render tab testids", () => {
    // No character selected -- placeholder state
    render(<CharacterPanel />);

    // Panel container should always render
    const panel = screen.getByTestId("character-panel");
    expect(panel).toBeInTheDocument();

    // Tabs and title should NOT be present in placeholder
    expect(screen.queryByTestId("tab-loadout")).toBeNull();
    expect(screen.queryByTestId("tab-priority")).toBeNull();
    expect(screen.queryByTestId("character-panel-title")).toBeNull();
  });
});
