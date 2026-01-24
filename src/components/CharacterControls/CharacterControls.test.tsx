/**
 * Tests for CharacterControls component.
 * Following TDD workflow - tests written first.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterControls } from "./CharacterControls";
import { useGameStore } from "../../stores/gameStore";

describe("CharacterControls - Rendering", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.initBattle([]);
  });

  it("should render Add Friendly button", () => {
    render(<CharacterControls />);

    const addFriendlyButton = screen.getByRole("button", {
      name: /add friendly/i,
    });
    expect(addFriendlyButton).toBeInTheDocument();
  });

  it("should render Add Enemy button", () => {
    render(<CharacterControls />);

    const addEnemyButton = screen.getByRole("button", { name: /add enemy/i });
    expect(addEnemyButton).toBeInTheDocument();
  });

  it("should render Remove button", () => {
    render(<CharacterControls />);

    const removeButton = screen.getByRole("button", { name: /remove/i });
    expect(removeButton).toBeInTheDocument();
  });

  it("should have accessible button group", () => {
    render(<CharacterControls />);

    const buttonGroup = screen.getByRole("group", {
      name: /character controls/i,
    });
    expect(buttonGroup).toBeInTheDocument();
  });

  it("should apply characterControls CSS class to container", () => {
    const { container } = render(<CharacterControls />);

    const controlsDiv = container.firstChild as HTMLElement;
    expect(controlsDiv.className).toContain("characterControls");
  });
});

describe("CharacterControls - Add Friendly Button", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.initBattle([]);
  });

  it("should set selection mode to placing-friendly when clicked", async () => {
    render(<CharacterControls />);

    const addFriendlyButton = screen.getByRole("button", {
      name: /add friendly/i,
    });
    await user.click(addFriendlyButton);

    expect(useGameStore.getState().selectionMode).toBe("placing-friendly");
  });

  it("should be disabled when grid is full", () => {
    // Fill the grid with 144 characters
    for (let i = 0; i < 144; i++) {
      useGameStore
        .getState()
        .actions.addCharacter(i % 2 === 0 ? "friendly" : "enemy");
    }

    render(<CharacterControls />);

    const addFriendlyButton = screen.getByRole("button", {
      name: /add friendly/i,
    });
    expect(addFriendlyButton).toBeDisabled();
  });
});

describe("CharacterControls - Add Enemy Button", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.initBattle([]);
  });

  it("should set selection mode to placing-enemy when clicked", async () => {
    render(<CharacterControls />);

    const addEnemyButton = screen.getByRole("button", { name: /add enemy/i });
    await user.click(addEnemyButton);

    expect(useGameStore.getState().selectionMode).toBe("placing-enemy");
  });

  it("should be disabled when grid is full", () => {
    // Fill the grid with 144 characters
    for (let i = 0; i < 144; i++) {
      useGameStore
        .getState()
        .actions.addCharacter(i % 2 === 0 ? "friendly" : "enemy");
    }

    render(<CharacterControls />);

    const addEnemyButton = screen.getByRole("button", { name: /add enemy/i });
    expect(addEnemyButton).toBeDisabled();
  });
});

describe("CharacterControls - Remove Button", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.initBattle([]);
  });

  it("should be disabled when no character is selected", () => {
    render(<CharacterControls />);

    const removeButton = screen.getByRole("button", { name: /remove/i });
    expect(removeButton).toBeDisabled();
  });

  it("should be enabled when a character is selected", () => {
    useGameStore.getState().actions.addCharacter("friendly");
    const charId = useGameStore.getState().gameState.characters[0]!.id;
    useGameStore.getState().actions.selectCharacter(charId);

    render(<CharacterControls />);

    const removeButton = screen.getByRole("button", { name: /remove/i });
    expect(removeButton).toBeEnabled();
  });

  it("should remove selected character when clicked", async () => {
    useGameStore.getState().actions.addCharacter("friendly");
    const charId = useGameStore.getState().gameState.characters[0]!.id;
    useGameStore.getState().actions.selectCharacter(charId);

    render(<CharacterControls />);

    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    const characters = useGameStore.getState().gameState.characters;
    expect(characters.length).toBe(0);
  });

  it("should return to disabled after removing (selection cleared)", async () => {
    useGameStore.getState().actions.addCharacter("friendly");
    const charId = useGameStore.getState().gameState.characters[0]!.id;
    useGameStore.getState().actions.selectCharacter(charId);

    render(<CharacterControls />);

    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    // Selection should be cleared after removal
    expect(useGameStore.getState().selectedCharacterId).toBeNull();
    expect(removeButton).toBeDisabled();
  });
});

describe("CharacterControls - Move Button (Debug UI)", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.initBattle([]);
  });

  it("should render Move button", () => {
    render(<CharacterControls />);

    const moveButton = screen.getByRole("button", { name: /move character/i });
    expect(moveButton).toBeInTheDocument();
  });

  it("Move button should be disabled when no character selected", () => {
    render(<CharacterControls />);

    const moveButton = screen.getByRole("button", { name: /move character/i });
    expect(moveButton).toBeDisabled();
  });

  it("Move button should be enabled when character is selected", () => {
    useGameStore.getState().actions.addCharacter("friendly");
    const charId = useGameStore.getState().gameState.characters[0]!.id;
    useGameStore.getState().actions.selectCharacter(charId);

    render(<CharacterControls />);

    const moveButton = screen.getByRole("button", { name: /move character/i });
    expect(moveButton).toBeEnabled();
  });

  it("clicking Add Friendly should set selectionMode to placing-friendly", async () => {
    render(<CharacterControls />);

    const addFriendlyButton = screen.getByRole("button", {
      name: /add friendly/i,
    });
    await user.click(addFriendlyButton);

    expect(useGameStore.getState().selectionMode).toBe("placing-friendly");
  });

  it("clicking Add Enemy should set selectionMode to placing-enemy", async () => {
    render(<CharacterControls />);

    const addEnemyButton = screen.getByRole("button", { name: /add enemy/i });
    await user.click(addEnemyButton);

    expect(useGameStore.getState().selectionMode).toBe("placing-enemy");
  });

  it("clicking Move should set selectionMode to moving", async () => {
    useGameStore.getState().actions.addCharacter("friendly");
    const charId = useGameStore.getState().gameState.characters[0]!.id;
    useGameStore.getState().actions.selectCharacter(charId);

    render(<CharacterControls />);

    const moveButton = screen.getByRole("button", { name: /move character/i });
    await user.click(moveButton);

    expect(useGameStore.getState().selectionMode).toBe("moving");
  });

  it("clicking active mode button again should return to idle", async () => {
    render(<CharacterControls />);

    const addFriendlyButton = screen.getByRole("button", {
      name: /add friendly/i,
    });

    // Click once to activate
    await user.click(addFriendlyButton);
    expect(useGameStore.getState().selectionMode).toBe("placing-friendly");

    // Click again to deactivate
    await user.click(addFriendlyButton);
    expect(useGameStore.getState().selectionMode).toBe("idle");
  });

  it("should show visual indicator for active selection mode", async () => {
    render(<CharacterControls />);

    const addFriendlyButton = screen.getByRole("button", {
      name: /add friendly/i,
    });

    // Initially not active
    expect(addFriendlyButton.className).not.toContain("activeButton");

    // Click to activate
    await user.click(addFriendlyButton);

    // Should have active class
    expect(addFriendlyButton.className).toContain("activeButton");
  });
});
