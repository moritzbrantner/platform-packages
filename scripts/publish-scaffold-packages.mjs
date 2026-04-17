import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const registry = "https://npm.pkg.github.com";
const releasePackages = [
  "packages/ui",
  "packages/storytelling",
  "packages/eslint-config",
  "packages/typescript-config",
  "packages/maps",
];

function readPackageJson(relativeDir) {
  const packageJsonPath = path.join(repoRoot, relativeDir, "package.json");
  return JSON.parse(readFileSync(packageJsonPath, "utf8"));
}

function getPublishedVersion(name) {
  try {
    return execFileSync("npm", ["view", name, "version", "--registry", registry], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

for (const relativeDir of releasePackages) {
  const pkg = readPackageJson(relativeDir);
  const packageDir = path.join(repoRoot, relativeDir);
  const publishedVersion = getPublishedVersion(pkg.name);

  if (publishedVersion === pkg.version) {
    console.log(`Skipping ${pkg.name}@${pkg.version}; already published.`);
    continue;
  }

  console.log(`Publishing ${pkg.name}@${pkg.version} from ${relativeDir}`);
  execFileSync("npm", ["publish"], {
    cwd: packageDir,
    stdio: "inherit",
    env: {
      ...process.env,
      npm_config_registry: registry,
    },
  });
}
