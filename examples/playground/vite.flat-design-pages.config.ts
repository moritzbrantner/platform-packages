import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const playgroundRoot = fileURLToPath(new URL(".", import.meta.url));
const pagesRoot = path.resolve(playgroundRoot, "flat-design-pages");
const workspaceRoot = path.resolve(playgroundRoot, "../..");

export default defineConfig({
  root: pagesRoot,
  base: "/platform-packages/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^@moritzbrantner\/flat-design$/,
        replacement: path.resolve(workspaceRoot, "packages/flat-design/src/index.ts"),
      },
    ],
  },
  optimizeDeps: {
    exclude: ["@moritzbrantner/flat-design", "@moritzbrantner/ui"],
  },
  build: {
    outDir: path.resolve(playgroundRoot, "dist/flat-design-pages"),
    emptyOutDir: true,
  },
});
