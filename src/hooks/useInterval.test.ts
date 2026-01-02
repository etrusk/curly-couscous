/**
 * Tests for useInterval hook.
 * Following TDD workflow - tests written first.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInterval } from "./useInterval";

describe("useInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call callback at specified interval", () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));

    // Initial state - callback not called yet
    expect(callback).not.toHaveBeenCalled();

    // Advance by interval - callback should fire
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Advance again - callback should fire again
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    // Advance once more to verify repeating
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("should not call callback when delay is null", () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, null));

    // Advance timers - callback should never fire
    vi.advanceTimersByTime(10000);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should cleanup interval on unmount", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    // Fire once to confirm it works
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Unmount and advance - callback should not fire again
    unmount();
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should use latest callback without restarting interval", () => {
    let callbackValue = 0;
    const callback = vi.fn(() => callbackValue++);

    const { rerender } = renderHook(({ cb }) => useInterval(cb, 1000), {
      initialProps: { cb: callback },
    });

    // First interval fires
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callbackValue).toBe(1);

    // Update callback (new function reference)
    const newCallback = vi.fn(() => callbackValue++);
    rerender({ cb: newCallback });

    // Second interval fires - should use new callback
    vi.advanceTimersByTime(1000);
    expect(newCallback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1); // Old callback not called again
    expect(callbackValue).toBe(2);
  });

  it("should restart interval when delay changes (e.g., 500ms → 1000ms)", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: 500 } },
    );

    // Fire at 500ms
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);

    // Change delay to 1000ms
    rerender({ delay: 1000 });

    // Advance 500ms - should NOT fire (timer restarted)
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);

    // Advance another 500ms (1000ms total) - should fire
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should stop interval when delay changes from number to null", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ delay }: { delay: number | null }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 as number | null } },
    );

    // Fire once
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Change delay to null (pause)
    rerender({ delay: null });

    // Advance - should not fire
    vi.advanceTimersByTime(10000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should start interval when delay changes from null to number", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ delay }: { delay: number | null }) => useInterval(callback, delay),
      { initialProps: { delay: null as number | null } },
    );

    // Advance - should not fire (paused)
    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();

    // Resume with 1000ms delay
    rerender({ delay: 1000 });

    // Advance - should now fire
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Verify it continues firing
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
