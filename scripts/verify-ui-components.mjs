import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const [, , ...rawDirs] = process.argv;
const targetDirs = rawDirs.length > 0 ? rawDirs : ["packages", "examples/playground/src"];
const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const forbiddenElementPattern = /<button[\s>]/;

function shouldSkipDir(dirPath) {
  const normalized = dirPath.split(path.sep).join("/");
  return (
    normalized.includes("packages/ui/src") ||
    normalized.includes("/node_modules") ||
    normalized.includes("/dist") ||
    normalized.includes("/build") ||
    normalized.includes("/coverage") ||
    normalized.includes("/.turbo") ||
    normalized.includes("/storybook-static") ||
    normalized.includes("/playwright-report") ||
    normalized.includes("/test-results")
  );
}

function visit(targetPath) {
  const stats = statSync(targetPath);

  if (stats.isDirectory()) {
    if (shouldSkipDir(targetPath)) {
      return;
    }

    for (const entry of readdirSync(targetPath)) {
      visit(path.join(targetPath, entry));
    }
    return;
  }

  if (!exts.has(path.extname(targetPath))) {
    return;
  }

  const contents = readFileSync(targetPath, "utf8");

  if (forbiddenElementPattern.test(contents)) {
    console.error(
      `Forbidden native <button> element found in ${targetPath}. Use @moritzbrantner/ui Button instead.`,
    );
    process.exitCode = 1;
  }
}

for (const targetDir of targetDirs) {
  visit(path.resolve(targetDir));
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
