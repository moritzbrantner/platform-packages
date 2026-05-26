import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const packageDir = path.join(repoRoot, "packages/data-density");
const packageJsonPath = path.join(packageDir, "package.json");
const publicRegistry = "https://registry.npmjs.org";
const scope = "@moritzbrantner";
const authToken = process.env.NPM_TOKEN;
const extraPublishArgs = process.argv.slice(2);

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (packageJson.publishConfig?.registry !== publicRegistry) {
  fail(
    `${packageJson.name} must set publishConfig.registry to ${publicRegistry} before publishing to npm.`,
  );
}

if (packageJson.publishConfig?.access !== "public") {
  fail(`${packageJson.name} must set publishConfig.access to public before publishing to npm.`);
}

if (!authToken) {
  fail("NPM_TOKEN is required to publish @moritzbrantner/data-density to npm.");
}

const tempDir = mkdtempSync(path.join(os.tmpdir(), "data-density-npm-"));
const npmUserConfig = path.join(tempDir, ".npmrc");

try {
  writeFileSync(
    npmUserConfig,
    [
      `registry=${publicRegistry}`,
      `${scope}:registry=${publicRegistry}`,
      `//registry.npmjs.org/:_authToken=\${NPM_TOKEN}`,
      "",
    ].join("\n"),
  );

  execFileSync(
    "npm",
    [
      "publish",
      ...extraPublishArgs,
      "--access",
      "public",
      "--registry",
      publicRegistry,
      `--${scope}:registry=${publicRegistry}`,
    ],
    {
      cwd: packageDir,
      stdio: "inherit",
      env: {
        ...process.env,
        NPM_CONFIG_USERCONFIG: npmUserConfig,
        npm_config_userconfig: npmUserConfig,
      },
    },
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
