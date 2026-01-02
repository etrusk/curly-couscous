/**
 * Tests for EventLog component.
 * Following TDD workflow - tests written first.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { EventLog } from "./EventLog";
import { useGameStore } from "../../stores/gameStore";
import type {
  Character,
  DamageEvent,
  MovementEvent,
  DeathEvent,
  TickEvent,
  SkillDecisionEvent,
  SkillExecutionEvent,
} from "../../engine/types";

describe("EventLog", () => {
  beforeEach(() => {
    // Reset store before each test
    const actions = useGameStore.getState().actions;
    actions.initBattle([]);
  });

  describe("Empty State", () => {
    it("should render empty state when no events exist", () => {
      const { container } = render(<EventLog />);

      // Should render without errors
      expect(container).toBeInTheDocument();

      // Should not have any event entries
      const events = container.querySelectorAll('[data-testid^="event-"]');
      expect(events).toHaveLength(0);
    });
  });

  describe("Event Formatting", () => {
    it("should display damage events using character names", () => {
      // Setup: Create characters and add damage event
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly 1",
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
          name: "Enemy 1",
          faction: "enemy",
          slotPosition: 1,
          hp: 90,
          maxHp: 100,
          position: { x: 11, y: 11 },
          skills: [],
          currentAction: null,
        },
      ];

      actions.initBattle(testCharacters);

      // Add damage event
      const damageEvent: DamageEvent = {
        type: "damage",
        tick: 1,
        sourceId: "friendly-1",
        targetId: "enemy-1",
        damage: 10,
        resultingHp: 90,
      };

      actions.addEvent(damageEvent);

      render(<EventLog />);

      // Verify format: "Friendly 1 attacks Enemy 1 for 10 damage"
      expect(
        screen.getByText(/Friendly 1 attacks Enemy 1 for 10 damage/i),
      ).toBeInTheDocument();
    });

    it("should display movement events with coordinates", () => {
      // Setup: Create character and add movement event
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly 1",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 1, y: 0 },
          skills: [],
          currentAction: null,
        },
      ];

      actions.initBattle(testCharacters);

      // Add movement event
      const movementEvent: MovementEvent = {
        type: "movement",
        tick: 1,
        characterId: "friendly-1",
        from: { x: 0, y: 0 },
        to: { x: 1, y: 0 },
        collided: false,
      };

      actions.addEvent(movementEvent);

      render(<EventLog />);

      // Verify format: "Friendly 1 moves from (0,0) to (1,0)"
      expect(
        screen.getByText(/Friendly 1 moves from \(0,0\) to \(1,0\)/i),
      ).toBeInTheDocument();
    });

    it("should display death events with character name", () => {
      // Setup: Create character and add death event
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "enemy-1",
          name: "Enemy 1",
          faction: "enemy",
          slotPosition: 0,
          hp: 0,
          maxHp: 100,
          position: { x: 11, y: 11 },
          skills: [],
          currentAction: null,
        },
      ];

      actions.initBattle(testCharacters);

      // Add death event
      const deathEvent: DeathEvent = {
        type: "death",
        tick: 1,
        characterId: "enemy-1",
      };

      actions.addEvent(deathEvent);

      render(<EventLog />);

      // Verify format: "Enemy 1 was eliminated"
      expect(screen.getByText(/Enemy 1 was eliminated/i)).toBeInTheDocument();
    });
  });

  describe("Internal Event Filtering", () => {
    it("should not display tick events", () => {
      // Setup: Add tick event
      const actions = useGameStore.getState().actions;
      actions.initBattle([]);

      const tickEvent: TickEvent = {
        type: "tick",
        tick: 1,
        phase: "decision",
      };

      actions.addEvent(tickEvent);

      const { container } = render(<EventLog />);

      // Should not have any event entries (tick events are internal)
      const events = container.querySelectorAll('[data-testid^="event-"]');
      expect(events).toHaveLength(0);
    });

    it("should not display skill decision events", () => {
      // Setup: Add skill decision event
      const actions = useGameStore.getState().actions;
      actions.initBattle([]);

      const skillDecisionEvent: SkillDecisionEvent = {
        type: "skill_decision",
        tick: 1,
        characterId: "friendly-1",
        skillId: "light-punch",
        targetIds: ["enemy-1"],
      };

      actions.addEvent(skillDecisionEvent);

      const { container } = render(<EventLog />);

      // Should not have any event entries (skill decision events are internal)
      const events = container.querySelectorAll('[data-testid^="event-"]');
      expect(events).toHaveLength(0);
    });

    it("should not display skill execution events", () => {
      // Setup: Add skill execution event
      const actions = useGameStore.getState().actions;
      actions.initBattle([]);

      const skillExecutionEvent: SkillExecutionEvent = {
        type: "skill_execution",
        tick: 1,
        characterId: "friendly-1",
        skillId: "light-punch",
        targetIds: ["enemy-1"],
      };

      actions.addEvent(skillExecutionEvent);

      const { container } = render(<EventLog />);

      // Should not have any event entries (skill execution events are internal)
      const events = container.querySelectorAll('[data-testid^="event-"]');
      expect(events).toHaveLength(0);
    });
  });

  describe("Faction Color Coding", () => {
    it("should apply friendly faction CSS class to damage events from friendly source", () => {
      // Setup: Create characters and add damage event from friendly source
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly 1",
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
          name: "Enemy 1",
          faction: "enemy",
          slotPosition: 1,
          hp: 90,
          maxHp: 100,
          position: { x: 11, y: 11 },
          skills: [],
          currentAction: null,
        },
      ];

      actions.initBattle(testCharacters);

      const damageEvent: DamageEvent = {
        type: "damage",
        tick: 1,
        sourceId: "friendly-1",
        targetId: "enemy-1",
        damage: 10,
        resultingHp: 90,
      };

      actions.addEvent(damageEvent);

      const { container } = render(<EventLog />);

      // Find the event entry and verify it has friendly faction class
      const eventEntry = container.querySelector('[data-testid^="event-"]');
      expect(eventEntry).toBeInTheDocument();
      expect(eventEntry?.className).toContain("factionFriendly");
    });

    it("should apply enemy faction CSS class to damage events from enemy source", () => {
      // Setup: Create characters and add damage event from enemy source
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly 1",
          faction: "friendly",
          slotPosition: 0,
          hp: 90,
          maxHp: 100,
          position: { x: 0, y: 0 },
          skills: [],
          currentAction: null,
        },
        {
          id: "enemy-1",
          name: "Enemy 1",
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

      const damageEvent: DamageEvent = {
        type: "damage",
        tick: 1,
        sourceId: "enemy-1",
        targetId: "friendly-1",
        damage: 10,
        resultingHp: 90,
      };

      actions.addEvent(damageEvent);

      const { container } = render(<EventLog />);

      // Find the event entry and verify it has enemy faction class
      const eventEntry = container.querySelector('[data-testid^="event-"]');
      expect(eventEntry).toBeInTheDocument();
      expect(eventEntry?.className).toContain("factionEnemy");
    });

    it("should apply faction CSS class to movement events based on characterId", () => {
      // Setup: Create character and add movement event
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly 1",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 1, y: 0 },
          skills: [],
          currentAction: null,
        },
      ];

      actions.initBattle(testCharacters);

      const movementEvent: MovementEvent = {
        type: "movement",
        tick: 1,
        characterId: "friendly-1",
        from: { x: 0, y: 0 },
        to: { x: 1, y: 0 },
        collided: false,
      };

      actions.addEvent(movementEvent);

      const { container } = render(<EventLog />);

      // Find the event entry and verify it has friendly faction class
      const eventEntry = container.querySelector('[data-testid^="event-"]');
      expect(eventEntry).toBeInTheDocument();
      expect(eventEntry?.className).toContain("factionFriendly");
    });

    it("should apply faction CSS class to death events based on characterId", () => {
      // Setup: Create character and add death event
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "enemy-1",
          name: "Enemy 1",
          faction: "enemy",
          slotPosition: 0,
          hp: 0,
          maxHp: 100,
          position: { x: 11, y: 11 },
          skills: [],
          currentAction: null,
        },
      ];

      actions.initBattle(testCharacters);

      const deathEvent: DeathEvent = {
        type: "death",
        tick: 1,
        characterId: "enemy-1",
      };

      actions.addEvent(deathEvent);

      const { container } = render(<EventLog />);

      // Find the event entry and verify it has enemy faction class
      const eventEntry = container.querySelector('[data-testid^="event-"]');
      expect(eventEntry).toBeInTheDocument();
      expect(eventEntry?.className).toContain("factionEnemy");
    });
  });

  describe("Filtering UI", () => {
    it("should show filter toggles for damage, movement, death", () => {
      render(<EventLog />);

      // Verify all three filter controls are present
      expect(
        screen.getByRole("checkbox", { name: /damage/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: /movement/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: /death/i }),
      ).toBeInTheDocument();
    });

    it("should hide damage events when damage filter is toggled off", async () => {
      const user = userEvent.setup();

      // Setup: Add damage event
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly 1",
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
          name: "Enemy 1",
          faction: "enemy",
          slotPosition: 1,
          hp: 90,
          maxHp: 100,
          position: { x: 11, y: 11 },
          skills: [],
          currentAction: null,
        },
      ];

      actions.initBattle(testCharacters);

      const damageEvent: DamageEvent = {
        type: "damage",
        tick: 1,
        sourceId: "friendly-1",
        targetId: "enemy-1",
        damage: 10,
        resultingHp: 90,
      };

      actions.addEvent(damageEvent);

      render(<EventLog />);

      // Verify damage event is visible initially
      expect(screen.getByText(/attacks/i)).toBeInTheDocument();

      // Toggle damage filter off
      const damageCheckbox = screen.getByRole("checkbox", { name: /damage/i });
      await user.click(damageCheckbox);

      // Verify damage event is now hidden
      expect(screen.queryByText(/attacks/i)).not.toBeInTheDocument();
    });

    it("should hide movement events when movement filter is toggled off", async () => {
      const user = userEvent.setup();

      // Setup: Add movement event
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly 1",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 1, y: 0 },
          skills: [],
          currentAction: null,
        },
      ];

      actions.initBattle(testCharacters);

      const movementEvent: MovementEvent = {
        type: "movement",
        tick: 1,
        characterId: "friendly-1",
        from: { x: 0, y: 0 },
        to: { x: 1, y: 0 },
        collided: false,
      };

      actions.addEvent(movementEvent);

      render(<EventLog />);

      // Verify movement event is visible initially
      expect(screen.getByText(/moves from/i)).toBeInTheDocument();

      // Toggle movement filter off
      const movementCheckbox = screen.getByRole("checkbox", {
        name: /movement/i,
      });
      await user.click(movementCheckbox);

      // Verify movement event is now hidden
      expect(screen.queryByText(/moves from/i)).not.toBeInTheDocument();
    });

    it("should hide death events when death filter is toggled off", async () => {
      const user = userEvent.setup();

      // Setup: Add death event
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "enemy-1",
          name: "Enemy 1",
          faction: "enemy",
          slotPosition: 0,
          hp: 0,
          maxHp: 100,
          position: { x: 11, y: 11 },
          skills: [],
          currentAction: null,
        },
      ];

      actions.initBattle(testCharacters);

      const deathEvent: DeathEvent = {
        type: "death",
        tick: 1,
        characterId: "enemy-1",
      };

      actions.addEvent(deathEvent);

      render(<EventLog />);

      // Verify death event is visible initially
      expect(screen.getByText(/was eliminated/i)).toBeInTheDocument();

      // Toggle death filter off
      const deathCheckbox = screen.getByRole("checkbox", { name: /death/i });
      await user.click(deathCheckbox);

      // Verify death event is now hidden
      expect(screen.queryByText(/was eliminated/i)).not.toBeInTheDocument();
    });

    it("should show only death events when damage and movement filters disabled", async () => {
      const user = userEvent.setup();

      // Setup: Add multiple event types
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly 1",
          faction: "friendly",
          slotPosition: 0,
          hp: 100,
          maxHp: 100,
          position: { x: 1, y: 0 },
          skills: [],
          currentAction: null,
        },
        {
          id: "enemy-1",
          name: "Enemy 1",
          faction: "enemy",
          slotPosition: 1,
          hp: 0,
          maxHp: 100,
          position: { x: 11, y: 11 },
          skills: [],
          currentAction: null,
        },
      ];

      actions.initBattle(testCharacters);

      const damageEvent: DamageEvent = {
        type: "damage",
        tick: 1,
        sourceId: "friendly-1",
        targetId: "enemy-1",
        damage: 10,
        resultingHp: 0,
      };

      const movementEvent: MovementEvent = {
        type: "movement",
        tick: 1,
        characterId: "friendly-1",
        from: { x: 0, y: 0 },
        to: { x: 1, y: 0 },
        collided: false,
      };

      const deathEvent: DeathEvent = {
        type: "death",
        tick: 1,
        characterId: "enemy-1",
      };

      actions.addEvent(damageEvent);
      actions.addEvent(movementEvent);
      actions.addEvent(deathEvent);

      render(<EventLog />);

      // Verify all events visible initially
      expect(screen.getByText(/attacks/i)).toBeInTheDocument();
      expect(screen.getByText(/moves from/i)).toBeInTheDocument();
      expect(screen.getByText(/was eliminated/i)).toBeInTheDocument();

      // Toggle damage and movement filters off
      await user.click(screen.getByRole("checkbox", { name: /damage/i }));
      await user.click(screen.getByRole("checkbox", { name: /movement/i }));

      // Verify only death event is visible
      expect(screen.queryByText(/attacks/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/moves from/i)).not.toBeInTheDocument();
      expect(screen.getByText(/was eliminated/i)).toBeInTheDocument();
    });
  });

  describe("UI Structure", () => {
    it("should have scrollable container CSS class", () => {
      const { container } = render(<EventLog />);

      // Verify container has scrollContainer class
      const scrollContainer = container.querySelector(
        '[class*="scrollContainer"]',
      );
      expect(scrollContainer).toBeInTheDocument();
    });

    it("should display events in array order (chronological)", () => {
      // Setup: Add multiple events
      const actions = useGameStore.getState().actions;

      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly 1",
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
          name: "Enemy 1",
          faction: "enemy",
          slotPosition: 1,
          hp: 80,
          maxHp: 100,
          position: { x: 11, y: 11 },
          skills: [],
          currentAction: null,
        },
      ];

      actions.initBattle(testCharacters);

      // Add events in order
      const event1: DamageEvent = {
        type: "damage",
        tick: 1,
        sourceId: "friendly-1",
        targetId: "enemy-1",
        damage: 10,
        resultingHp: 90,
      };

      const event2: DamageEvent = {
        type: "damage",
        tick: 2,
        sourceId: "friendly-1",
        targetId: "enemy-1",
        damage: 10,
        resultingHp: 80,
      };

      actions.addEvent(event1);
      actions.addEvent(event2);

      const { container } = render(<EventLog />);

      // Get all event entries
      const events = container.querySelectorAll('[data-testid^="event-"]');
      expect(events).toHaveLength(2);

      // Verify first event appears before second in DOM
      // (Both say "attacks" but we can check the order)
      const firstEventIndex = Array.from(events).findIndex(
        (el) => el.getAttribute("data-testid") === "event-0",
      );
      const secondEventIndex = Array.from(events).findIndex(
        (el) => el.getAttribute("data-testid") === "event-1",
      );

      expect(firstEventIndex).toBeLessThan(secondEventIndex);
    });
  });

  describe("Edge Cases", () => {
    it("should fallback to character ID when character not found", () => {
      // Setup: Add damage event with unknown character IDs
      const actions = useGameStore.getState().actions;
      actions.initBattle([]); // No characters

      const damageEvent: DamageEvent = {
        type: "damage",
        tick: 1,
        sourceId: "unknown-source",
        targetId: "unknown-target",
        damage: 10,
        resultingHp: 90,
      };

      actions.addEvent(damageEvent);

      render(<EventLog />);

      // Verify event displays with raw IDs
      expect(
        screen.getByText(/unknown-source attacks unknown-target/i),
      ).toBeInTheDocument();
    });
  });
});
