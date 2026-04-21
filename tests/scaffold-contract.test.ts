import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test, expect } from "bun:test";

const repoRoot = path.resolve(import.meta.dir, "..");
const packagesRoot = path.join(repoRoot, "packages");

const scaffoldCriticalPackages = [
  {
    dir: "ui",
    name: "@moritzbrantner/ui",
    version: "0.3.1",
    files: ["dist", "styles.css", "zleek", "bobba"],
    exports: [
      ".",
      "./zleek",
      "./bobba",
      "./themes",
      "./lib/cn",
      "./components/*",
      "./styles.css",
      "./zleek/styles.css",
      "./bobba/styles.css",
    ],
    scripts: ["build", "lint", "check-types", "test", "test:package", "build-storybook"],
  },
  {
    dir: "storytelling",
    name: "@moritzbrantner/storytelling",
    version: "0.3.0",
    files: ["dist"],
    exports: [".", "./remotion", "./three"],
    scripts: ["build", "lint", "check-types", "test"],
  },
  {
    dir: "eslint-config",
    name: "@moritzbrantner/eslint-config",
    version: "0.1.1",
    files: ["index.js"],
    exports: ["."],
    scripts: [],
  },
  {
    dir: "typescript-config",
    name: "@moritzbrantner/typescript-config",
    version: "0.1.1",
    files: ["base.json", "next-app.json", "node.json", "react-library.json"],
    exports: ["./base.json", "./next-app.json", "./node.json", "./react-library.json"],
    scripts: [],
  },
] as const;
const wrapperDependencyAllowlist: Record<string, Record<string, string>> = {
  "question-answering": {
    "@moritzbrantner/huggingface-universal": "^0.1.1",
    "@moritzbrantner/linguistics-core": "^0.1.1",
    "@moritzbrantner/text-inference": "^0.1.1",
  },
};

test("readme marks the scaffold-critical package set explicitly", () => {
  const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");

  expect(readme).toContain("## Scaffold-critical package set");
  expect(readme).toContain("`@moritzbrantner/ui`");
  expect(readme).toContain("`@moritzbrantner/storytelling`");
  expect(readme).toContain("`@moritzbrantner/eslint-config`");
  expect(readme).toContain("`@moritzbrantner/typescript-config`");
  expect(readme).toContain("Everything else in this repository remains valid");
  expect(readme).toContain("Do not move `@repo/auth-contract` or `@repo/upload-playbook`");
});

test("readme package inventory lists every workspace package", () => {
  const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
  const inventoryPackages = Array.from(
    readme.matchAll(/^\| `(@moritzbrantner\/[^`]+)` \| ([^|]+) \|/gm),
    (match) => ({
      name: match[1]!,
      status: match[2]!.trim(),
    }),
  );
  const workspacePackages = readdirSync(packagesRoot)
    .filter((packageDir) => existsSync(path.join(packagesRoot, packageDir, "package.json")))
    .map((packageDir) => readPackageJson(packageDir).name)
    .sort((left, right) => left.localeCompare(right));

  expect(
    inventoryPackages.map((entry) => entry.name).sort((left, right) => left.localeCompare(right)),
  ).toEqual(workspacePackages);
  expect(new Set(inventoryPackages.map((entry) => entry.status))).toEqual(
    new Set([
      "experimental",
      "generated task wrapper",
      "release-ready",
      "scaffold-critical",
    ]),
  );
});

test("publishing guide describes the full workspace release path", () => {
  const publishingGuide = readFileSync(
    path.join(repoRoot, "docs/publishing.md"),
    "utf8",
  );

  expect(publishingGuide).toContain(
    "Prepare or publish the full workspace package set",
  );
  expect(publishingGuide).toContain("validates and publishes every public package");
  expect(publishingGuide).toContain("consumer repos should adopt these first");
  expect(publishingGuide).toContain("Release-readiness categories");
});

test("scaffold-critical packages keep their public package contracts", () => {
  for (const expectedPackage of scaffoldCriticalPackages) {
    const packageJson = readPackageJson(expectedPackage.dir);

    expect(packageJson.name).toBe(expectedPackage.name);
    expect(packageJson.version).toBe(expectedPackage.version);
    expect(packageJson.private).not.toBe(true);
    expect(packageJson.files).toEqual(expectedPackage.files);
    expect(exportKeys(packageJson.exports)).toEqual(expectedPackage.exports);

    for (const scriptName of expectedPackage.scripts) {
      expect(typeof packageJson.scripts?.[scriptName]).toBe("string");
    }
  }
});

test("config packages import and parse from their package roots", async () => {
  const eslintConfig = await import(
    `file://${path.join(packagesRoot, "eslint-config", "index.js")}`
  );

  expect(Array.isArray(eslintConfig.default)).toBe(true);
  expect(Array.isArray(eslintConfig.base)).toBe(true);
  expect(Array.isArray(eslintConfig.typescript)).toBe(true);
  expect(Array.isArray(eslintConfig.react)).toBe(true);
  expect(Array.isArray(eslintConfig.next)).toBe(true);
  expect(Array.isArray(eslintConfig.library)).toBe(true);
  expect(eslintConfig.default).toBe(eslintConfig.library);

  const typescriptConfigs = Object.fromEntries(
    ["base.json", "react-library.json", "next-app.json", "node.json"].map((configFile) => [
      configFile,
      JSON.parse(
        readFileSync(path.join(packagesRoot, "typescript-config", configFile), "utf8"),
      ),
    ]),
  );

  expect(typescriptConfigs["base.json"].compilerOptions.module).toBe("NodeNext");
  expect(typescriptConfigs["base.json"].compilerOptions.strict).toBe(true);
  expect(typescriptConfigs["react-library.json"].compilerOptions.jsx).toBe("react-jsx");
  expect(typescriptConfigs["next-app.json"].compilerOptions.plugins).toEqual([
    { name: "next" },
  ]);
  expect(typescriptConfigs["node.json"].compilerOptions.types).toContain("node");
});

