import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@platform/storytelling": path.resolve(rootDir, "packages/storytelling/src/index.ts"),
      "@platform/ui": path.resolve(rootDir, "packages/ui/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["packages/*/tests/**/*.test.ts", "packages/*/tests/**/*.test.tsx"],
  },
});
