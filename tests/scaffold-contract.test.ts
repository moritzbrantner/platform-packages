import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test, expect } from "bun:test";

const repoRoot = path.resolve(import.meta.dir, "..");
const packagesRoot = path.join(repoRoot, "packages");

const scaffoldCriticalPackages = [
  {
    dir: "ui",
    name: "@moritzbrantner/ui",
    version: "0.3.0",
    files: ["dist", "styles.css"],
    exports: [".", "./styles.css"],
    scripts: ["build", "lint", "check-types", "test", "build-storybook"],
  },
  {
    dir: "storytelling",
    name: "@moritzbrantner/storytelling",
    version: "0.2.0",
    files: ["dist"],
    exports: [".", "./remotion", "./three"],
    scripts: ["build", "lint", "check-types", "test"],
  },
  {
    dir: "eslint-config",
    name: "@moritzbrantner/eslint-config",
    version: "0.1.0",
    files: ["index.js"],
    exports: ["."],
    scripts: [],
  },
  {
    dir: "typescript-config",
    name: "@moritzbrantner/typescript-config",
    version: "0.1.0",
    files: ["base.json"],
    exports: ["./base.json"],
    scripts: [],
  },
] as const;
const wrapperDependencyAllowlist: Record<string, Record<string, string>> = {
  "question-answering": {
    "@moritzbrantner/huggingface-universal": "workspace:*",
    "@moritzbrantner/linguistics-core": "workspace:*",
    "@moritzbrantner/text-inference": "workspace:*",
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

test("publishing guide prioritizes the scaffold-critical packages for first release", () => {
  const publishingGuide = readFileSync(
    path.join(repoRoot, "docs/publishing.md"),
    "utf8",
  );

  expect(publishingGuide).toContain(
    "Prepare or publish `@moritzbrantner/ui`, `@moritzbrantner/storytelling`, `@moritzbrantner/eslint-config`, and `@moritzbrantner/typescript-config` first",
  );
  expect(publishingGuide).toContain("consumer repos should adopt these first");
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

  const typescriptConfig = JSON.parse(
    readFileSync(path.join(packagesRoot, "typescript-config", "base.json"), "utf8"),
  );

  expect(typescriptConfig.compilerOptions.module).toBe("NodeNext");
  expect(typescriptConfig.compilerOptions.strict).toBe(true);
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
        "@moritzbrantner/huggingface-universal": "workspace:*",
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
