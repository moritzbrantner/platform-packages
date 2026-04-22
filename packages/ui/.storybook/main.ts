import path from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
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
          {
            find: /^@moritzbrantner\/ui\/themes$/,
            replacement: path.resolve(packageRoot, "src/themes.tsx"),
          },
          {
            find: /^@moritzbrantner\/ui\/components\/(.+)$/,
            replacement: path.resolve(packageRoot, "src/components/$1.tsx"),
          },
          {
            find: /^@moritzbrantner\/ui\/lib\/cn$/,
            replacement: path.resolve(packageRoot, "src/lib/cn.ts"),
          },
        ],
        dedupe: ["react", "react-dom"],
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
      build: {
        chunkSizeWarningLimit: 2200,
        rolldownOptions: {
          checks: {
            pluginTimings: false,
          },
        },
      },
    });
  },
};

export default config;
