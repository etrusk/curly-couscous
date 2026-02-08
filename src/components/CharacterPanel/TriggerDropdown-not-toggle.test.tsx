/**
 * Tests for TriggerDropdown NOT toggle modifier.
 * Extracted from TriggerDropdown.test.tsx to resolve 454-line tech debt.
 * Follows test design document: .tdd/test-designs.md (Phase 3)
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

describe("Gap 3: NOT Toggle Modifier", () => {
  it("NOT toggle visible for non-always triggers", () => {
    render(
      <TriggerDropdown
        trigger={{ scope: "self", condition: "hp_below", conditionValue: 50 }}
        {...defaultProps}
        onTriggerChange={vi.fn()}
      />,
    );
    const notToggle = screen.getByRole("button", {
      name: /toggle not.*light punch/i,
    });
    expect(notToggle).toBeInTheDocument();
    expect(notToggle).toHaveTextContent("NOT");
  });

  it("NOT toggle hidden for always trigger", () => {
    render(
      <TriggerDropdown
        trigger={{ scope: "enemy", condition: "always" }}
        {...defaultProps}
        onTriggerChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /toggle not/i }),
    ).not.toBeInTheDocument();
  });

  it("NOT toggle sets negated to true when clicked", async () => {
    const user = userEvent.setup();
    const onTriggerChange = vi.fn();
    render(
      <TriggerDropdown
        trigger={{ scope: "self", condition: "hp_below", conditionValue: 50 }}
        {...defaultProps}
        onTriggerChange={onTriggerChange}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /toggle not.*light punch/i }),
    );
    expect(onTriggerChange).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "self",
        condition: "hp_below",
        conditionValue: 50,
        negated: true,
      }),
    );
  });

  it("NOT toggle sets negated to false when clicked on negated trigger", async () => {
    const user = userEvent.setup();
    const onTriggerChange = vi.fn();
    render(
      <TriggerDropdown
        trigger={{
          scope: "self",
          condition: "hp_below",
          conditionValue: 50,
          negated: true,
        }}
        {...defaultProps}
        onTriggerChange={onTriggerChange}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /toggle not.*light punch/i }),
    );
    expect(onTriggerChange).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "self",
        condition: "hp_below",
        conditionValue: 50,
        negated: false,
      }),
    );
  });

  it("NOT toggle aria-pressed reflects negated state", () => {
    const { unmount } = render(
      <TriggerDropdown
        trigger={{
          scope: "self",
          condition: "hp_below",
          conditionValue: 50,
          negated: true,
        }}
        {...defaultProps}
        onTriggerChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /toggle not.*light punch/i }),
    ).toHaveAttribute("aria-pressed", "true");
    unmount();

    render(
      <TriggerDropdown
        trigger={{ scope: "self", condition: "hp_below", conditionValue: 50 }}
        {...defaultProps}
        onTriggerChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /toggle not.*light punch/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("switching to always clears negated from callback", async () => {
    const user = userEvent.setup();
    const onTriggerChange = vi.fn();
    render(
      <TriggerDropdown
        trigger={{
          scope: "self",
          condition: "hp_below",
          conditionValue: 50,
          negated: true,
        }}
        {...defaultProps}
        onTriggerChange={onTriggerChange}
      />,
    );
    const select = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(select, "always");
    expect(onTriggerChange).toHaveBeenCalledWith({
      scope: "self",
      condition: "always",
    });
    const callArg = onTriggerChange.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;
    expect(callArg?.negated).toBeFalsy();
  });
});