test("publishable package metadata exposes matching build artifacts", () => {
  for (const packageDir of readdirSync(packagesRoot).sort()) {
    const packageJsonPath = path.join(packagesRoot, packageDir, "package.json");

    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = readPackageJson(packageDir);

    if (packageJson.private === true) {
      continue;
    }

    const srcDir = path.join(packagesRoot, packageDir, "src");
    const hasSource = existsSync(srcDir);
    const exports = exportKeys(packageJson.exports);

    if (hasSource) {
      expect(exports, `${packageJson.name} root export`).toContain(".");
      expect(packageJson.files, `${packageJson.name} files`).toContain("dist");
    }

    for (const entrypoint of ["core", "react"] as const) {
      if (
        existsSync(path.join(srcDir, `${entrypoint}.ts`)) ||
        existsSync(path.join(srcDir, `${entrypoint}.tsx`))
      ) {
        expect(exports, `${packageJson.name} ${entrypoint} export`).toContain(`./${entrypoint}`);
      }
    }

    if (packageJson.files?.includes("styles.css")) {
      expect(exports, `${packageJson.name} style export`).toContain("./styles.css");
      expect(packageJson.sideEffects, `${packageJson.name} CSS side effects`).toEqual(["*.css"]);
    }
  }
});

test("release-ready package inventory entries have publishable metadata", () => {
  const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
  const releaseReadyPackageNames = Array.from(
    readme.matchAll(/^\| `@moritzbrantner\/([^`]+)` \| (scaffold-critical|release-ready) \|/gm),
    (match) => match[1]!,
  );

  expect(releaseReadyPackageNames).toContain("ui");
  expect(releaseReadyPackageNames).toContain("maps");

  for (const packageDir of releaseReadyPackageNames) {
    const packageJson = readPackageJson(packageDir);

    expect(packageJson.private, `${packageJson.name} private`).toBe(false);
    expect(packageJson.repository?.directory, `${packageJson.name} repository directory`).toBe(
      `packages/${packageDir}`,
    );
    expect(packageJson.publishConfig?.registry, `${packageJson.name} registry`).toBe(
      "https://npm.pkg.github.com",
    );
  }
});

test("Hugging Face task wrappers follow the generated package contract", () => {
  const universalSource = readFileSync(
    path.join(packagesRoot, "huggingface-universal", "src", "index.ts"),
    "utf8",
  );
  const tasks = Array.from(
    universalSource.matchAll(/task:\s*"([^"]+)"/g),
    (match) => match[1]!,
  );

  expect(tasks).toHaveLength(47);

  for (const task of tasks) {
    const packageDir = path.join(packagesRoot, task);
    const packageJson = readPackageJson(task);
    const source = readFileSync(path.join(packageDir, "src", "index.ts"), "utf8");
    const pascalName = toPascalTaskName(task);

    expect(existsSync(packageDir), `${task} package directory`).toBe(true);
    expect(packageJson.name).toBe(`@moritzbrantner/${task}`);
    expect(packageJson.dependencies).toEqual(
      wrapperDependencyAllowlist[task] ?? {
        "@moritzbrantner/huggingface-universal": "^0.1.1",
      },
    );
    expect(source).toContain(`getHuggingFaceTaskDescriptor("${task}")`);
    expect(source).toContain(`createHuggingFaceTaskPackage("${task}")`);
    expect(source).toContain(
      task === "question-answering"
        ? `create${pascalName}UniversalPipeline`
        : `create${pascalName}Pipeline`,
    );
    if (!wrapperDependencyAllowlist[task]) {
      expect(source).toContain("export const createPipeline");
    }
    expect(source).toContain("export const createModelReference");
    expect(source).toContain(`export type ${pascalName}Input`);
    expect(source).toContain(`export type ${pascalName}Output`);
    expect(source).toContain(`export type ${pascalName}Request`);
    expect(source).toContain(`export type ${pascalName}Result`);
  }
});

function readPackageJson(packageDir: string) {
  return JSON.parse(
    readFileSync(path.join(packagesRoot, packageDir, "package.json"), "utf8"),
  ) as {
    dependencies?: Record<string, string>;
    exports?: unknown;
    files?: string[];
    name: string;
    private?: boolean;
    scripts?: Record<string, string>;
    sideEffects?: string[];
    version: string;
    publishConfig?: {
      registry?: string;
    };
    repository?: {
      directory?: string;
      type?: string;
      url?: string;
    };
  };
}

function exportKeys(exportsField: unknown): string[] {
  if (typeof exportsField === "string") {
    return ["."];
  }

  if (exportsField && typeof exportsField === "object") {
    return Object.keys(exportsField);
  }

  return [];
}

function toPascalTaskName(task: string): string {
  return task
    .split("-")
    .map((part) => (part === "3d" ? "3D" : `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`))
    .join("");
}
