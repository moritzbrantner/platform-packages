import path from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const workspaceRoot = path.resolve(packageRoot, "../..");

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      plugins: [tailwindcss()],
      resolve: {
        alias: [
          {
            find: /^@moritzbrantner\/ui$/,
            replacement: path.resolve(packageRoot, "src/index.ts"),
          },
        ],
        dedupe: ["react", "react-dom"],
      },
      server: {
        fs: {
          allow: [workspaceRoot],
        },
      },
      optimizeDeps: {
        include: [
          "@base-ui/react",
          "@tanstack/react-table",
          "cmdk",
          "date-fns",
          "embla-carousel-react",
          "input-otp",
          "next-themes",
          "react-resizable-panels",
          "recharts",
          "sonner",
          "vaul",
        ],
      },
    });
  },
};

export default config;
