import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const packageRoot = path.resolve(process.cwd(), "packages/foundation-ui");
const forbiddenPatterns = [
  /from\s+["']next(?:\/|["'])/,
  /from\s+["']next-intl["']/,
  /from\s+["']electron(?:\/|["'])/,
  /from\s+["']@tauri-apps\//,
  /@\/src\//,
  /@\/app\//,
  /@\/components\//,
];

describe("@moritzbrantner/foundation-ui import guard", () => {
  test("does not import framework, native, DB, route-handler, or app-local modules", () => {
    for (const file of readSourceFiles(path.join(packageRoot, "src"))) {
      const source = readFileSync(file, "utf8");

      for (const pattern of forbiddenPatterns) {
        expect(source, `${path.relative(packageRoot, file)} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});

function readSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry: string) => {
    const file = path.join(directory, entry);
    const stats = statSync(file);

    if (stats.isDirectory()) {
      return readSourceFiles(file);
    }

    return /\.(ts|tsx)$/.test(file) ? [file] : [];
  });
}
