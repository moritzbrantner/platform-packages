#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const artifactRoot = path.join(repositoryRoot, "vendor", "prebuilt");

export function fileDigest(filename) {
  return createHash("sha256").update(readFileSync(filename)).digest("hex");
}

export function listArtifactFiles(root) {
  if (!existsSync(root))
    throw new Error("Prebuilt dependencies are missing; run the producer refresh.");
  const visit = (dir, prefix) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.isSymbolicLink())
        throw new Error("Symbolic link in prebuilt artifacts: " + entry.name);
      const name = prefix ? prefix + "/" + entry.name : entry.name;
      if (name === "provenance.json") return [];
      if (entry.isDirectory()) return visit(path.join(dir, entry.name), name);
      if (!entry.isFile()) throw new Error("Unexpected artifact: " + name);
      return [name];
    });
  return visit(root, "").sort();
}

export function verifyFileInventory(root, expectedFiles) {
  const present = listArtifactFiles(root);
  const expected = expectedFiles.map(({ path: name }) => name).sort();
  if (JSON.stringify(present) !== JSON.stringify(expected)) {
    throw new Error("Prebuilt file inventory differs from recorded provenance.");
  }
  for (const entry of expectedFiles) {
    if (!/^[a-z0-9-]+(?:\/[a-zA-Z0-9_.+-]+)+$/.test(entry.path)) {
      throw new Error("Unsafe prebuilt path: " + entry.path);
    }
    const filename = path.join(root, entry.path);
    if (!lstatSync(filename).isFile() || fileDigest(filename) !== entry.sha256) {
      throw new Error("Prebuilt SHA-256 mismatch: " + entry.path);
    }
  }
}

export function verifyPrebuiltDependencies(root = repositoryRoot) {
  const prebuilt = path.join(root, "vendor", "prebuilt");
  const provenance = JSON.parse(readFileSync(path.join(prebuilt, "provenance.json"), "utf8"));
  const pins = JSON.parse(
    readFileSync(path.join(root, "scripts", "prebuilt-source-pins.json"), "utf8"),
  );
  if (
    provenance.schemaVersion !== 1 ||
    JSON.stringify(provenance.sources) !== JSON.stringify(pins)
  ) {
    throw new Error("Prebuilt source identities disagree with pinned upstream revisions.");
  }
  verifyFileInventory(prebuilt, provenance.files);
  const packages = [
    [
      "dense-data-wasm",
      "@moritzbrantner/dense-data-wasm",
      ["index.js", "index.d.ts", "pkg/moenarch_dense_data_wasm_bg.wasm"],
    ],
    [
      "text-core-wasm",
      "@moritzbrantner/text-core-wasm",
      ["index.js", "index.d.ts", "pkg/moenarch_text_core_wasm_bg.wasm"],
    ],
    [
      "maps",
      "@moritzbrantner/maps",
      [
        "dist/index.js",
        "dist/wasm/maps_wasm.js",
        "dist/wasm/maps_wasm_bg.wasm",
        "styles.css",
        "styles.full.css",
        "maplibre.css",
      ],
    ],
  ];
  for (const [dir, name, targets] of packages) {
    const packageDir = path.join(prebuilt, dir);
    const manifest = JSON.parse(readFileSync(path.join(packageDir, "package.json"), "utf8"));
    if (manifest.name !== name || manifest.scripts?.prepare || manifest.scripts?.prepack) {
      throw new Error("Unexpected package identity or install-time build in " + dir);
    }
    for (const target of targets) {
      if (!existsSync(path.join(packageDir, target)))
        throw new Error("Missing prebuilt output: " + dir + "/" + target);
    }
  }
  return provenance;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyPrebuiltDependencies();
  process.stdout.write("Prebuilt identities, exports and SHA-256 inventory verified.\n");
}
