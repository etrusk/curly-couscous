/** Tests for TriggerDropdown component - Extracted trigger editing sub-component */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TriggerDropdown } from "./TriggerDropdown";

const defaultProps = {
  skillName: "Light Punch",
  triggerIndex: 0,
  onTriggerChange: vi.fn(),
};

/** Shorthand render with defaultProps and fresh onTriggerChange */
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

describe("TriggerDropdown", () => {
  it("renders trigger type dropdown with correct value", () => {
    renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });
    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("hp_below");
    // All 5 condition type options present
    expect(screen.getByRole("option", { name: "Always" })).toBeInTheDocument();
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
  });

  it("renders value input for value-based triggers", () => {
    renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });
    const input = screen.getByRole("spinbutton");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(50);
  });

  it("hides value input for non-value triggers", () => {
    renderDropdown({ scope: "enemy", condition: "always" });
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("hides value input for cell-targeted trigger", () => {
    renderDropdown({ scope: "enemy", condition: "targeting_me" });
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("calls onTriggerChange when condition changes", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "always",
    });
    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "in_range");
    expect(onTriggerChange).toHaveBeenCalledTimes(1);
    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "enemy",
      condition: "in_range",
      conditionValue: 3,
    });
  });

  it("calls onTriggerChange with hp defaults on condition change", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "always",
    });
    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "hp_below");
    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "enemy",
      condition: "hp_below",
      conditionValue: 50,
    });
  });

  it("calls onTriggerChange when value changes", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "75");
    expect(onTriggerChange).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "self",
        condition: "hp_below",
        conditionValue: 75,
      }),
    );
  });

  it("shows remove button when onRemove provided", () => {
    renderDropdown(
      { scope: "self", condition: "hp_below", conditionValue: 50 },
      { triggerIndex: 1, onRemove: vi.fn() },
    );
    expect(
      screen.getByRole("button", {
        name: "Remove second trigger for Light Punch",
      }),
    ).toBeInTheDocument();
  });

  it("calls onRemove when remove button clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderDropdown(
      { scope: "self", condition: "hp_below", conditionValue: 50 },
      { triggerIndex: 1, onRemove },
    );
    await user.click(
      screen.getByRole("button", {
        name: "Remove second trigger for Light Punch",
      }),
    );
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("hides remove button when onRemove not provided", () => {
    renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });
    expect(
      screen.queryByRole("button", { name: /remove/i }),
    ).not.toBeInTheDocument();
  });

  it("preserves negated field on value change", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
      negated: true,
    });
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "75");
    expect(onTriggerChange).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "self",
        condition: "hp_below",
        conditionValue: 75,
        negated: true,
      }),
    );
  });

  it("handles empty value input without propagating NaN", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    // Clearing produces empty string; parseInt converts to NaN.
    // Handler should guard against this and not call onTriggerChange with NaN.
    expect(onTriggerChange).not.toHaveBeenCalled();
  });

  it("preserves negated field on condition change", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
      negated: true,
    });
    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "in_range");
    expect(onTriggerChange).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "self",
        condition: "in_range",
        conditionValue: 3,
        negated: true,
      }),
    );
  });

  it("unique aria-labels include trigger index", () => {
    const { unmount } = renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });
    expect(
      screen.getByRole("combobox", { name: "Trigger for Light Punch" }),
    ).toBeInTheDocument();
    unmount();

    renderDropdown(
      { scope: "self", condition: "hp_below", conditionValue: 50 },
      { triggerIndex: 1 },
    );
    expect(
      screen.getByRole("combobox", { name: "Second trigger for Light Punch" }),
    ).toBeInTheDocument();
  });

  it("strips value when changing to non-value trigger", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });
    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "always");
    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "self",
      condition: "always",
    });
  });
});

describe("TriggerDropdown - new condition options", () => {
  it("renders all 8 condition options", () => {
    renderDropdown({
      scope: "self",
      condition: "hp_below",
      conditionValue: 50,
    });
    expect(screen.getByRole("option", { name: "Always" })).toBeInTheDocument();
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
  });

  it("does not render value input for channeling condition", () => {
    renderDropdown({ scope: "enemy", condition: "channeling" });
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("does not render value input for idle condition", () => {
    renderDropdown({ scope: "enemy", condition: "idle" });
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("does not render value input for targeting_ally condition", () => {
    renderDropdown({ scope: "enemy", condition: "targeting_ally" });
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("calls onTriggerChange with correct shape when selecting channeling", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "always",
    });
    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "channeling");
    expect(onTriggerChange).toHaveBeenCalledTimes(1);
    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "enemy",
      condition: "channeling",
    });
  });

  it("calls onTriggerChange with correct shape when selecting idle", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "always",
    });
    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "idle");
    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "enemy",
      condition: "idle",
    });
  });

  it("calls onTriggerChange with correct shape when selecting targeting_ally", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "always",
    });
    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "targeting_ally");
    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "enemy",
      condition: "targeting_ally",
    });
  });

  it("preserves negated field when switching to a new condition", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "hp_below",
      conditionValue: 50,
      negated: true,
    });
    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "channeling");
    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "enemy",
      condition: "channeling",
      negated: true,
    });
  });
});
