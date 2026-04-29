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
        replacement: path.resolve(workspaceRoot, "packages/card-games/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/data-density$/,
        replacement: path.resolve(workspaceRoot, "packages/data-density/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/flat-design$/,
        replacement: path.resolve(workspaceRoot, "packages/flat-design/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/flat-design\/core$/,
        replacement: path.resolve(workspaceRoot, "packages/flat-design/src/core.ts"),
      },
      {
        find: /^@moritzbrantner\/flat-design\/react$/,
        replacement: path.resolve(workspaceRoot, "packages/flat-design/src/react.tsx"),
      },
      {
        find: /^@moritzbrantner\/maps$/,
        replacement: path.resolve(workspaceRoot, "packages/maps/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/media-editor$/,
        replacement: path.resolve(workspaceRoot, "packages/media-editor/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/linguistics-core$/,
        replacement: path.resolve(workspaceRoot, "packages/linguistics-core/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/linguistics-corpus$/,
        replacement: path.resolve(workspaceRoot, "packages/linguistics-corpus/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/linguistics-learning$/,
        replacement: path.resolve(workspaceRoot, "packages/linguistics-learning/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/parallel-text$/,
        replacement: path.resolve(workspaceRoot, "packages/parallel-text/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/ocr$/,
        replacement: path.resolve(workspaceRoot, "packages/ocr/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/speed-reading$/,
        replacement: path.resolve(workspaceRoot, "packages/speed-reading/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/speed-reading\/core$/,
        replacement: path.resolve(workspaceRoot, "packages/speed-reading/src/core.ts"),
      },
      {
        find: /^@moritzbrantner\/speech$/,
        replacement: path.resolve(workspaceRoot, "packages/speech/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/subtitles$/,
        replacement: path.resolve(workspaceRoot, "packages/subtitles/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/ui$/,
        replacement: path.resolve(workspaceRoot, "packages/ui/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/ui\/bobba$/,
        replacement: path.resolve(workspaceRoot, "packages/ui/src/bobba.ts"),
      },
      {
        find: /^@moritzbrantner\/ui\/atlas$/,
        replacement: path.resolve(workspaceRoot, "packages/ui/src/atlas.ts"),
      },
      {
        find: /^@moritzbrantner\/ui\/studio$/,
        replacement: path.resolve(workspaceRoot, "packages/ui/src/studio.ts"),
      },
      {
        find: /^@moritzbrantner\/ui\/paper$/,
        replacement: path.resolve(workspaceRoot, "packages/ui/src/paper.ts"),
      },
      {
        find: /^@moritzbrantner\/ui\/zleek$/,
        replacement: path.resolve(workspaceRoot, "packages/ui/src/zleek.ts"),
      },
      {
        find: /^@moritzbrantner\/storytelling$/,
        replacement: path.resolve(workspaceRoot, "packages/storytelling/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/storytelling\/three$/,
        replacement: path.resolve(workspaceRoot, "packages/storytelling/src/three.tsx"),
      },
      {
        find: /^@moritzbrantner\/storytelling\/remotion$/,
        replacement: path.resolve(workspaceRoot, "packages/storytelling/src/remotion.tsx"),
      },
      {
        find: /^@moritzbrantner\/three-starters$/,
        replacement: path.resolve(workspaceRoot, "packages/three-starters/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/three-starters\/core$/,
        replacement: path.resolve(workspaceRoot, "packages/three-starters/src/core.ts"),
      },
      {
        find: /^@moritzbrantner\/word-prediction$/,
        replacement: path.resolve(workspaceRoot, "packages/word-prediction/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/word-vectors$/,
        replacement: path.resolve(workspaceRoot, "packages/word-vectors/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/word-vectors\/documents$/,
        replacement: path.resolve(workspaceRoot, "packages/word-vectors/src/documents.ts"),
      },
    ],
  },
  optimizeDeps: {
    exclude: [
      "@moritzbrantner/card-games",
      "@moritzbrantner/data-density",
      "@moritzbrantner/flat-design",
      "@moritzbrantner/flat-design/core",
      "@moritzbrantner/flat-design/react",
      "@moritzbrantner/linguistics-core",
      "@moritzbrantner/linguistics-corpus",
      "@moritzbrantner/linguistics-learning",
      "@moritzbrantner/maps",
      "@moritzbrantner/media-editor",
      "@moritzbrantner/ocr",
      "@moritzbrantner/parallel-text",
      "@moritzbrantner/speed-reading",
      "@moritzbrantner/speech",
      "@moritzbrantner/subtitles",
      "@moritzbrantner/ui",
      "@moritzbrantner/storytelling",
      "@moritzbrantner/three-starters",
      "@moritzbrantner/word-prediction",
      "@moritzbrantner/word-vectors",
    ],
  },
  server: {
    port: 8703,
    strictPort: true,
    fs: {
      allow: [workspaceRoot],
    },
  },
  build: {
    rollupOptions: {
      input: {
        home: path.resolve(rootDir, "index.html"),
        cardGames: path.resolve(rootDir, "card-games.html"),
        dataDensity: path.resolve(rootDir, "data-density.html"),
        flatDesign: path.resolve(rootDir, "flat-design.html"),
        linguisticsCore: path.resolve(rootDir, "linguistics-core.html"),
        linguisticsCorpus: path.resolve(rootDir, "linguistics-corpus.html"),
        linguisticsLearning: path.resolve(rootDir, "linguistics-learning.html"),
        maps: path.resolve(rootDir, "maps.html"),
        mapEdgeCases: path.resolve(rootDir, "map-edge-cases.html"),
        mapsMotion: path.resolve(rootDir, "maps-motion.html"),
        temporalMaps: path.resolve(rootDir, "temporal-maps.html"),
        mediaEditor: path.resolve(rootDir, "media-editor.html"),
        navbars: path.resolve(rootDir, "navbars.html"),
        parallelText: path.resolve(rootDir, "parallel-text.html"),
        speedReading: path.resolve(rootDir, "speed-reading.html"),
        speech: path.resolve(rootDir, "speech.html"),
        subtitles: path.resolve(rootDir, "subtitles.html"),
        ui: path.resolve(rootDir, "ui.html"),
        storytelling: path.resolve(rootDir, "storytelling.html"),
        hexTileNavigation: path.resolve(rootDir, "hex-tile-navigation.html"),
        wordPrediction: path.resolve(rootDir, "word-prediction.html"),
        wordVectors: path.resolve(rootDir, "word-vectors.html"),
      },
      output: {
        manualChunks(id) {
          if (id.includes("@react-three/fiber") || id.includes("/node_modules/three/")) {
            return "three-stage-vendor";
          }
        },
      },
    },
  },
});
