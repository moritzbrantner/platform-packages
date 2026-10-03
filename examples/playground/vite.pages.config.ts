import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = path.resolve(rootDir, "../..");

export default defineConfig({
  root: rootDir,
  base: "/platform-packages/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^@moritzbrantner\/linguistics-core$/,
        replacement: path.resolve(workspaceRoot, "packages/linguistics-core/src/index.ts"),
      },
      {
        find: /^@moritzbrantner\/parallel-text$/,
        replacement: path.resolve(workspaceRoot, "packages/parallel-text/src/index.ts"),
      },
    ],
  },
  build: {
    outDir: path.resolve(rootDir, "dist-pages"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(rootDir, "parallel-text-pages.html"),
    },
  },
});
