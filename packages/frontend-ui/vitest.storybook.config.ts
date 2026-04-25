import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const packageRoot = fileURLToPath(new URL("./", import.meta.url));
const storybookBin = path.join(packageRoot, "..", "..", "node_modules", ".bin", "storybook");

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(packageRoot, ".storybook"),
            storybookScript: `${storybookBin} dev -p 6007 --no-open`,
            tags: {
              include: ["test"],
            },
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            provider: playwright({}),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
