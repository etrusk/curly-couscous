/**
 * Tests for gameStore-helpers exports.
 * Verifies calculatePreBattleStatus is no longer exported.
 */

import { describe, it, expect } from "vitest";
import * as helpers from "./gameStore-helpers";

describe("gameStore-helpers exports", () => {
  it("does not export calculatePreBattleStatus", () => {
    expect("calculatePreBattleStatus" in helpers).toBe(false);
  });

  it("still exports calculateBattleStatus", () => {
    expect("calculateBattleStatus" in helpers).toBe(true);
    expect(typeof helpers.calculateBattleStatus).toBe("function");
  });

  it("still exports findNextAvailablePosition", () => {
    expect("findNextAvailablePosition" in helpers).toBe(true);
    expect(typeof helpers.findNextAvailablePosition).toBe("function");
  });
});
