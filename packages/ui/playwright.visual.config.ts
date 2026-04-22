import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./visual",
  timeout: 45_000,
  workers: 1,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:6007",
    browserName: "chromium",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command:
      "cd ../.. && ./node_modules/.bin/storybook dev -p 6007 --no-open --config-dir packages/ui/.storybook",
    port: 6007,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
