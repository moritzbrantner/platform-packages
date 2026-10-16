import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  verifyFileInventory,
  verifyPrebuiltDependencies,
} from "./verify-prebuilt-dependencies.mjs";
import { assertPublishableDependencies } from "./assert-publishable-dependencies.mjs";

test("prebuilt dependency files match immutable source pins and SHA-256 manifests", () => {
  expect(verifyPrebuiltDependencies().schemaVersion).toBe(1);
});

test("artifact verification detects missing, extra and modified files", () => {
  const root = mkdtempSync(path.join(tmpdir(), "prebuilt-integrity-"));
  try {
    const artifact = path.join(root, "artifact");
    mkdirSync(artifact);
    const filename = path.join(artifact, "wasm.bin");
    const data = "verified WASM bytes";
    const sha256 = createHash("sha256").update(data).digest("hex");
    writeFileSync(filename, data);
    const expected = [{ path: "artifact/wasm.bin", sha256 }];

    expect(() => verifyFileInventory(root, expected)).not.toThrow();

    writeFileSync(filename, data + " corrupted");
    expect(() => verifyFileInventory(root, expected)).toThrow(/SHA-256/);

    rmSync(filename);
    expect(() => verifyFileInventory(root, expected)).toThrow(/inventory/);

    writeFileSync(filename, data);
    writeFileSync(path.join(artifact, "untracked.txt"), "unexpected");
    expect(() => verifyFileInventory(root, expected)).toThrow(/inventory/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a release cannot publish workspace-local runtime dependencies", () => {
  const pkg = {
    name: "@moritzbrantner/remotion",
    dependencies: { "@moritzbrantner/maps": "file:../../vendor/prebuilt/maps" },
  };
  expect(() => assertPublishableDependencies(pkg)).toThrow(
    /@moritzbrantner\/remotion.*@moritzbrantner\/maps.*file:/,
  );
  expect(() =>
    assertPublishableDependencies({
      ...pkg,
      dependencies: { "@moritzbrantner/maps": "^0.1.5" },
    }),
  ).not.toThrow();
});