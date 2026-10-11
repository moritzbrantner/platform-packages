#!/usr/bin/env node
// Invoked only after pinned producers have been built with their explicit toolchains.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { artifactRoot, fileDigest, listArtifactFiles, repositoryRoot } from "./verify-prebuilt-dependencies.mjs";

const [rustRoot, mapsRoot] = process.argv.slice(2);
if (!rustRoot || !mapsRoot) throw new Error("Expected built rust-packages and maps directories.");
const pins = JSON.parse(readFileSync(path.join(repositoryRoot, "scripts", "prebuilt-source-pins.json"), "utf8"));
const fields = ["name", "version", "description", "license", "repository", "files", "type",
  "sideEffects", "main", "types", "exports", "dependencies", "peerDependencies", "peerDependenciesMeta"];

rmSync(artifactRoot, { force: true, recursive: true });
mkdirSync(artifactRoot, { recursive: true });

function copyPackage(source, destination, paths) {
  mkdirSync(destination, { recursive: true });
  const manifest = JSON.parse(readFileSync(path.join(source, "package.json"), "utf8"));
  const consumerManifest = Object.fromEntries(
    fields.filter((field) => Object.hasOwn(manifest, field)).map((field) => [field, manifest[field]]),
  );
  // Build-time scripts and dev tools are intentionally absent from precompiled packages.
  writeFileSync(path.join(destination, "package.json"), JSON.stringify(consumerManifest, null, 2) + "\n");
  for (const name of paths) cpSync(path.join(source, name), path.join(destination, name), { recursive: true });
}

copyPackage(path.join(rustRoot, "packages", "dense-data-wasm"),
  path.join(artifactRoot, "dense-data-wasm"), ["index.js", "index.d.ts", "pkg"]);
copyPackage(path.join(rustRoot, "packages", "text-core-wasm"),
  path.join(artifactRoot, "text-core-wasm"), ["index.js", "index.d.ts", "pkg"]);
copyPackage(mapsRoot, path.join(artifactRoot, "maps"),
  ["dist", "styles.css", "styles.full.css", "maplibre.css"]);

const files = listArtifactFiles(artifactRoot).map((name) => ({
  path: name,
  sha256: fileDigest(path.join(artifactRoot, name)),
}));
writeFileSync(path.join(artifactRoot, "provenance.json"),
  JSON.stringify({ schemaVersion: 1, sources: pins, files }, null, 2) + "\n");
