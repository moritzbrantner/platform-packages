import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = path.join(packageRoot, "src", "components");
const srcDir = path.join(packageRoot, "src");
const packageJsonPath = path.join(packageRoot, "package.json");
const indexPath = path.join(packageRoot, "src", "index.ts");
const errors = [];
const interactiveStoryComponents = [
  "annotation-canvas",
  "asset-browser",
  "button",
  "calendar",
  "data-grid",
  "dialog",
  "document-viewer",
  "dropzone",
  "inspector-panel",
  "platform-navbar",
  "query-builder",
  "timeline-editor",
  "workflow-builder",
];
const clientComponentPatterns = [
  /\bReact\.use[A-Z]/,
  /\buse(State|Effect|LayoutEffect|Memo|Callback|Ref|Id|Reducer)\b/,
  /from\s+["'](?:@base-ui\/react|cmdk|embla-carousel-react|input-otp|motion\/react|radix-ui|react-day-picker|react-resizable-panels|sonner|vaul)/,
  /\b(window|document|navigator)\b/,
];

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const indexSource = readFileSync(indexPath, "utf8");
const componentNames = readdirSync(componentsDir)
  .filter((fileName) => fileName.endsWith(".tsx") && !fileName.endsWith(".stories.tsx"))
  .map((fileName) => fileName.replace(/\.tsx$/, ""))
  .sort((left, right) => left.localeCompare(right));

verifyPackageMetadata();
verifyComponentExports();
verifyStoryCoverage();
verifyStoryContracts();
verifyClientDirectives();
verifyConsumerExample();

if (errors.length > 0) {
  console.error("@moritzbrantner/ui design-system verification failed:");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

console.log("@moritzbrantner/ui design-system contract verified");

function verifyPackageMetadata() {
  expectEqual(
    packageJson.name,
    "@moritzbrantner/ui",
    "package name must remain @moritzbrantner/ui",
  );
  expectEqual(packageJson.private, false, "package must stay publishable");
  expectArrayIncludes(packageJson.files, "dist", "package files must include dist");
  expectArrayIncludes(packageJson.files, "styles.css", "package files must include styles.css");
  expectArrayIncludes(packageJson.files, "zleek", "package files must include zleek styles");
  expectArrayIncludes(packageJson.files, "bobba", "package files must include bobba styles");
  expectArrayIncludes(packageJson.files, "atlas", "package files must include atlas styles");
  expectArrayIncludes(packageJson.files, "studio", "package files must include studio styles");
  expectArrayIncludes(packageJson.files, "paper", "package files must include paper styles");
  expectArrayIncludes(packageJson.sideEffects, "*.css", "CSS files must be retained by bundlers");
  expectObject(packageJson.peerDependencies, "peerDependencies must be declared");
  expectObject(packageJson.dependencies, "dependencies must be declared");
  expectObject(packageJson.exports, "exports must be declared");

  expectObjectPath(packageJson, ["peerDependencies", "react"], "react must be a peer dependency");
  expectObjectPath(
    packageJson,
    ["peerDependencies", "react-dom"],
    "react-dom must be a peer dependency",
  );

  expectExport(".", "./dist/index.js", "./dist/index.d.ts");
  expectExport("./zleek", "./dist/zleek.js", "./dist/zleek.d.ts");
  expectExport("./bobba", "./dist/bobba.js", "./dist/bobba.d.ts");
  expectExport("./atlas", "./dist/atlas.js", "./dist/atlas.d.ts");
  expectExport("./studio", "./dist/studio.js", "./dist/studio.d.ts");
  expectExport("./paper", "./dist/paper.js", "./dist/paper.d.ts");
  expectExport("./themes", "./dist/themes.js", "./dist/themes.d.ts");
  expectExport("./lib/cn", "./dist/lib/cn.js", "./dist/lib/cn.d.ts");
  expectExport("./components/*", "./dist/components/*.js", "./dist/components/*.d.ts");

  expectEqual(
    packageJson.exports["./styles.css"],
    "./styles.css",
    "default stylesheet must be exported",
  );
  expectEqual(
    packageJson.exports["./zleek/styles.css"],
    "./zleek/styles.css",
    "zleek stylesheet must be exported",
  );
  expectEqual(
    packageJson.exports["./bobba/styles.css"],
    "./bobba/styles.css",
    "bobba stylesheet must be exported",
  );
  expectEqual(
    packageJson.exports["./atlas/styles.css"],
    "./atlas/styles.css",
    "atlas stylesheet must be exported",
  );
  expectEqual(
    packageJson.exports["./studio/styles.css"],
    "./studio/styles.css",
    "studio stylesheet must be exported",
  );
  expectEqual(
    packageJson.exports["./paper/styles.css"],
    "./paper/styles.css",
    "paper stylesheet must be exported",
  );
}

function verifyComponentExports() {
  for (const componentName of componentNames) {
    const exportLine = `export * from "./components/${componentName}";`;

    if (!indexSource.includes(exportLine)) {
      errors.push(`${componentName}: missing root export in src/index.ts`);
    }
  }
}

function verifyStoryCoverage() {
  const storyFiles = readdirSync(componentsDir).filter((fileName) =>
    fileName.endsWith(".stories.tsx"),
  );
  const coveredComponents = new Set();

  for (const storyFile of storyFiles) {
    const storyName = storyFile.replace(/\.stories\.tsx$/, "");
    const storySource = readFileSync(path.join(componentsDir, storyFile), "utf8");

    if (componentNames.includes(storyName)) {
      coveredComponents.add(storyName);
    }

    for (const match of storySource.matchAll(/from\s+["']\.\/(.+?)["']/g)) {
      coveredComponents.add(match[1]);
    }

    const catalogComponents = storySource.match(
      /const catalogComponents = \[([\s\S]*?)\] as const;/,
    );

    if (catalogComponents) {
      for (const match of catalogComponents[1].matchAll(/["']([^"']+)["']/g)) {
        coveredComponents.add(match[1]);
      }
    }
  }

  for (const componentName of componentNames) {
    if (!coveredComponents.has(componentName)) {
      errors.push(`${componentName}: missing Storybook coverage`);
    }
  }
}

function verifyStoryContracts() {
  const storyFiles = listFiles(srcDir).filter((filePath) => filePath.endsWith(".stories.tsx"));

  for (const storyFile of storyFiles) {
    const relativeStoryFile = path.relative(packageRoot, storyFile);
    const storySource = readFileSync(storyFile, "utf8");

    if (!/tags:\s*\[[^\]]*["']autodocs["'][^\]]*["']test["'][^\]]*\]/s.test(storySource)) {
      errors.push(`${relativeStoryFile}: story meta must include tags ["autodocs", "test"]`);
    }
  }

  for (const componentName of interactiveStoryComponents) {
    const storyPath = path.join(componentsDir, `${componentName}.stories.tsx`);

    if (!existsSync(storyPath)) {
      errors.push(`${componentName}: interactive component must have a dedicated story file`);
      continue;
    }

    const storySource = readFileSync(storyPath, "utf8");

    if (!/\bplay\s*:\s*async\b/.test(storySource)) {
      errors.push(`${componentName}: interactive story must include at least one play function`);
    }
  }
}

function verifyClientDirectives() {
  for (const componentName of componentNames) {
    const componentPath = path.join(componentsDir, `${componentName}.tsx`);
    const componentSource = readFileSync(componentPath, "utf8");

    if (
      !componentSource.startsWith('"use client";') &&
      clientComponentPatterns.some((pattern) => pattern.test(componentSource))
    ) {
      errors.push(`${componentName}: browser or hook-based components must start with "use client";`);
    }
  }
}

function verifyConsumerExample() {
  const appPath = path.join(packageRoot, "examples", "consumer", "src", "App.tsx");

  if (!existsSync(appPath)) {
    errors.push("missing packages/ui/examples/consumer/src/App.tsx");
    return;
  }

  const appSource = readFileSync(appPath, "utf8");

  if (!appSource.includes('import "@moritzbrantner/ui/styles.css";')) {
    errors.push("consumer example must import the default UI stylesheet");
  }

  if (!appSource.includes('from "@moritzbrantner/ui"')) {
    errors.push("consumer example must import components from the public root entrypoint");
  }
}

function expectExport(exportPath, importPath, typesPath) {
  expectEqual(
    packageJson.exports?.[exportPath]?.import,
    importPath,
    `${exportPath} import export must point at ${importPath}`,
  );
  expectEqual(
    packageJson.exports?.[exportPath]?.types,
    typesPath,
    `${exportPath} type export must point at ${typesPath}`,
  );
}

function expectArrayIncludes(value, expected, message) {
  if (!Array.isArray(value) || !value.includes(expected)) {
    errors.push(message);
  }
}

function expectEqual(actual, expected, message) {
  if (actual !== expected) {
    errors.push(message);
  }
}

function expectObject(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(message);
  }
}

function expectObjectPath(source, keys, message) {
  let current = source;

  for (const key of keys) {
    current = current?.[key];
  }

  if (!current) {
    errors.push(message);
  }
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listFiles(filePath);
    }

    return filePath;
  });
}
