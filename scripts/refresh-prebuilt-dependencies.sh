#!/usr/bin/env bash
# Explicit producer-only refresh. Ordinary Bun/Renovate installs never run this.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
test "$(bun --version)" = "1.4.2" || {
  echo "Prebuilt dependency refresh requires Bun 1.4.2." >&2
  exit 1
}
rust_ref="$(node -p "require('./scripts/prebuilt-source-pins.json').rustPackages.commit")"
maps_ref="$(node -p "require('./scripts/prebuilt-source-pins.json').maps.commit")"
rust_url="$(node -p "require('./scripts/prebuilt-source-pins.json').rustPackages.repository")"
maps_url="$(node -p "require('./scripts/prebuilt-source-pins.json').maps.repository")"
for ref in "$rust_ref" "$maps_ref"; do
  [[ "$ref" =~ ^[[:xdigit:]]{40}$ ]] || { echo "Expected immutable commit SHA: $ref" >&2; exit 1; }
done
test "$rust_url" = "https://github.com/moritzbrantner/rust-packages.git"
test "$maps_url" = "https://github.com/moritzbrantner/maps.git"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Reuse the pinned, verifying compatibility producer, but only in a scratch checkout.
RUST_PACKAGES_DIR="$work/rust-packages" RUST_PACKAGES_REF="$rust_ref" \
  bash scripts/prepare-compat-wasm-deps.sh

mkdir -p "$work/maps"
git -C "$work/maps" init --quiet
git -C "$work/maps" fetch --depth=1 "$maps_url" "$maps_ref"
git -C "$work/maps" checkout --quiet --detach FETCH_HEAD
test "$(git -C "$work/maps" rev-parse HEAD)" = "$maps_ref"

# Rust is a build input here, never an installation requirement for consumers.
bash scripts/prepare-git-dependency-toolchain.sh
(
  cd "$work/maps"
  bun install --frozen-lockfile
  bun run build:package
)

node scripts/write-prebuilt-dependencies.mjs "$work/rust-packages" "$work/maps"
node scripts/verify-prebuilt-dependencies.mjs
echo "Updated pinned artifacts; regenerate bun.lock with bun install."
