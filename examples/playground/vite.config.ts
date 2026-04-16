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
        find: /^@moritzbrantner\/card-games$/,
        replacement: path.resolve(
          workspaceRoot,
          "packages/card-games/src/index.ts",
        ),
      },
      {
        find: /^@moritzbrantner\/maps$/,
        replacement: path.resolve(workspaceRoot, "packages/maps/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/parallel-text$/,
        replacement: path.resolve(
          workspaceRoot,
          "packages/parallel-text/src/index.ts",
        ),
      },
      {
        find: /^@moritzbrantner\/speech$/,
        replacement: path.resolve(workspaceRoot, "packages/speech/src/index.ts"),
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
        find: /^@moritzbrantner\/storytelling\/three$/,
        replacement: path.resolve(
          workspaceRoot,
          "packages/storytelling/src/three.tsx",
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
      "@moritzbrantner/card-games",
      "@moritzbrantner/maps",
      "@moritzbrantner/parallel-text",
      "@moritzbrantner/speech",
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
        cardGames: path.resolve(rootDir, "card-games.html"),
        maps: path.resolve(rootDir, "maps.html"),
        mapsMotion: path.resolve(rootDir, "maps-motion.html"),
        parallelText: path.resolve(rootDir, "parallel-text.html"),
        speech: path.resolve(rootDir, "speech.html"),
        ui: path.resolve(rootDir, "ui.html"),
        storytelling: path.resolve(rootDir, "storytelling.html"),
        wordPrediction: path.resolve(rootDir, "word-prediction.html"),
      },
      output: {
        manualChunks(id) {
          if (
            id.includes("@react-three/fiber") ||
            id.includes("/node_modules/three/")
          ) {
            return "three-stage-vendor";
          }
        },
      },
    },
  },
});
