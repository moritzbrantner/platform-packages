import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@moritzbrantner/keyboard": path.resolve(rootDir, "packages/keyboard/src/index.ts"),
      "@moritzbrantner/maps": path.resolve(rootDir, "packages/maps/src/index.ts"),
      "@moritzbrantner/parallel-text": path.resolve(rootDir, "packages/parallel-text/src/index.ts"),
      "@moritzbrantner/storytelling": path.resolve(rootDir, "packages/storytelling/src/index.ts"),
      "@moritzbrantner/ui": path.resolve(rootDir, "packages/ui/src/index.ts"),
      "@moritzbrantner/word-prediction": path.resolve(rootDir, "packages/word-prediction/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["packages/*/tests/**/*.test.ts", "packages/*/tests/**/*.test.tsx"],
  },
});
