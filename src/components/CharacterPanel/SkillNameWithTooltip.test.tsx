/**
 * Tests for SkillNameWithTooltip component.
 *
 * Uses real skill IDs from SKILL_REGISTRY (no mocking).
 * Uses fake timers to test the 150ms appear delay.
 */

/* eslint-disable @typescript-eslint/require-await -- act() callbacks are intentionally async for proper React state batching */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { SkillNameWithTooltip } from "./SkillNameWithTooltip";
import { SkillRow } from "./SkillRow";
import { PriorityTab } from "./PriorityTab";
import { useGameStore } from "../../stores/gameStore";
import { createSkill, createCharacter } from "../../engine/game-test-helpers";

describe("SkillNameWithTooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Tooltip visibility", () => {
    it("appears after 150ms hover delay", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(
        <SkillNameWithTooltip skillId="light-punch">
          Light Punch
        </SkillNameWithTooltip>,
      );

      // No tooltip initially
      expect(screen.queryByRole("tooltip")).toBeNull();

      // Hover over the skill name
      await user.hover(screen.getByText("Light Punch"));

      // At 100ms: tooltip should NOT be present yet
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      expect(screen.queryByRole("tooltip")).toBeNull();

      // At 150ms total: tooltip should appear
      await act(async () => {
        vi.advanceTimersByTime(50);
      });
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("disappears on mouse leave", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(
        <SkillNameWithTooltip skillId="light-punch">
          Light Punch
        </SkillNameWithTooltip>,
      );

      // Hover and wait for tooltip to appear
      await user.hover(screen.getByText("Light Punch"));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      // Unhover -- tooltip should disappear immediately
      await user.unhover(screen.getByText("Light Punch"));
      expect(screen.queryByRole("tooltip")).toBeNull();
    });

    it("appears on keyboard focus", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(
        <SkillNameWithTooltip skillId="light-punch">
          Light Punch
        </SkillNameWithTooltip>,
      );

      // Tab into the skill name element
      await user.tab();

      // Advance timers past the 150ms delay
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("disappears on blur", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(
        <SkillNameWithTooltip skillId="light-punch">
          Light Punch
        </SkillNameWithTooltip>,
      );

      // Tab to focus and show tooltip
      await user.tab();
      await act(async () => {
        vi.advanceTimersByTime(150);
      });
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      // Tab away -- tooltip should disappear
      await user.tab();
      expect(screen.queryByRole("tooltip")).toBeNull();
    });

    it("rapid hover then unhover cancels pending tooltip", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(
        <SkillNameWithTooltip skillId="light-punch">
          Light Punch
        </SkillNameWithTooltip>,
      );

      // Hover over the skill name
      await user.hover(screen.getByText("Light Punch"));

      // Advance only 100ms (less than 150ms threshold)
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Unhover before the delay elapses
      await user.unhover(screen.getByText("Light Punch"));

      // Advance another 100ms (total 200ms, well past the 150ms threshold)
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Tooltip should never have appeared because timer was cleared
      expect(screen.queryByRole("tooltip")).toBeNull();
    });
  });

  describe("Stat display", () => {
    it("shows correct stats for attack skill (Light Punch)", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(
        <SkillNameWithTooltip skillId="light-punch">
          Light Punch
        </SkillNameWithTooltip>,
      );

      await user.hover(screen.getByText("Light Punch"));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      const tooltip = screen.getByRole("tooltip");
      // Should show: actionType, tickCost, range, damage
      expect(tooltip).toHaveTextContent(/attack/i);
      expect(tooltip).toHaveTextContent(/cost/i);
      expect(tooltip).toHaveTextContent(/range/i);
      expect(tooltip).toHaveTextContent(/damage/i);
      // Verify specific values
      expect(tooltip).toHaveTextContent("10"); // damage value
      // Should NOT show: healing, distance, cooldown, behaviors
      expect(tooltip.textContent).not.toMatch(/healing/i);
      expect(tooltip.textContent).not.toMatch(/distance/i);
      expect(tooltip.textContent).not.toMatch(/cooldown/i);
      expect(tooltip.textContent).not.toMatch(/behaviors/i);
    });

    it("shows correct stats for heal skill (Heal)", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(<SkillNameWithTooltip skillId="heal">Heal</SkillNameWithTooltip>);

      await user.hover(screen.getByText("Heal"));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      const tooltip = screen.getByRole("tooltip");
      // Should show: actionType, tickCost, range, healing
      expect(tooltip).toHaveTextContent(/heal/i);
      expect(tooltip).toHaveTextContent(/cost/i);
      expect(tooltip).toHaveTextContent(/range/i);
      expect(tooltip).toHaveTextContent(/healing/i);
      // Verify specific values
      expect(tooltip).toHaveTextContent("25"); // healing value
      expect(tooltip).toHaveTextContent("5"); // range value
      // Should NOT show: damage, distance, cooldown, behaviors
      expect(tooltip.textContent).not.toMatch(/damage/i);
      expect(tooltip.textContent).not.toMatch(/distance/i);
      expect(tooltip.textContent).not.toMatch(/cooldown/i);
      expect(tooltip.textContent).not.toMatch(/behaviors/i);
    });

    it("shows correct stats for move skill (Move)", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(
        <SkillNameWithTooltip skillId="move-towards">
          Move
        </SkillNameWithTooltip>,
      );

      await user.hover(screen.getByText("Move"));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      const tooltip = screen.getByRole("tooltip");
      // Should show: actionType, tickCost, range, distance, cooldown, behaviors
      expect(tooltip).toHaveTextContent(/move/i);
      expect(tooltip).toHaveTextContent(/cost/i);
      expect(tooltip).toHaveTextContent(/range/i);
      expect(tooltip).toHaveTextContent(/distance/i);
      expect(tooltip).toHaveTextContent(/cooldown/i);
      expect(tooltip).toHaveTextContent(/behaviors/i);
      // Verify behaviors list includes both options
      expect(tooltip).toHaveTextContent(/towards/i);
      expect(tooltip).toHaveTextContent(/away/i);
      // Should NOT show: damage, healing
      expect(tooltip.textContent).not.toMatch(/damage/i);
      expect(tooltip.textContent).not.toMatch(/healing/i);
    });

    it("shows cooldown for Heavy Punch", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(
        <SkillNameWithTooltip skillId="heavy-punch">
          Heavy Punch
        </SkillNameWithTooltip>,
      );

      await user.hover(screen.getByText("Heavy Punch"));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent(/cooldown/i);
      expect(tooltip).toHaveTextContent("3"); // cooldown value
      expect(tooltip).toHaveTextContent(/damage/i);
      expect(tooltip).toHaveTextContent("25"); // damage value
      expect(tooltip).toHaveTextContent(/attack/i);
      expect(tooltip).toHaveTextContent(/cost/i);
      expect(tooltip).toHaveTextContent(/range/i);
    });

    it("shows damage: 0 for Kick (defined but zero)", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(<SkillNameWithTooltip skillId="kick">Kick</SkillNameWithTooltip>);

      await user.hover(screen.getByText("Kick"));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      const tooltip = screen.getByRole("tooltip");
      // damage is defined as 0, so it should be displayed
      expect(tooltip).toHaveTextContent(/damage/i);
      expect(tooltip).toHaveTextContent("0"); // damage value is 0
      expect(tooltip).toHaveTextContent(/interrupt/i); // actionType
      expect(tooltip).toHaveTextContent(/cooldown/i);
      expect(tooltip).toHaveTextContent("4"); // cooldown value
      // Should NOT show: healing, distance, behaviors
      expect(tooltip.textContent).not.toMatch(/healing/i);
      expect(tooltip.textContent).not.toMatch(/distance/i);
      expect(tooltip.textContent).not.toMatch(/behaviors/i);
    });
  });

  describe("Accessibility", () => {
    it("aria-describedby links anchor to tooltip", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(
        <SkillNameWithTooltip skillId="light-punch">
          Light Punch
        </SkillNameWithTooltip>,
      );

      await user.hover(screen.getByText("Light Punch"));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      const anchor = screen.getByText("Light Punch");
      const tooltip = screen.getByRole("tooltip");

      // Tooltip must have a non-empty id
      expect(tooltip.id).toBeTruthy();
      // Anchor's aria-describedby must match the tooltip's id
      expect(anchor).toHaveAttribute("aria-describedby", tooltip.id);
    });

    it("Escape key dismisses visible tooltip", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(
        <SkillNameWithTooltip skillId="light-punch">
          Light Punch
        </SkillNameWithTooltip>,
      );

      // Tab to focus and show tooltip
      await user.tab();
      await act(async () => {
        vi.advanceTimersByTime(150);
      });
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      // Press Escape to dismiss
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("tooltip")).toBeNull();

      // Focus should remain on the anchor
      expect(screen.getByText("Light Punch")).toHaveFocus();
    });
  });

  describe("Graceful degradation", () => {
    it("renders children without tooltip for unknown skill ID", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(
        <SkillNameWithTooltip skillId="nonexistent-skill">
          Unknown Skill
        </SkillNameWithTooltip>,
      );

      // Children should be rendered
      expect(screen.getByText("Unknown Skill")).toBeInTheDocument();

      // Hover over the text
      await user.hover(screen.getByText("Unknown Skill"));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      // No tooltip should appear for unknown skill ID
      expect(screen.queryByRole("tooltip")).toBeNull();
    });
  });

  describe("Integration", () => {
    it("works in SkillRow context", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      const skill = createSkill({ id: "light-punch", name: "Light Punch" });
      const character = createCharacter({ id: "char1", skills: [skill] });

      render(
        <SkillRow
          skill={skill}
          character={character}
          index={0}
          isFirst={false}
          isLast={false}
        />,
      );

      // Find and hover over the skill name
      await user.hover(screen.getByText("Light Punch"));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent(/damage/i);
      expect(tooltip).toHaveTextContent("10");
      expect(tooltip).toHaveTextContent(/attack/i);
    });

    it("works in Inventory context", async () => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      useGameStore.getState().actions.reset();

      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move",
        behavior: "towards",
      });
      const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab />);

      // Light Punch should appear in the inventory since it is not assigned
      await user.hover(screen.getByText("Light Punch"));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent(/attack/i);
      expect(tooltip).toHaveTextContent(/damage/i);
    });
  });
});
