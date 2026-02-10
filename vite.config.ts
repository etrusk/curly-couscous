import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  css: {
    modules: {
      localsConvention: "camelCase",
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          globals: true,
          environment: "jsdom",
          setupFiles: "./src/test/setup.ts",
          css: true,
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: [
            "node_modules",
            ".archive",
            "src/**/*.browser.test.{ts,tsx}",
          ],
          fakeTimers: {
            shouldAdvanceTime: true,
          },
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          globals: true,
          setupFiles: "./src/test/setup.browser.ts",
          css: true,
          include: ["src/**/*.browser.test.{ts,tsx}"],
          browser: {
            enabled: true,
            provider: playwright({
              launchOptions: {
                executablePath: process.env.CHROMIUM_PATH || undefined,
              },
            }),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
