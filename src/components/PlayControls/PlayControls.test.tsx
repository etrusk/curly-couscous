/**
 * Tests for PlayControls component.
 * Following TDD workflow - tests written first.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayControls } from "./PlayControls";
import { useGameStore } from "../../stores/gameStore";
import type { Character, Skill } from "../../engine/types";

describe("PlayControls", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.useFakeTimers();

    // Setup userEvent with fake timers (no delay)
    user = userEvent.setup({ delay: null });

    // Reset store before each test
    const actions = useGameStore.getState().actions;

    // Initialize with empty battle (will be customized per test)
    actions.initBattle([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render Step button", () => {
      render(<PlayControls />);

      const stepButton = screen.getByRole("button", { name: /step/i });
      expect(stepButton).toBeInTheDocument();
    });

    it("should render Play button initially", () => {
      render(<PlayControls />);

      const playButton = screen.getByRole("button", { name: /play/i });
      expect(playButton).toBeInTheDocument();
    });

    it("should render Reset button", () => {
      render(<PlayControls />);

      const resetButton = screen.getByRole("button", { name: /reset/i });
      expect(resetButton).toBeInTheDocument();
    });

    it("should have accessible button group", () => {
      render(<PlayControls />);

      const buttonGroup = screen.getByRole("group", {
        name: /battle controls/i,
      });
      expect(buttonGroup).toBeInTheDocument();
    });

    it("should apply playControls CSS class to container", () => {
      const { container } = render(<PlayControls />);

      const controlsDiv = container.firstChild as HTMLElement;
      expect(controlsDiv.className).toContain("playControls");
    });
  });

  describe("Step Button", () => {
    it("should call processTick when Step is clicked", async () => {
      // Initialize with active battle
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "char-1",
          name: "Test Character",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 0, y: 0 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      render(<PlayControls />);

      // Initial tick should be 0
      expect(useGameStore.getState().gameState.tick).toBe(0);

      // Click Step button
      const stepButton = screen.getByRole("button", { name: /step/i });
      await user.click(stepButton);

      // Tick should advance to 1
      expect(useGameStore.getState().gameState.tick).toBe(1);
    });

    it("should disable Step button when battle is not active", () => {
      // Initialize with no characters (draws immediately)
      const actions = useGameStore.getState().actions;
      actions.initBattle([]);

      render(<PlayControls />);

      const stepButton = screen.getByRole("button", { name: /step/i });
      expect(stepButton).toBeDisabled();
    });

    it("should disable Step button while auto-playing", async () => {
      // Initialize with active battle
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "char-1",
          name: "Test Character",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 0, y: 0 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      render(<PlayControls />);

      const stepButton = screen.getByRole("button", { name: /step/i });
      const playButton = screen.getByRole("button", { name: /play/i });

      // Initially Step should be enabled
      expect(stepButton).toBeEnabled();

      // Click Play
      await user.click(playButton);

      // Step should now be disabled
      expect(stepButton).toBeDisabled();
    });
  });

  describe("Play/Pause Toggle", () => {
    it("should toggle to Pause when Play is clicked", async () => {
      // Initialize with active battle
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "char-1",
          name: "Test Character",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 0, y: 0 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      render(<PlayControls />);

      const playButton = screen.getByRole("button", { name: /play/i });
      await user.click(playButton);

      // Button should now show "Pause"
      const pauseButton = screen.getByRole("button", { name: /pause/i });
      expect(pauseButton).toBeInTheDocument();
    });

    it("should toggle back to Play when Pause is clicked", async () => {
      // Initialize with active battle
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "char-1",
          name: "Test Character",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 0, y: 0 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      render(<PlayControls />);

      // Click Play
      const playButton = screen.getByRole("button", { name: /play/i });
      await user.click(playButton);

      // Click Pause
      const pauseButton = screen.getByRole("button", { name: /pause/i });
      await user.click(pauseButton);

      // Button should now show "Play" again
      const playButtonAgain = screen.getByRole("button", { name: /play/i });
      expect(playButtonAgain).toBeInTheDocument();
    });

    it("should disable Play button when battle is not active", () => {
      // Initialize with no characters (draws immediately)
      const actions = useGameStore.getState().actions;
      actions.initBattle([]);

      render(<PlayControls />);

      const playButton = screen.getByRole("button", { name: /play/i });
      expect(playButton).toBeDisabled();
    });
  });

  describe("Reset Button", () => {
    it("should call reset when Reset is clicked", async () => {
      // Initialize with active battle
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "char-1",
          name: "Test Character",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 0, y: 0 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      render(<PlayControls />);

      // Advance tick
      const stepButton = screen.getByRole("button", { name: /step/i });
      await user.click(stepButton);
      expect(useGameStore.getState().gameState.tick).toBe(1);

      // Click Reset
      const resetButton = screen.getByRole("button", { name: /reset/i });
      await user.click(resetButton);

      // Tick should be back to 0
      expect(useGameStore.getState().gameState.tick).toBe(0);
    });

    it("should keep Reset button enabled when battle ends", () => {
      // Initialize with no characters (draws immediately)
      const actions = useGameStore.getState().actions;
      actions.initBattle([]);

      render(<PlayControls />);

      const resetButton = screen.getByRole("button", { name: /reset/i });
      expect(resetButton).toBeEnabled();
    });

    it("should pause auto-play and reset when Reset is clicked while playing", async () => {
      // Initialize with active battle
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "char-1",
          name: "Test Character",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 0, y: 0 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      render(<PlayControls />);

      // Start playing
      const playButton = screen.getByRole("button", { name: /play/i });
      await user.click(playButton);

      // Advance time to get some ticks
      vi.advanceTimersByTime(1000);
      expect(useGameStore.getState().gameState.tick).toBeGreaterThan(0);

      // Click Reset
      const resetButton = screen.getByRole("button", { name: /reset/i });
      await user.click(resetButton);

      // Should be back to tick 0
      expect(useGameStore.getState().gameState.tick).toBe(0);

      // Should be paused (Play button visible, not Pause)
      const playButtonAgain = screen.getByRole("button", { name: /play/i });
      expect(playButtonAgain).toBeInTheDocument();

      // Verify ticks don't continue
      const currentTick = useGameStore.getState().gameState.tick;
      vi.advanceTimersByTime(2000);
      expect(useGameStore.getState().gameState.tick).toBe(currentTick);
    });
  });

  describe("Auto-play", () => {
    it("should auto-advance multiple ticks when playing", async () => {
      // Initialize with active battle
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "char-1",
          name: "Test Character",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 0, y: 0 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      render(<PlayControls />);

      // Initial tick should be 0
      expect(useGameStore.getState().gameState.tick).toBe(0);

      // Click Play
      const playButton = screen.getByRole("button", { name: /play/i });
      await user.click(playButton);

      // Advance timer once to verify auto-play works
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // At least one tick should have advanced
      expect(useGameStore.getState().gameState.tick).toBeGreaterThanOrEqual(1);
    });

    it("should stop auto-advancing when paused", async () => {
      // Initialize with active battle
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "char-1",
          name: "Test Character",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 0, y: 0 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      render(<PlayControls />);

      // Click Play
      const playButton = screen.getByRole("button", { name: /play/i });
      await user.click(playButton);

      // Advance one tick
      vi.advanceTimersByTime(1000);
      expect(useGameStore.getState().gameState.tick).toBe(1);

      // Click Pause
      const pauseButton = screen.getByRole("button", { name: /pause/i });
      await user.click(pauseButton);

      // Advance timers - tick should not change
      const currentTick = useGameStore.getState().gameState.tick;
      vi.advanceTimersByTime(5000);
      expect(useGameStore.getState().gameState.tick).toBe(currentTick);
    });

    it("should stop auto-play when battle reaches terminal state", async () => {
      // Create a 1v1 battle where friendly kills enemy in one tick
      const actions = useGameStore.getState().actions;

      const killSkill: Skill = {
        id: "kill-skill",
        name: "Kill Skill",
        tickCost: 1,
        range: 12, // Can reach across entire board
        damage: 100,
        enabled: true,
        triggers: [{ type: "always" }],
        selectorOverride: { type: "nearest_enemy" },
      };

      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 0, y: 0 },
          skills: [killSkill],
          currentAction: null,
        },
        {
          id: "enemy-1",
          name: "Enemy",
          faction: "enemy",
          slotPosition: 1,
          hp: 50, // Will be killed in one hit
          maxHp: 100,
          position: { x: 11, y: 11 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      render(<PlayControls />);

      // Battle should be active
      expect(useGameStore.getState().gameState.battleStatus).toBe("active");

      // Click Play
      const playButton = screen.getByRole("button", { name: /play/i });
      await user.click(playButton);

      // Advance one tick - battle should end with victory
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Battle should now be in victory state
      expect(useGameStore.getState().gameState.battleStatus).toBe("victory");

      // The useEffect should have stopped playing (button shows Play, not Pause)
      // Give React a moment to process the state update
      act(() => {
        vi.runOnlyPendingTimers();
      });

      const playButtonAgain = screen.queryByRole("button", { name: /play/i });
      expect(playButtonAgain).toBeInTheDocument();
    });
  });

  describe("Initial State", () => {
    it("should work correctly when mounted with non-zero tick", async () => {
      // Initialize and advance tick before mounting component
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 0, y: 0 },
          skills: [],
          currentAction: null,
        },
        {
          id: "enemy-1",
          name: "Enemy",
          faction: "enemy",
          slotPosition: 1,
          hp: 100,
          maxHp: 100,
          position: { x: 11, y: 11 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      // Advance tick multiple times (battle stays active with both factions)
      actions.processTick();
      actions.processTick();
      actions.processTick();

      expect(useGameStore.getState().gameState.tick).toBe(3);

      // Now mount component
      render(<PlayControls />);

      // Buttons should render correctly
      expect(screen.getByRole("button", { name: /step/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reset/i }),
      ).toBeInTheDocument();

      // Reset should work
      const resetButton = screen.getByRole("button", { name: /reset/i });
      await user.click(resetButton);

      expect(useGameStore.getState().gameState.tick).toBe(0);
    });
  });
});
