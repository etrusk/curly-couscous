/**
 * Tests for InventoryPanel component.
 * Following TDD workflow - these tests are written before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { InventoryPanel } from "./InventoryPanel";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";
import { SKILL_REGISTRY } from "../../engine/skill-registry";
import { act } from "react";

describe("InventoryPanel", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.selectCharacter(null);
  });

  describe("Header and Layout", () => {
    it("renders inventory header", () => {
      render(<InventoryPanel />);

      const heading = screen.getByRole("heading", { name: /inventory/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H2");
    });

    it("has accessible region role", () => {
      render(<InventoryPanel />);

      const region = screen.getByRole("region", { name: /inventory/i });
      expect(region).toBeInTheDocument();
    });
  });

  describe("Placeholder States", () => {
    it("shows placeholder when no character selected", () => {
      render(<InventoryPanel />);

      expect(
        screen.getByText(/select a character to view available skills/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/light punch/i)).not.toBeInTheDocument();
    });
  });

  describe("Skill Display", () => {
    it("shows skills when friendly selected", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
      expect(screen.queryByText(/^move$/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/select a character to view available skills/i),
      ).not.toBeInTheDocument();
    });

    it("shows skills when enemy selected", () => {
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move",
        behavior: "towards",
      });
      const enemy = createCharacter({
        id: "enemy1",
        faction: "enemy",
        skills: [moveSkill],
      });
      useGameStore.getState().actions.initBattle([enemy]);
      useGameStore.getState().actions.selectCharacter("enemy1");

      render(<InventoryPanel />);

      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
      expect(screen.queryByText(/^move$/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/select a character to view available skills/i),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /assign light punch/i }),
      ).toBeInTheDocument();
    });

    it("no innate badge displayed for any skill", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      expect(screen.queryByText(/innate/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/innate skill/i)).not.toBeInTheDocument();
    });

    it("displays skill stats tick cost", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      // Three skills have tick cost 0 (Light Punch, Dash, Kick)
      const tickCost0Elements = screen.getAllByText(/tick cost: 0/i);
      expect(tickCost0Elements.length).toBe(3);

      // Two skills have tick cost 2 (Heavy Punch and Heal)
      const tickCost2Elements = screen.getAllByText(/tick cost: 2/i);
      expect(tickCost2Elements.length).toBe(2);
    });

    it("displays skill stats range", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      // Three skills have range 1 (Light Punch, Dash, Kick)
      const range1Elements = screen.getAllByText(/range: 1/i);
      expect(range1Elements.length).toBe(3);

      // One skill has range 2 (Heavy Punch)
      expect(screen.getByText(/range: 2/i)).toBeInTheDocument();
    });

    it("displays skill stats damage", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      expect(screen.getByText(/damage: 10/i)).toBeInTheDocument();
      expect(screen.getByText(/damage: 25/i)).toBeInTheDocument();
    });

    it("displays skills from registry not hardcoded", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      // Verify all non-innate skill names from SKILL_REGISTRY appear in the document
      SKILL_REGISTRY.filter((s) => !s.innate).forEach((skill) => {
        expect(
          screen.getByRole("heading", { name: new RegExp(skill.name, "i") }),
        ).toBeInTheDocument();
      });

      // Verify innate skills do NOT appear
      SKILL_REGISTRY.filter((s) => s.innate).forEach((skill) => {
        expect(
          screen.queryByText(new RegExp(skill.name, "i")),
        ).not.toBeInTheDocument();
      });

      // Total count matches non-innate registry length
      const skillNameCount = SKILL_REGISTRY.filter((skill) => {
        return (
          screen.queryByRole("heading", {
            name: new RegExp(skill.name, "i"),
          }) !== null
        );
      }).length;

      expect(skillNameCount).toBe(
        SKILL_REGISTRY.filter((s) => !s.innate).length,
      );
    });
  });

  describe("Selection Transitions", () => {
    it("transitions from placeholder to skills on selection", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);

      render(<InventoryPanel />);

      // Initially shows placeholder
      expect(
        screen.getByText(/select a character to view available skills/i),
      ).toBeInTheDocument();

      // Select character
      act(() => {
        useGameStore.getState().actions.selectCharacter("char1");
      });

      // Now shows skills
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/select a character to view available skills/i),
      ).not.toBeInTheDocument();
    });

    it("transitions from skills to placeholder on deselection", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      // Initially shows skills
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();

      // Deselect character
      act(() => {
        useGameStore.getState().actions.selectCharacter(null);
      });

      // Now shows placeholder
      expect(
        screen.getByText(/select a character to view available skills/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/light punch/i)).not.toBeInTheDocument();
    });

    it("transitions between enemy and friendly shows skills for both", () => {
      const friendly = createCharacter({ id: "char1" });
      const enemy = createCharacter({ id: "enemy1", faction: "enemy" });
      useGameStore.getState().actions.initBattle([friendly, enemy]);
      useGameStore.getState().actions.selectCharacter("enemy1");

      render(<InventoryPanel />);

      // Enemy selected - shows skills
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();

      // Switch to friendly
      act(() => {
        useGameStore.getState().actions.selectCharacter("char1");
      });

      // Friendly selected - shows skills
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/select a character to view available skills/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Innate Skill Filtering", () => {
    it("does not show innate skills in inventory", () => {
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move",
        behavior: "towards",
      });
      const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      expect(screen.queryByText(/^move$/i)).not.toBeInTheDocument();
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
    });
  });

  describe("Slot Capacity", () => {
    it("disables assign button when all slots are full", () => {
      const skills = Array.from({ length: 10 }, (_, i) =>
        createSkill({ id: `s${i + 1}` }),
      );
      const char1 = createCharacter({ id: "char1", skills });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      const assignLightPunchButton = screen.getByRole("button", {
        name: /assign light punch/i,
      });
      expect(assignLightPunchButton).toBeInTheDocument();
      expect(assignLightPunchButton).toBeDisabled();

      const assignHeavyPunchButton = screen.getByRole("button", {
        name: /assign heavy punch/i,
      });
      expect(assignHeavyPunchButton).toBeDisabled();
    });

    it("does not change skills when assign action called at capacity", () => {
      const skills = Array.from({ length: 10 }, (_, i) =>
        createSkill({ id: `s${i + 1}` }),
      );
      const char1 = createCharacter({ id: "char1", skills });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      act(() => {
        useGameStore
          .getState()
          .actions.assignSkillToCharacter("char1", "light-punch");
      });

      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      expect(updatedChar?.skills.length).toBe(10);
      expect(updatedChar?.skills.some((s) => s.id === "light-punch")).toBe(
        false,
      );
    });
  });

  describe("Assigned Skill Filtering", () => {
    it("hides assigned skills from inventory", () => {
      const character = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([character]);
      useGameStore
        .getState()
        .actions.assignSkillToCharacter("char1", "light-punch");
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      // Assigned skill is hidden
      expect(screen.queryByText(/light punch/i)).toBeNull();
      // Unassigned skill still visible
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
      // No "Assign Light Punch" button exists
      expect(
        screen.queryByRole("button", { name: /assign light punch/i }),
      ).toBeNull();
    });

    it("shows skill again after unassignment", () => {
      const character = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([character]);
      useGameStore
        .getState()
        .actions.assignSkillToCharacter("char1", "light-punch");
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      // Before removal: Light Punch is NOT visible
      expect(screen.queryByText(/light punch/i)).toBeNull();

      // Remove the skill - get instanceId first
      act(() => {
        const char = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        const lightPunchInstanceId = char?.skills.find(
          (s) => s.id === "light-punch",
        )?.instanceId!;
        useGameStore
          .getState()
          .actions.removeSkillFromCharacter("char1", lightPunchInstanceId);
      });

      // After removal: Light Punch is visible
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /assign light punch/i }),
      ).toBeInTheDocument();
    });

    it("assign button click removes skill from inventory", async () => {
      const user = userEvent.setup();
      const character = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([character]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      // Before click: Light Punch is visible
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();

      // Click the Assign button
      await user.click(
        screen.getByRole("button", { name: /assign light punch/i }),
      );

      // After click: Light Punch disappears
      expect(screen.queryByText(/light punch/i)).toBeNull();
      // Heavy Punch remains visible
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
    });
  });

  describe("Faction Skill Exclusivity", () => {
    it("hides skill assigned to another same-faction character", () => {
      const friendlyA = createCharacter({ id: "f1", faction: "friendly" });
      const friendlyB = createCharacter({ id: "f2", faction: "friendly" });
      useGameStore.getState().actions.initBattle([friendlyA, friendlyB]);
      useGameStore
        .getState()
        .actions.assignSkillToCharacter("f1", "light-punch");
      useGameStore.getState().actions.selectCharacter("f2");

      render(<InventoryPanel />);

      expect(screen.queryByText(/light punch/i)).toBeNull();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /assign light punch/i }),
      ).toBeNull();
    });

    it("shows skill when assigned to a different-faction character", () => {
      const friendlyA = createCharacter({ id: "f1", faction: "friendly" });
      const enemyA = createCharacter({ id: "e1", faction: "enemy" });
      useGameStore.getState().actions.initBattle([friendlyA, enemyA]);
      useGameStore
        .getState()
        .actions.assignSkillToCharacter("e1", "light-punch");
      useGameStore.getState().actions.selectCharacter("f1");

      render(<InventoryPanel />);

      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /assign light punch/i }),
      ).toBeInTheDocument();
    });

    it("skill reappears in inventory when unassigned from same-faction character", () => {
      const friendlyA = createCharacter({ id: "f1", faction: "friendly" });
      const friendlyB = createCharacter({ id: "f2", faction: "friendly" });
      useGameStore.getState().actions.initBattle([friendlyA, friendlyB]);
      useGameStore
        .getState()
        .actions.assignSkillToCharacter("f1", "light-punch");
      useGameStore.getState().actions.selectCharacter("f2");

      render(<InventoryPanel />);

      expect(screen.queryByText(/light punch/i)).toBeNull();

      act(() => {
        const f1 = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "f1");
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        const lightPunchInstanceId = f1?.skills.find(
          (s) => s.id === "light-punch",
        )?.instanceId!;
        useGameStore
          .getState()
          .actions.removeSkillFromCharacter("f1", lightPunchInstanceId);
      });

      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /assign light punch/i }),
      ).toBeInTheDocument();
    });

    it("hides all faction-assigned skills from inventory", () => {
      const friendlyA = createCharacter({ id: "f1", faction: "friendly" });
      const friendlyB = createCharacter({ id: "f2", faction: "friendly" });
      const friendlyC = createCharacter({ id: "f3", faction: "friendly" });
      useGameStore
        .getState()
        .actions.initBattle([friendlyA, friendlyB, friendlyC]);
      useGameStore
        .getState()
        .actions.assignSkillToCharacter("f1", "light-punch");
      useGameStore
        .getState()
        .actions.assignSkillToCharacter("f2", "heavy-punch");
      useGameStore.getState().actions.selectCharacter("f3");

      render(<InventoryPanel />);

      expect(screen.queryByText(/light punch/i)).toBeNull();
      expect(screen.queryByText(/heavy punch/i)).toBeNull();
    });

    it("switching from friendly to enemy shows correct faction-filtered inventory", () => {
      const friendlyA = createCharacter({ id: "f1", faction: "friendly" });
      const enemyA = createCharacter({ id: "e1", faction: "enemy" });
      useGameStore.getState().actions.initBattle([friendlyA, enemyA]);
      useGameStore
        .getState()
        .actions.assignSkillToCharacter("f1", "light-punch");
      useGameStore.getState().actions.selectCharacter("f1");

      render(<InventoryPanel />);

      expect(screen.queryByText(/light punch/i)).toBeNull();

      act(() => {
        useGameStore.getState().actions.selectCharacter("e1");
      });

      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
    });

    it("assign button click removes skill from other same-faction character's inventory view", async () => {
      const user = userEvent.setup();
      const friendlyA = createCharacter({ id: "f1", faction: "friendly" });
      const friendlyB = createCharacter({ id: "f2", faction: "friendly" });
      useGameStore.getState().actions.initBattle([friendlyA, friendlyB]);
      useGameStore.getState().actions.selectCharacter("f1");

      render(<InventoryPanel />);

      await user.click(
        screen.getByRole("button", { name: /assign light punch/i }),
      );

      act(() => {
        useGameStore.getState().actions.selectCharacter("f2");
      });

      expect(screen.queryByText(/light punch/i)).toBeNull();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
    });
  });
});
