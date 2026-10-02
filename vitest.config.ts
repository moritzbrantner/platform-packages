import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

function discoverWorkspaceAliases() {
  const packagesRoot = path.resolve(rootDir, "packages");
  const aliases: Record<string, string> = {};

  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageRoot = path.join(packagesRoot, entry.name);
    const packageJsonPath = path.join(packageRoot, "package.json");

    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { name?: string };
    if (!packageJson.name?.startsWith("@moritzbrantner/")) {
      continue;
    }

    const sourceEntry = ["index.ts", "index.tsx", "index.js", "index.jsx"]
      .map((fileName) => path.join(packageRoot, "src", fileName))
      .find((candidate) => existsSync(candidate));

    if (sourceEntry) {
      aliases[packageJson.name] = sourceEntry;
    }
  }

  return aliases;
}

export default defineConfig({
  resolve: {
    alias: {
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
      "@moritzbrantner/speech/core": path.resolve(rootDir, "packages/speech/src/core.ts"),
      "@moritzbrantner/speech/react": path.resolve(rootDir, "packages/speech/src/react.ts"),
      ...discoverWorkspaceAliases(),
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
