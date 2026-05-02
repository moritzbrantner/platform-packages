import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "tsup";

const packageRoot = fileURLToPath(new URL("./", import.meta.url));
const componentsDir = path.join(packageRoot, "src/components");
const componentEntries = Object.fromEntries(
  readdirSync(componentsDir)
    .filter(
      (fileName) =>
        /\.(ts|tsx)$/.test(fileName) &&
        !fileName.endsWith(".stories.tsx") &&
        !fileName.endsWith(".test.ts") &&
        !fileName.endsWith(".test.tsx"),
    )
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => {
      const entryName = fileName.replace(/\.(ts|tsx)$/, "");

      return [`components/${entryName}`, path.join(componentsDir, fileName)] as const;
    }),
);

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: "src/index.ts",
    zleek: "src/zleek.ts",
    bobba: "src/bobba.ts",
    atlas: "src/atlas.ts",
    studio: "src/studio.ts",
    paper: "src/paper.ts",
    themes: "src/themes.tsx",
    "lib/cn": "src/lib/cn.ts",
    ...componentEntries,
  },
  format: ["esm"],
  outDir: "dist",
  target: "es2022",
});
