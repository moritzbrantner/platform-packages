import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(packageRoot, "dist");
const maxTotalBytes = 825 * 1024;
const maxEntryBytes = 35 * 1024;
const maxChunkBytes = 40 * 1024;
const publicEntries = ["index", "bobba", "zleek", "atlas", "studio", "paper", "themes"];
const errors = [];

if (!existsSync(distDir)) {
  console.error("@moritzbrantner/ui build-size verification failed: missing dist/. Run build first.");
  process.exit(1);
}

const jsFiles = listFiles(distDir).filter((filePath) => filePath.endsWith(".js"));
const totalBytes = jsFiles.reduce((sum, filePath) => sum + statSync(filePath).size, 0);

if (totalBytes > maxTotalBytes) {
  errors.push(
    `dist JS total is ${formatBytes(totalBytes)}, above ${formatBytes(maxTotalBytes)} budget`,
  );
}

for (const entryName of publicEntries) {
  const entryPath = path.join(distDir, `${entryName}.js`);

  if (!existsSync(entryPath)) {
    errors.push(`missing public entry dist/${entryName}.js`);
    continue;
  }

  const entryBytes = statSync(entryPath).size;

  if (entryBytes > maxEntryBytes) {
    errors.push(
      `dist/${entryName}.js is ${formatBytes(entryBytes)}, above ${formatBytes(maxEntryBytes)} budget`,
    );
  }
}

for (const filePath of jsFiles) {
  const fileBytes = statSync(filePath).size;

  if (fileBytes > maxChunkBytes) {
    errors.push(
      `${path.relative(distDir, filePath)} is ${formatBytes(fileBytes)}, above ${formatBytes(maxChunkBytes)} chunk budget`,
    );
  }
}

if (errors.length > 0) {
  console.error("@moritzbrantner/ui build-size verification failed:");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

console.log(`@moritzbrantner/ui build-size verified (${formatBytes(totalBytes)} raw JS)`);

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listFiles(filePath);
    }

    return filePath;
  });
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
