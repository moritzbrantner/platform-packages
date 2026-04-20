import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();
const packagesRoot = path.join(repoRoot, "packages");
const foundationPackages = new Set([
  "@moritzbrantner/data-density",
  "@moritzbrantner/extraction-schema",
  "@moritzbrantner/linguistics-core",
  "@moritzbrantner/pipeline-core",
  "@moritzbrantner/tree-structures",
]);

describe("package architecture", () => {
  test("foundation packages do not depend on domain, provider, or rendering packages", () => {
    const packages = readPackages();

    for (const packageJson of packages.values()) {
      if (!foundationPackages.has(packageJson.name)) {
        continue;
      }

      const internalDeps = getInternalDependencies(packageJson);
      expect(internalDeps, `${packageJson.name} has internal dependencies`).toEqual([]);
    }
  });

  test("internal package dependency graph is acyclic", () => {
    const packages = readPackages();
    const graph = new Map(
      Array.from(packages.values(), (packageJson) => [
        packageJson.name,
        getInternalDependencies(packageJson).filter((dep) => packages.has(dep)),
      ]),
    );

    expect(findCycle(graph)).toBeNull();
  });
});

interface PackageJson {
  name: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

function readPackages(): Map<string, PackageJson> {
  const packages = new Map<string, PackageJson>();

  for (const entry of readdirSync(packagesRoot)) {
    const packageJsonPath = path.join(packagesRoot, entry, "package.json");

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
      packages.set(packageJson.name, packageJson);
    } catch {
      continue;
    }
  }

  return packages;
}

function getInternalDependencies(packageJson: PackageJson): string[] {
  return Object.keys({
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
  })
    .filter((dependency) => dependency.startsWith("@moritzbrantner/"))
    .sort((left, right) => left.localeCompare(right));
}

function findCycle(graph: Map<string, string[]>): string[] | null {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function visit(node: string): string[] | null {
    if (visited.has(node)) {
      return null;
    }

    if (visiting.has(node)) {
      return stack.slice(stack.indexOf(node)).concat(node);
    }

    visiting.add(node);
    stack.push(node);

    for (const dependency of graph.get(node) ?? []) {
      const cycle = visit(dependency);

      if (cycle) {
        return cycle;
      }
    }

    stack.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  }

  for (const node of graph.keys()) {
    const cycle = visit(node);

    if (cycle) {
      return cycle;
    }
  }

  return null;
}
