/**
 * Tests for TriggerDropdown component - Extracted trigger editing sub-component
 * TDD RED phase: TriggerDropdown.tsx does not exist yet, so all tests will fail.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TriggerDropdown } from "./TriggerDropdown";

describe("TriggerDropdown", () => {
  it("renders trigger type dropdown with correct value", () => {
    render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50 }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={vi.fn()}
      />,
    );

    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("hp_below");

    // All 6 trigger type options present
    expect(screen.getByRole("option", { name: "Always" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Enemy in range" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Ally in range" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "HP below" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Ally HP below" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Cell targeted" }),
    ).toBeInTheDocument();
  });

  it("renders value input for value-based triggers", () => {
    render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50 }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={vi.fn()}
      />,
    );

    const input = screen.getByRole("spinbutton");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(50);
  });

  it("hides value input for non-value triggers", () => {
    render(
      <TriggerDropdown
        trigger={{ type: "always" }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("hides value input for cell-targeted trigger", () => {
    render(
      <TriggerDropdown
        trigger={{ type: "my_cell_targeted_by_enemy" }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("calls onTriggerChange when type changes", async () => {
    const user = userEvent.setup();
    const onTriggerChange = vi.fn();

    render(
      <TriggerDropdown
        trigger={{ type: "always" }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={onTriggerChange}
      />,
    );

    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "enemy_in_range");

    expect(onTriggerChange).toHaveBeenCalledTimes(1);
    expect(onTriggerChange).toHaveBeenCalledWith({
      type: "enemy_in_range",
      value: 3,
    });
  });

  it("calls onTriggerChange with hp defaults on type change", async () => {
    const user = userEvent.setup();
    const onTriggerChange = vi.fn();

    render(
      <TriggerDropdown
        trigger={{ type: "always" }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={onTriggerChange}
      />,
    );

    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "hp_below");

    expect(onTriggerChange).toHaveBeenCalledWith({
      type: "hp_below",
      value: 50,
    });
  });

  it("calls onTriggerChange when value changes", async () => {
    const user = userEvent.setup();
    const onTriggerChange = vi.fn();

    render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50 }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={onTriggerChange}
      />,
    );

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "75");

    expect(onTriggerChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: "hp_below", value: 75 }),
    );
  });

  it("shows remove button when onRemove provided", () => {
    render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50 }}
        skillName="Light Punch"
        triggerIndex={1}
        onTriggerChange={vi.fn()}
        onRemove={vi.fn()}
      />,
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

    render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50 }}
        skillName="Light Punch"
        triggerIndex={1}
        onTriggerChange={vi.fn()}
        onRemove={onRemove}
      />,
    );

    const removeBtn = screen.getByRole("button", {
      name: "Remove second trigger for Light Punch",
    });
    await user.click(removeBtn);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("hides remove button when onRemove not provided", () => {
    render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50 }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /remove/i }),
    ).not.toBeInTheDocument();
  });

  it("preserves negated field on value change", async () => {
    const user = userEvent.setup();
    const onTriggerChange = vi.fn();

    render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50, negated: true }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={onTriggerChange}
      />,
    );

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "75");

    expect(onTriggerChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "hp_below",
        value: 75,
        negated: true,
      }),
    );
  });

  it("handles empty value input without propagating NaN", async () => {
    const user = userEvent.setup();
    const onTriggerChange = vi.fn();

    render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50 }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={onTriggerChange}
      />,
    );

    const input = screen.getByRole("spinbutton");
    await user.clear(input);

    // Clearing the input produces an empty string which parseInt converts to NaN.
    // The handler should guard against this and not call onTriggerChange with NaN.
    expect(onTriggerChange).not.toHaveBeenCalled();
  });

  it("preserves negated field on type change", async () => {
    const user = userEvent.setup();
    const onTriggerChange = vi.fn();

    render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50, negated: true }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={onTriggerChange}
      />,
    );

    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "enemy_in_range");

    expect(onTriggerChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "enemy_in_range",
        value: 3,
        negated: true,
      }),
    );
  });

  it("unique aria-labels include trigger index", () => {
    const { unmount } = render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50 }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Trigger for Light Punch" }),
    ).toBeInTheDocument();
    unmount();

    render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50 }}
        skillName="Light Punch"
        triggerIndex={1}
        onTriggerChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("combobox", {
        name: "Second trigger for Light Punch",
      }),
    ).toBeInTheDocument();
  });

  it("strips value when changing to non-value trigger", async () => {
    const user = userEvent.setup();
    const onTriggerChange = vi.fn();

    render(
      <TriggerDropdown
        trigger={{ type: "hp_below", value: 50 }}
        skillName="Light Punch"
        triggerIndex={0}
        onTriggerChange={onTriggerChange}
      />,
    );

    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "always");

    expect(onTriggerChange).toHaveBeenCalledWith({ type: "always" });
  });
});
