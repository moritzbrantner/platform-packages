import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const packagesRoot = path.join(repoRoot, "packages");
const registry = "https://npm.pkg.github.com";
const authToken = process.env.GH_PACKAGES_TOKEN;
const npmUserConfig = createGitHubPackagesUserConfig();
const publishableStatuses = new Set(["scaffold-critical", "release-ready"]);
const releaseInventory = readReleaseInventory();

function readPackageJson(relativeDir) {
  const packageJsonPath = path.join(repoRoot, relativeDir, "package.json");
  return JSON.parse(readFileSync(packageJsonPath, "utf8"));
}

function readReleaseInventory() {
  const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
  return new Map(
    Array.from(
      readme.matchAll(/^\|\s*`(@moritzbrantner\/[^`]+)`\s*\|\s*([^|]+?)\s*\|/gm),
      (match) => [match[1], match[2].trim()],
    ),
  );
}

function getWorkspacePackages() {
  return readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(path.join(packagesRoot, entry.name, "package.json")))
    .map((entry) => {
      const relativeDir = path.join("packages", entry.name);
      return {
        relativeDir,
        packageDir: path.join(repoRoot, relativeDir),
        packageJson: readPackageJson(relativeDir),
      };
    })
    .filter(({ packageJson }) => packageJson.private === false)
    .filter(({ packageJson }) => packageJson.publishConfig?.registry === registry)
    .filter(({ packageJson }) => {
      const status = releaseInventory.get(packageJson.name);

      if (!status) {
        throw new Error(`Missing release inventory status for ${packageJson.name}`);
      }

      return publishableStatuses.has(status);
    })
    .sort((a, b) => a.packageJson.name.localeCompare(b.packageJson.name));
}

function getInternalDependencyNames(packageJson, packageNames) {
  return [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.optionalDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ].filter((name) => packageNames.has(name));
}

function sortPackagesForPublishing(packages) {
  const packageNames = new Set(packages.map(({ packageJson }) => packageJson.name));
  const packagesByName = new Map(packages.map((pkg) => [pkg.packageJson.name, pkg]));
  const sorted = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(pkg) {
    const name = pkg.packageJson.name;

    if (visited.has(name)) {
      return;
    }

    if (visiting.has(name)) {
      throw new Error(`Circular package dependency detected at ${name}`);
    }

    visiting.add(name);

    for (const dependencyName of getInternalDependencyNames(pkg.packageJson, packageNames)) {
      visit(packagesByName.get(dependencyName));
    }

    visiting.delete(name);
    visited.add(name);
    sorted.push(pkg);
  }

  for (const pkg of packages) {
    visit(pkg);
  }

  return sorted;
}

function getPublishedVersion(name, version) {
  try {
    const output = execFileSync(
      "npm",
      ["view", `${name}@${version}`, "version", "--registry", registry, "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        env: packageRegistryEnv(),
      },
    ).trim();
    const publishedVersion = JSON.parse(output);

    if (typeof publishedVersion !== "string") {
      throw new Error(`Unexpected registry response for ${name}@${version}: ${output}`);
    }

    return publishedVersion;
  } catch (error) {
    if (isMissingPackageVersion(error)) {
      return null;
    }

    throw new Error(
      `Failed to query ${name}@${version} from GitHub Packages: ${getCommandErrorText(error)}`,
      { cause: error },
    );
  }
}

function publishPackage(packageDir, pkg) {
  const result = spawnSync("npm", ["publish"], {
    cwd: packageDir,
    encoding: "utf8",
    env: {
      ...packageRegistryEnv(),
      npm_config_registry: registry,
    },
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.error) {
    throw result.error;
  }
  if (result.status === 0) {
    return "published";
  }

  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  if (isDuplicateVersionError(output)) {
    return "already-published";
  }

  throw new Error(`npm publish failed for ${pkg.name}@${pkg.version} with exit ${result.status}.`);
}

function packageRegistryEnv() {
  return {
    ...process.env,
    GH_PACKAGES_TOKEN: authToken,
    npm_config_userconfig: npmUserConfig,
  };
}

function isMissingPackageVersion(error) {
  const output = getCommandErrorText(error);
  return /\bE404\b|404 Not Found|is not in this registry/i.test(output);
}

function isDuplicateVersionError(output) {
  return /cannot publish over the previously published versions|EPUBLISHCONFLICT/i.test(output);
}

function getCommandErrorText(error) {
  const stdout = typeof error?.stdout === "string" ? error.stdout : "";
  const stderr = typeof error?.stderr === "string" ? error.stderr : "";
  const message = error instanceof Error ? error.message : String(error);
  return [stderr.trim(), stdout.trim(), message].filter(Boolean).join("\n");
}

if (!authToken) {
  console.error("GH_PACKAGES_TOKEN is required to publish packages.");
  process.exit(1);
}

const releasePackages = sortPackagesForPublishing(getWorkspacePackages());

for (const { relativeDir, packageDir, packageJson: pkg } of releasePackages) {
  const publishedVersion = getPublishedVersion(pkg.name, pkg.version);

  if (publishedVersion === pkg.version) {
    console.log(`Skipping ${pkg.name}@${pkg.version}; already published.`);
    continue;
  }

  console.log(`Publishing ${pkg.name}@${pkg.version} from ${relativeDir}`);
  const result = publishPackage(packageDir, pkg);

  if (result === "already-published") {
    console.log(
      `Skipping ${pkg.name}@${pkg.version}; registry rejected the upload as an existing version.`,
    );
  }
}

function createGitHubPackagesUserConfig() {
  const tempDir = mkdtempSync(path.join(tmpdir(), "platform-packages-npmrc-"));
  const userConfigPath = path.join(tempDir, ".npmrc");

  writeFileSync(
    userConfigPath,
    `@moritzbrantner:registry=${registry}\n//npm.pkg.github.com/:_authToken=${authToken ?? ""}\n`,
    "utf8",
  );

  return userConfigPath;
}
