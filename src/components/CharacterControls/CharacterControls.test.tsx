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

  it("should add friendly character when clicked", async () => {
    render(<CharacterControls />);

    const initialCount = useGameStore.getState().gameState.characters.length;

    const addFriendlyButton = screen.getByRole("button", {
      name: /add friendly/i,
    });
    await user.click(addFriendlyButton);

    const characters = useGameStore.getState().gameState.characters;
    expect(characters.length).toBe(initialCount + 1);
    expect(characters[characters.length - 1]?.faction).toBe("friendly");
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

  it("should add enemy character when clicked", async () => {
    render(<CharacterControls />);

    const initialCount = useGameStore.getState().gameState.characters.length;

    const addEnemyButton = screen.getByRole("button", { name: /add enemy/i });
    await user.click(addEnemyButton);

    const characters = useGameStore.getState().gameState.characters;
    expect(characters.length).toBe(initialCount + 1);
    expect(characters[characters.length - 1]?.faction).toBe("enemy");
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
