import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@moritzbrantner/collaboration": path.resolve(
        rootDir,
        "packages/collaboration/src/index.ts",
      ),
      "@moritzbrantner/card-games": path.resolve(rootDir, "packages/card-games/src/index.ts"),
      "@moritzbrantner/flat-design": path.resolve(rootDir, "packages/flat-design/src/index.ts"),
      "@moritzbrantner/keyboard": path.resolve(rootDir, "packages/keyboard/src/index.ts"),
      "@moritzbrantner/linguistics-core": path.resolve(
        rootDir,
        "packages/linguistics-core/src/index.ts",
      ),
      "@moritzbrantner/linguistics-learning": path.resolve(
        rootDir,
        "packages/linguistics-learning/src/index.ts",
      ),
      "@moritzbrantner/linguistics-corpus": path.resolve(
        rootDir,
        "packages/linguistics-corpus/src/index.ts",
      ),
      "@moritzbrantner/maps": path.resolve(rootDir, "packages/maps/src/index.ts"),
      "@moritzbrantner/parallel-text": path.resolve(rootDir, "packages/parallel-text/src/index.ts"),
      "@moritzbrantner/speech": path.resolve(rootDir, "packages/speech/src/index.ts"),
      "@moritzbrantner/subtitles": path.resolve(rootDir, "packages/subtitles/src/index.ts"),
      "@moritzbrantner/storytelling": path.resolve(rootDir, "packages/storytelling/src/index.ts"),
      "@moritzbrantner/ui": path.resolve(rootDir, "packages/ui/src/index.ts"),
      "@moritzbrantner/word-prediction": path.resolve(rootDir, "packages/word-prediction/src/index.ts"),
      "@moritzbrantner/word-vectors": path.resolve(rootDir, "packages/word-vectors/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["packages/*/tests/**/*.test.ts", "packages/*/tests/**/*.test.tsx"],
  },
});
