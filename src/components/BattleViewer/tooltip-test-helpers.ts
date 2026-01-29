/**
 * Shared test helpers for tooltip tests.
 * Provides utilities for mocking positioning, viewports, and delays.
 */

// Mock DOMRect for positioning tests
export function createMockRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    top: 100,
    left: 100,
    right: 140,
    bottom: 140,
    width: 40,
    height: 40,
    x: 100,
    y: 100,
    toJSON: () => ({}),
    ...overrides,
  };
}

// Mock viewport dimensions
export function mockViewport(width: number, height: number): void {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: height,
    configurable: true,
  });
}

// Wait for tooltip delay
export async function waitForTooltipDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 110)); // 100ms + buffer
}
