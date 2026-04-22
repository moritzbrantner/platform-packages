import path from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const workspaceRoot = path.resolve(packageRoot, "../..");

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
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
          "@storybook/addon-a11y/preview",
          "@storybook/react-vite",
          "@base-ui/react",
          "@tanstack/react-table",
          "class-variance-authority",
          "clsx",
          "cmdk",
          "date-fns",
          "embla-carousel-react",
          "input-otp",
          "lucide-react",
          "motion/react",
          "next-themes",
          "radix-ui",
          "react",
          "react/jsx-dev-runtime",
          "react-resizable-panels",
          "recharts",
          "sonner",
          "tailwind-merge",
          "vaul",
        ],
      },
    });
  },
};

export default config;
