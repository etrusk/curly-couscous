/**
 * Tests for TriggerDropdown qualifier dropdown.
 * Tests D1-D6: Qualifier selector for channeling trigger condition.
 * Follows pattern from TriggerDropdown.test.tsx and TriggerDropdown-not-toggle.test.tsx.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("TriggerDropdown - Qualifier", () => {
  // D1: Qualifier visible when trigger condition is channeling
  it("qualifier dropdown visible when trigger condition is channeling", () => {
    renderDropdown({ scope: "enemy", condition: "channeling" });

    const qualifierSelect = screen.getByLabelText(/qualifier for light punch/i);
    expect(qualifierSelect).toBeInTheDocument();
    expect(qualifierSelect).toHaveValue("");
  });

  // D2: Qualifier hidden when trigger condition is not channeling
  it("qualifier dropdown hidden when trigger condition is not channeling", () => {
    renderDropdown({
      scope: "enemy",
      condition: "hp_below",
      conditionValue: 50,
    });

    expect(screen.queryByLabelText(/qualifier for/i)).not.toBeInTheDocument();
  });

  // D3: Selecting action qualifier updates trigger
  it("selecting action qualifier calls onTriggerChange with qualifier", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "channeling",
    });

    const qualifierSelect = screen.getByLabelText(/qualifier for light punch/i);
    await user.selectOptions(qualifierSelect, "action:attack");

    expect(onTriggerChange).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "enemy",
        condition: "channeling",
        qualifier: { type: "action", id: "attack" },
      }),
    );
  });

  // D4: Selecting skill qualifier updates trigger with hyphenated ID
  it("selecting skill qualifier calls onTriggerChange with correct qualifier", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "channeling",
    });

    const qualifierSelect = screen.getByLabelText(/qualifier for light punch/i);
    await user.selectOptions(qualifierSelect, "skill:light-punch");

    expect(onTriggerChange).toHaveBeenCalledWith(
      expect.objectContaining({
        qualifier: { type: "skill", id: "light-punch" },
      }),
    );
  });

  // D5: Selecting (any) removes qualifier from trigger
  it("selecting (any) removes qualifier from trigger", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "channeling",
      qualifier: { type: "action", id: "heal" },
    });

    const qualifierSelect = screen.getByLabelText(/qualifier for light punch/i);
    expect(qualifierSelect).toHaveValue("action:heal");

    await user.selectOptions(qualifierSelect, "");

    expect(onTriggerChange).toHaveBeenCalledTimes(1);
    const callArg = onTriggerChange.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;
    expect(callArg).not.toHaveProperty("qualifier");
    expect(callArg?.scope).toBe("enemy");
    expect(callArg?.condition).toBe("channeling");
  });

  // D6: Switching away from channeling clears qualifier
  it("switching away from channeling clears qualifier from callback", async () => {
    const user = userEvent.setup();
    const { onTriggerChange } = renderDropdown({
      scope: "enemy",
      condition: "channeling",
      qualifier: { type: "skill", id: "heal" },
    });

    const conditionSelect = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(conditionSelect, "hp_below");

    expect(onTriggerChange).toHaveBeenCalledTimes(1);
    const callArg = onTriggerChange.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;
    expect(callArg).not.toHaveProperty("qualifier");
    expect(callArg).toEqual({
      scope: "enemy",
      condition: "hp_below",
      conditionValue: 50,
    });
  });
});
