import path from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      resolve: {
        alias: [
          {
            find: /^@moritzbrantner\/remotion$/,
            replacement: path.resolve(packageRoot, "src/index.tsx"),
          },
        ],
        dedupe: ["react", "react-dom"],
      },
      optimizeDeps: {
        include: ["@remotion/player", "react", "react-dom", "remotion"],
      },
    });
  },
};

export default config;
