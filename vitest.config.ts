import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@moritzbrantner/auth-contract": path.resolve(rootDir, "packages/auth-contract/src/index.ts"),
      "@moritzbrantner/card-games": path.resolve(rootDir, "packages/card-games/src/index.ts"),
      "@moritzbrantner/collaboration": path.resolve(rootDir, "packages/collaboration/src/index.ts"),
      "@moritzbrantner/data-density": path.resolve(rootDir, "packages/data-density/src/index.ts"),
      "@moritzbrantner/flat-design/core": path.resolve(
        rootDir,
        "packages/flat-design/src/core-entry.ts",
      ),
      "@moritzbrantner/flat-design/document": path.resolve(
        rootDir,
        "packages/flat-design/src/document-contract.ts",
      ),
      "@moritzbrantner/flat-design/motion": path.resolve(
        rootDir,
        "packages/flat-design/src/motion.ts",
      ),
      "@moritzbrantner/flat-design/playback": path.resolve(
        rootDir,
        "packages/flat-design/src/playback.ts",
      ),
      "@moritzbrantner/flat-design/sampling": path.resolve(
        rootDir,
        "packages/flat-design/src/sampling.ts",
      ),
      "@moritzbrantner/flat-design/schema": path.resolve(
        rootDir,
        "packages/flat-design/src/schema-contract.ts",
      ),
      "@moritzbrantner/flat-design/react": path.resolve(
        rootDir,
        "packages/flat-design/src/react.tsx",
      ),
      "@moritzbrantner/flat-design": path.resolve(rootDir, "packages/flat-design/src/index.ts"),
      "@moritzbrantner/graphs": path.resolve(rootDir, "packages/graphs/src/index.ts"),
      "@moritzbrantner/hexagon-grids": path.resolve(rootDir, "packages/hexagon-grids/src/index.ts"),
      "@moritzbrantner/keyboard": path.resolve(rootDir, "packages/keyboard/src/index.ts"),
      "@moritzbrantner/media-editor": path.resolve(rootDir, "packages/media-editor/src/index.ts"),
      "@moritzbrantner/ocr": path.resolve(rootDir, "packages/ocr/src/index.ts"),
      "@moritzbrantner/parallel-text": path.resolve(rootDir, "packages/parallel-text/src/index.ts"),
      "@moritzbrantner/question-answering": path.resolve(
        rootDir,
        "packages/question-answering/src/index.ts",
      ),
      "@moritzbrantner/speech": path.resolve(rootDir, "packages/speech/src/index.ts"),
      "@moritzbrantner/speech/core": path.resolve(rootDir, "packages/speech/src/core.ts"),
      "@moritzbrantner/speech/react": path.resolve(rootDir, "packages/speech/src/react.ts"),
      "@moritzbrantner/speed-reading": path.resolve(rootDir, "packages/speed-reading/src/index.ts"),
      "@moritzbrantner/storytelling": path.resolve(rootDir, "packages/storytelling/src/index.ts"),
      "@moritzbrantner/subtitles": path.resolve(rootDir, "packages/subtitles/src/index.ts"),
      "@moritzbrantner/tables": path.resolve(rootDir, "packages/tables/src/index.ts"),
      "@moritzbrantner/text-analysis": path.resolve(rootDir, "packages/text-analysis/src/index.ts"),
      "@moritzbrantner/text-inference": path.resolve(
        rootDir,
        "packages/text-inference/src/index.ts",
      ),
      "@moritzbrantner/text-summarization": path.resolve(
        rootDir,
        "packages/text-summarization/src/index.ts",
      ),
      "@moritzbrantner/word-vectors": path.resolve(rootDir, "packages/word-vectors/src/index.ts"),
    },
  },
  server: {
    fs: {
      allow: [rootDir, path.resolve(rootDir, "../rust-packages")],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["packages/*/src/**/*.test.ts", "packages/*/src/**/*.test.tsx"],
  },
});
