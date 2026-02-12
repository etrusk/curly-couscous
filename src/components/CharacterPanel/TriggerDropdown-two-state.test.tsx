/**
 * Tests for TriggerDropdown two-state model.
 * Covers: ghost button (unconditional), active trigger controls,
 * x remove button, NOT toggle visibility, default trigger rendering.
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

describe("TriggerDropdown - Two-State Model", () => {
  it("renders ghost button when condition is always", () => {
    renderDropdown({ scope: "enemy", condition: "always" });

    // Ghost button with "+ Condition" text
    const ghostBtn = screen.getByRole("button", {
      name: /add condition for light punch/i,
    });
    expect(ghostBtn).toBeInTheDocument();
    expect(ghostBtn).toHaveTextContent("+ Condition");

    // No condition dropdown
    expect(
      screen.queryByRole("combobox", { name: /trigger for light punch/i }),
    ).not.toBeInTheDocument();

    // No scope dropdown
    expect(
      screen.queryByRole("combobox", {
        name: /trigger scope for light punch/i,
      }),
    ).not.toBeInTheDocument();

    // No NOT toggle
    expect(
      screen.queryByRole("button", { name: /toggle not/i }),
    ).not.toBeInTheDocument();
  });

  it("clicking + Condition activates trigger with default values", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "always",
    });

    await user.click(
      screen.getByRole("button", {
        name: /add condition for light punch/i,
      }),
    );

    expect(onTriggerChange).toHaveBeenCalledTimes(1);
    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "enemy",
      condition: "in_range",
      conditionValue: 1,
    });
  });

  it("active trigger renders condition dropdown with 7 options and no Always", () => {
    renderDropdown({
      scope: "enemy",
      condition: "in_range",
      conditionValue: 3,
    });

    const conditionSelect = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    expect(conditionSelect).toBeInTheDocument();

    // "Always" must NOT be an option
    expect(
      screen.queryByRole("option", { name: "Always" }),
    ).not.toBeInTheDocument();

    // All 7 conditions present
    expect(
      screen.getByRole("option", { name: "In range" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "HP below" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "HP above" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Cell targeted" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Channeling" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Idle" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Targeting ally" }),
    ).toBeInTheDocument();

    // Exactly 7 options
    const options = within(conditionSelect).getAllByRole("option");
    expect(options).toHaveLength(7);
  });

  it("active trigger renders x remove button", () => {
    renderDropdown({
      scope: "enemy",
      condition: "in_range",
      conditionValue: 3,
    });

    expect(
      screen.getByRole("button", {
        name: /remove condition for light punch/i,
      }),
    ).toBeInTheDocument();
  });

  it("clicking x remove returns to ghost button and resets trigger", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });

    await user.click(
      screen.getByRole("button", {
        name: /remove condition for light punch/i,
      }),
    );

    expect(onTriggerChange).toHaveBeenCalledTimes(1);
    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "enemy",
      condition: "always",
    });
    // negated must not be present
    const callArg = onTriggerChange.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;
    expect(callArg?.negated).toBeFalsy();
  });

  it("clicking x remove resets negated flag", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "in_range",
      conditionValue: 3,
      negated: true,
    });

    await user.click(
      screen.getByRole("button", {
        name: /remove condition for light punch/i,
      }),
    );

    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "enemy",
      condition: "always",
    });
    const callArg = onTriggerChange.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;
    expect(callArg?.negated).toBeFalsy();
  });

  it("NOT toggle visible when trigger is active", () => {
    const { unmount } = renderDropdown({
      scope: "enemy",
      condition: "in_range",
      conditionValue: 3,
    });

    // Active trigger: NOT toggle present
    expect(
      screen.getByRole("button", { name: /toggle not.*light punch/i }),
    ).toBeInTheDocument();

    unmount();

    // Ghost button state: NOT toggle absent
    renderDropdown({ scope: "enemy", condition: "always" });
    expect(
      screen.queryByRole("button", { name: /toggle not/i }),
    ).not.toBeInTheDocument();
  });
});

describe("TriggerDropdown - Default Trigger from Registry", () => {
  it("skill with defaultTrigger renders with active trigger controls", () => {
    // Simulates Kick's default trigger: channeling
    renderDropdown({ scope: "enemy", condition: "channeling" });

    // No ghost button
    expect(
      screen.queryByRole("button", { name: /add condition/i }),
    ).not.toBeInTheDocument();

    // Condition dropdown visible with channeling selected
    const conditionSelect = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    expect(conditionSelect).toBeInTheDocument();
    expect(conditionSelect).toHaveValue("channeling");

    // Scope dropdown visible for channeling
    expect(
      screen.getByRole("combobox", {
        name: /trigger scope for light punch/i,
      }),
    ).toBeInTheDocument();
  });
});
