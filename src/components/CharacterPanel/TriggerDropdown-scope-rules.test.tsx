/**
 * Tests for TriggerDropdown condition-scoped scope rules.
 * Covers: per-condition scope dropdown options, scope reset on invalid
 * combination, implied scope for targeting conditions, scope preservation.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TriggerDropdown } from "./TriggerDropdown";

const defaultProps = {
  skillName: "Light Punch",
  triggerIndex: 0,
  onTriggerChange: vi.fn(),
};

function renderDropdown(
  trigger: Parameters<typeof TriggerDropdown>[0]["trigger"],
  overrides?: Partial<Parameters<typeof TriggerDropdown>[0]>,
) {
  const onTriggerChange = vi.fn();
  const result = render(
    <TriggerDropdown
      trigger={trigger}
      {...defaultProps}
      onTriggerChange={onTriggerChange}
      {...overrides}
    />,
  );
  return { onTriggerChange, ...result };
}

describe("TriggerDropdown - Condition-Scoped Scope Rules", () => {
  it("in_range shows scope dropdown with enemy and ally only", () => {
    renderDropdown({
      scope: "enemy",
      condition: "in_range",
      conditionValue: 3,
    });

    const scopeSelect = screen.getByRole("combobox", {
      name: /trigger scope for light punch/i,
    });
    expect(scopeSelect).toBeInTheDocument();

    const options = within(scopeSelect).getAllByRole("option");
    expect(options).toHaveLength(2);

    expect(
      within(scopeSelect).getByRole("option", { name: "Enemy" }),
    ).toBeInTheDocument();
    expect(
      within(scopeSelect).getByRole("option", { name: "Ally" }),
    ).toBeInTheDocument();
    expect(
      within(scopeSelect).queryByRole("option", { name: "Self" }),
    ).not.toBeInTheDocument();
  });

  it("hp_below shows scope dropdown with self, ally, and enemy", () => {
    renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });

    const scopeSelect = screen.getByRole("combobox", {
      name: /trigger scope for light punch/i,
    });
    expect(scopeSelect).toBeInTheDocument();

    const options = within(scopeSelect).getAllByRole("option");
    expect(options).toHaveLength(3);

    expect(
      within(scopeSelect).getByRole("option", { name: "Self" }),
    ).toBeInTheDocument();
    expect(
      within(scopeSelect).getByRole("option", { name: "Ally" }),
    ).toBeInTheDocument();
    expect(
      within(scopeSelect).getByRole("option", { name: "Enemy" }),
    ).toBeInTheDocument();
  });

  it("channeling shows scope dropdown with enemy and ally and qualifier select appears", () => {
    renderDropdown({ scope: "enemy", condition: "channeling" });

    const scopeSelect = screen.getByRole("combobox", {
      name: /trigger scope for light punch/i,
    });
    const options = within(scopeSelect).getAllByRole("option");
    expect(options).toHaveLength(2);

    expect(
      within(scopeSelect).getByRole("option", { name: "Enemy" }),
    ).toBeInTheDocument();
    expect(
      within(scopeSelect).getByRole("option", { name: "Ally" }),
    ).toBeInTheDocument();
    expect(
      within(scopeSelect).queryByRole("option", { name: "Self" }),
    ).not.toBeInTheDocument();

    // Qualifier select renders for channeling
    expect(
      screen.getByLabelText(/qualifier for light punch/i),
    ).toBeInTheDocument();
  });

  it("idle shows scope dropdown with enemy and ally only", () => {
    renderDropdown({ scope: "enemy", condition: "idle" });

    const scopeSelect = screen.getByRole("combobox", {
      name: /trigger scope for light punch/i,
    });
    expect(scopeSelect).toBeInTheDocument();

    expect(
      within(scopeSelect).getByRole("option", { name: "Enemy" }),
    ).toBeInTheDocument();
    expect(
      within(scopeSelect).getByRole("option", { name: "Ally" }),
    ).toBeInTheDocument();
    expect(
      within(scopeSelect).queryByRole("option", { name: "Self" }),
    ).not.toBeInTheDocument();

    const options = within(scopeSelect).getAllByRole("option");
    expect(options).toHaveLength(2);
  });

  it("targeting_me hides scope dropdown and sets implied enemy scope", () => {
    renderDropdown({ scope: "enemy", condition: "targeting_me" });

    // No scope dropdown
    expect(
      screen.queryByRole("combobox", {
        name: /trigger scope for light punch/i,
      }),
    ).not.toBeInTheDocument();

    // Condition dropdown IS present with correct value
    const conditionSelect = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    expect(conditionSelect).toHaveValue("targeting_me");
  });

  it("targeting_ally hides scope dropdown", () => {
    renderDropdown({ scope: "enemy", condition: "targeting_ally" });

    expect(
      screen.queryByRole("combobox", {
        name: /trigger scope for light punch/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("condition change resets scope when current scope is invalid for new condition", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });

    const conditionSelect = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(conditionSelect, "channeling");

    expect(onTriggerChange).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "enemy",
        condition: "channeling",
      }),
    );
  });

  it("condition change to implied-scope condition sets scope to implied value", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });

    const conditionSelect = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(conditionSelect, "targeting_me");

    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "enemy",
      condition: "targeting_me",
    });
  });

  it("condition change preserves scope when still valid", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "in_range",
      conditionValue: 3,
    });

    const conditionSelect = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(conditionSelect, "hp_below");

    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "enemy",
      condition: "hp_below",
      conditionValue: 50,
    });
  });

  it("value input visible for in_range, hp_below, hp_above but hidden for other conditions", () => {
    // Value conditions: in_range, hp_below, hp_above -- spinbutton present
    const valueConditions = [
      { condition: "in_range" as const, conditionValue: 3 },
      { condition: "hp_below" as const, conditionValue: 50 },
      { condition: "hp_above" as const, conditionValue: 75 },
    ];

    for (const { condition, conditionValue } of valueConditions) {
      const { unmount } = renderDropdown({
        scope: "enemy",
        condition,
        conditionValue,
      });
      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
      unmount();
    }

    // Non-value conditions: spinbutton NOT present
    const nonValueConditions = [
      "channeling" as const,
      "idle" as const,
      "targeting_me" as const,
      "targeting_ally" as const,
    ];

    for (const condition of nonValueConditions) {
      const { unmount } = renderDropdown({
        scope: "enemy",
        condition,
      });
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
      unmount();
    }
  });
});
