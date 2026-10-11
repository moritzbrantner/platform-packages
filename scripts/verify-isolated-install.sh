#!/usr/bin/env bash
# Reproduce Renovate's checkout: no siblings, no Rust, a real npm dependency edit.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/repository" "$work/deny-rust"
git archive HEAD | tar -xf - -C "$work/repository"

for tool in rustup rustc cargo wasm-pack wasm-bindgen; do
  printf '#!/bin/sh\necho "Unexpected Rust build during isolated install" >&2\nexit 97\n' > "$work/deny-rust/$tool"
  chmod +x "$work/deny-rust/$tool"
done
export PATH="$work/deny-rust:$PATH"
unset RUST_PACKAGES_DIR
cd "$work/repository"
node scripts/verify-prebuilt-dependencies.mjs

node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const manifest = JSON.parse(readFileSync("package.json", "utf8"));
manifest.devDependencies["is-number"] = "7.0.0";
writeFileSync("package.json", JSON.stringify(manifest, null, 2) + "\n");
'

bun install --lockfile-only
bun install --frozen-lockfile
bun run --filter @moritzbrantner/data-density test
bun run --filter @moritzbrantner/linguistics-core test
bun -e '
import { readFileSync } from "node:fs";
import { initSync, MapsFlatRasterRuntime } from "@moritzbrantner/maps/wasm";
initSync({ module: readFileSync("vendor/prebuilt/maps/dist/wasm/maps_wasm_bg.wasm") });
const runtime = new MapsFlatRasterRuntime({
  center: [13.405, 52.52], zoom: 4, width: 800, height: 600,
  source: { minZoom: 0, maxZoom: 18, tileSize: 256 },
});
try {
  const center = runtime.project(13.405, 52.52);
  if (Math.abs(center[0] - 400) > 0.001 || Math.abs(center[1] - 300) > 0.001)
    throw new Error("Prebuilt Maps runtime returned the wrong center");
} finally {
  runtime.free();
}
'
echo "Isolated dependency update, lockfile regeneration, frozen install and WASM smoke passed."
