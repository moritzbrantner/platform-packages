import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const registry = "https://npm.pkg.github.com";
const authToken = process.env.GH_PACKAGES_TOKEN;

if (!authToken) {
  console.error("GH_PACKAGES_TOKEN is required to publish packages.");
  process.exit(1);
}

const npmUserConfig = createGitHubPackagesUserConfig();
const publishedVersion = getPublishedVersion(packageJson.name);

if (publishedVersion === packageJson.version) {
  console.log(`Skipping ${packageJson.name}@${packageJson.version}; already published.`);
  process.exit(0);
}

console.log(`Publishing ${packageJson.name}@${packageJson.version}`);
execFileSync("npm", ["publish"], {
  cwd: repoRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    GH_PACKAGES_TOKEN: authToken,
    npm_config_registry: registry,
    npm_config_userconfig: npmUserConfig,
  },
});

function getPublishedVersion(name) {
  try {
    return execFileSync("npm", ["view", name, "version", "--registry", registry], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        GH_PACKAGES_TOKEN: authToken,
        npm_config_userconfig: npmUserConfig,
      },
    }).trim();
  } catch {
    return null;
  }
}

function createGitHubPackagesUserConfig() {
  const tempDir = mkdtempSync(path.join(tmpdir(), "storytelling-npmrc-"));
  const userConfigPath = path.join(tempDir, ".npmrc");

  writeFileSync(
    userConfigPath,
    `@moritzbrantner:registry=${registry}\n//npm.pkg.github.com/:_authToken=${authToken}\n`,
    "utf8",
  );

  return userConfigPath;
}
