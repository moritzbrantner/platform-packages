import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = path.resolve(rootDir, "../..");
const nodeModules = path.resolve(rootDir, "node_modules");

export default defineConfig({
  root: rootDir,
  base: "/platform-packages/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^@moritzbrantner\/flat-design$/,
        replacement: path.resolve(workspaceRoot, "packages/flat-design/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/ui$/,
        replacement: path.resolve(nodeModules, "@moritzbrantner/ui/dist/index.js"),
      },
      {
        find: /^react$/,
        replacement: path.resolve(nodeModules, "react/index.js"),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: path.resolve(nodeModules, "react/jsx-runtime.js"),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: path.resolve(nodeModules, "react/jsx-dev-runtime.js"),
      },
      {
        find: /^react-dom$/,
        replacement: path.resolve(nodeModules, "react-dom/index.js"),
      },
      {
        find: /^react-dom\/client$/,
        replacement: path.resolve(nodeModules, "react-dom/client.js"),
      },
    ],
  },
  build: {
    outDir: path.resolve(rootDir, "dist"),
    emptyOutDir: true,
  },
});
