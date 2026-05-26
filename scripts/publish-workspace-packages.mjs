import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const packagesRoot = path.join(repoRoot, "packages");
const npmUserConfig = path.join(repoRoot, ".npmrc");
const registry = "https://npm.pkg.github.com";
const authToken = process.env.GH_PACKAGES_TOKEN;

function readPackageJson(relativeDir) {
  const packageJsonPath = path.join(repoRoot, relativeDir, "package.json");
  return JSON.parse(readFileSync(packageJsonPath, "utf8"));
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

if (!authToken) {
  console.error("GH_PACKAGES_TOKEN is required to publish packages.");
  process.exit(1);
}

const releasePackages = sortPackagesForPublishing(getWorkspacePackages());

for (const { relativeDir, packageDir, packageJson: pkg } of releasePackages) {
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
      GH_PACKAGES_TOKEN: authToken,
      npm_config_registry: registry,
      npm_config_userconfig: npmUserConfig,
    },
  });
}
