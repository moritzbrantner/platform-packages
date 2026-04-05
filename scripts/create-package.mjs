#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positionalArgs = args.filter((arg) => arg !== "--dry-run");

if (positionalArgs.length !== 1) {
  console.error("Usage: pnpm create:package <package-name> [--dry-run]");
  process.exit(1);
}

const packageName = positionalArgs[0];

if (!/^[a-z0-9-]+$/.test(packageName)) {
  console.error(
    "Package name must use lowercase letters, numbers, and hyphens only.",
  );
  process.exit(1);
}

const packageDirectory = `packages/${packageName}`;
const packageDir = path.join(rootDir, packageDirectory);

if (existsSync(packageDir)) {
  console.error(`Package directory already exists: ${packageDirectory}`);
  process.exit(1);
}

const { owner, repositoryUrl } = getRepositoryMetadata();
const scope = getPackageScope() ?? owner;
const packageId = `@${scope}/${packageName}`;

const replacements = new Map([
  ["__SCOPE__", scope],
  ["__PACKAGE_NAME__", packageName],
  ["__PACKAGE_DIRECTORY__", packageDirectory],
  ["__REPOSITORY_URL__", repositoryUrl],
]);

const writeOperations = [];

for (const file of getTemplateFiles(path.join(rootDir, "templates/package"))) {
  const relativeFile = normalizeTemplateTarget(
    path.relative(path.join(rootDir, "templates/package"), file),
  );
  const targetFile = path.join(packageDir, relativeFile);
  const contents = applyReplacements(readFileSync(file, "utf8"), replacements);
  writeOperations.push({ type: "write", file: targetFile, contents });
}

const nextWorkspace = updateWorkspaceFile(
  readFileSync(path.join(rootDir, "pnpm-workspace.yaml"), "utf8"),
  packageDirectory,
);
writeOperations.push({
  type: "write",
  file: path.join(rootDir, "pnpm-workspace.yaml"),
  contents: nextWorkspace,
});

const nextVitestConfig = updateVitestAliases(
  readFileSync(path.join(rootDir, "vitest.config.ts"), "utf8"),
  packageId,
  `${packageDirectory}/src/index.ts`,
);
writeOperations.push({
  type: "write",
  file: path.join(rootDir, "vitest.config.ts"),
  contents: nextVitestConfig,
});

const nextRootPackageJson = updateRootPackageJson(
  JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8")),
);
writeOperations.push({
  type: "write",
  file: path.join(rootDir, "package.json"),
  contents: `${JSON.stringify(nextRootPackageJson, null, 2)}\n`,
});

if (dryRun) {
  console.log(`Dry run for ${packageId}`);
  for (const operation of writeOperations) {
    console.log(`- ${path.relative(rootDir, operation.file)}`);
  }
  process.exit(0);
}

mkdirSync(packageDir, { recursive: true });

for (const operation of writeOperations) {
  mkdirSync(path.dirname(operation.file), { recursive: true });
  writeFileSync(operation.file, operation.contents);
}

console.log(`Created ${packageDirectory}`);
console.log(`Registered ${packageId} in pnpm-workspace.yaml and vitest.config.ts`);
console.log("Next step: run pnpm changeset when you are ready to release it.");

function getRepositoryMetadata() {
  let remoteUrl = "";

  try {
    remoteUrl = execFileSync("git", ["config", "--get", "remote.origin.url"], {
      cwd: rootDir,
      encoding: "utf8",
    }).trim();
  } catch {
    console.error("Could not read git remote.origin.url.");
    console.error("Set the git remote first, then run the generator again.");
    process.exit(1);
  }

  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/i);

  if (!match) {
    console.error("Could not infer GitHub owner/repository from git remote.origin.url.");
    console.error("Set the remote first, then run the generator again.");
    process.exit(1);
  }

  const [, owner, repo] = match;

  return {
    owner: owner.toLowerCase(),
    repositoryUrl: `git+https://github.com/${owner}/${repo}.git`,
  };
}

function getPackageScope() {
  const scopes = new Set();
  const packagesDir = path.join(rootDir, "packages");

  for (const entry of readdirSync(packagesDir)) {
    const packageJsonPath = path.join(packagesDir, entry, "package.json");

    if (!existsSync(packageJsonPath) || !statSync(packageJsonPath).isFile()) {
      continue;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const scope = packageJson.name?.match(/^@([^/]+)\//)?.[1];

    if (scope) {
      scopes.add(scope);
    }
  }

  if (scopes.size > 1) {
    console.error(
      `Found multiple package scopes in the repo: ${Array.from(scopes).join(", ")}`,
    );
    console.error("Resolve the scope mismatch before generating a new package.");
    process.exit(1);
  }

  return Array.from(scopes)[0];
}

function getTemplateFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory)) {
    const entryPath = path.join(directory, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      files.push(...getTemplateFiles(entryPath));
      continue;
    }

    files.push(entryPath);
  }

  return files;
}

function normalizeTemplateTarget(relativeFile) {
  return relativeFile.endsWith(".template")
    ? relativeFile.slice(0, -".template".length)
    : relativeFile;
}

function applyReplacements(contents, replacements) {
  let nextContents = contents;

  for (const [token, value] of replacements) {
    nextContents = nextContents.replaceAll(token, value);
  }

  return nextContents;
}

function updateWorkspaceFile(contents, nextPackageDirectory) {
  const entries = contents
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s+(.+?)\s*$/)?.[1])
    .filter(Boolean);

  if (entries.includes(nextPackageDirectory)) {
    return contents;
  }

  entries.push(nextPackageDirectory);
  entries.sort((left, right) => left.localeCompare(right));

  return `packages:\n${entries.map((entry) => `  - ${entry}`).join("\n")}\n`;
}

function updateVitestAliases(contents, packageId, relativeEntryFile) {
  const aliasBlockPattern = /(alias:\s*\{\n)([\s\S]*?)(\s*\},)/m;
  const match = contents.match(aliasBlockPattern);

  if (!match) {
    console.error("Could not find the alias block in vitest.config.ts.");
    process.exit(1);
  }

  const aliases = new Map();
  const aliasLines = match[2]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of aliasLines) {
    const aliasMatch = line.match(
      /^"([^"]+)":\s*path\.resolve\(rootDir,\s*"([^"]+)"\),?$/,
    );

    if (!aliasMatch) {
      console.error(`Could not parse vitest alias line: ${line}`);
      process.exit(1);
    }

    aliases.set(aliasMatch[1], aliasMatch[2]);
  }

  aliases.set(packageId, relativeEntryFile);

  const nextAliasBlock = `${match[1]}${Array.from(aliases.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([alias, target]) =>
        `      "${alias}": path.resolve(rootDir, "${target}"),`,
    )
    .join("\n")}${match[3]}`;

  return contents.replace(aliasBlockPattern, nextAliasBlock);
}

function updateRootPackageJson(packageJson) {
  const nextScripts = {
    ...packageJson.scripts,
    "create:package": "node scripts/create-package.mjs",
  };

  return {
    ...packageJson,
    scripts: nextScripts,
  };
}
