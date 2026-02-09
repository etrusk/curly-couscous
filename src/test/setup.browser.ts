import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// No matchMedia mock needed - real browser has native matchMedia

// Cleanup after each test case
afterEach(() => {
  cleanup();
});
