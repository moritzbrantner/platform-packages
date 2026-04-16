import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = path.resolve(rootDir, "../..");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^@moritzbrantner\/parallel-text$/,
        replacement: path.resolve(
          workspaceRoot,
          "packages/parallel-text/src/index.ts",
        ),
      },
      {
        find: /^@moritzbrantner\/ui$/,
        replacement: path.resolve(workspaceRoot, "packages/ui/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/storytelling$/,
        replacement: path.resolve(
          workspaceRoot,
          "packages/storytelling/src/index.ts",
        ),
      },
      {
        find: /^@moritzbrantner\/word-prediction$/,
        replacement: path.resolve(
          workspaceRoot,
          "packages/word-prediction/src/index.ts",
        ),
      },
    ],
  },
  optimizeDeps: {
    exclude: [
      "@moritzbrantner/parallel-text",
      "@moritzbrantner/ui",
      "@moritzbrantner/storytelling",
      "@moritzbrantner/word-prediction",
    ],
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
  build: {
    rollupOptions: {
      input: {
        home: path.resolve(rootDir, "index.html"),
        parallelText: path.resolve(rootDir, "parallel-text.html"),
        ui: path.resolve(rootDir, "ui.html"),
        storytelling: path.resolve(rootDir, "storytelling.html"),
        wordPrediction: path.resolve(rootDir, "word-prediction.html"),
      },
    },
  },
});
