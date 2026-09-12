#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUST_PACKAGES_DIR="${RUST_PACKAGES_DIR:-$ROOT_DIR/../rust-packages}"
RUST_PACKAGES_REF="${RUST_PACKAGES_REF:-da291014dd40f62307a9825a9f938ccf18fddcbc}"
RUST_VERSION="${RUST_VERSION:-1.95.0}"
WASM_PACK_VERSION="${WASM_PACK_VERSION:-0.14.0}"
RUST_PACKAGES_URL="https://github.com/moritzbrantner/rust-packages.git"

ensure_compat_checkout() {
  if [[ -e "$RUST_PACKAGES_DIR" && ! -d "$RUST_PACKAGES_DIR/.git" ]]; then
    echo "Expected $RUST_PACKAGES_DIR to be a git checkout." >&2
    exit 1
  fi

  if [[ ! -d "$RUST_PACKAGES_DIR/.git" ]]; then
    mkdir -p "$RUST_PACKAGES_DIR"
    git -C "$RUST_PACKAGES_DIR" init
    git -C "$RUST_PACKAGES_DIR" remote add origin "$RUST_PACKAGES_URL"
  else
    git -C "$RUST_PACKAGES_DIR" remote set-url origin "$RUST_PACKAGES_URL"
  fi

  local current_ref
  current_ref="$(git -C "$RUST_PACKAGES_DIR" rev-parse HEAD 2>/dev/null || true)"

  if [[ "$current_ref" != "$RUST_PACKAGES_REF" ]]; then
    git -C "$RUST_PACKAGES_DIR" fetch --depth=1 origin "$RUST_PACKAGES_REF"
    git -C "$RUST_PACKAGES_DIR" checkout --detach FETCH_HEAD
  fi

  local resolved_ref
  resolved_ref="$(git -C "$RUST_PACKAGES_DIR" rev-parse HEAD)"
  if [[ "$resolved_ref" != "$RUST_PACKAGES_REF" ]]; then
    echo "rust-packages resolved to $resolved_ref, expected $RUST_PACKAGES_REF." >&2
    exit 1
  fi
}

ensure_wasm_tooling() {
  rustup toolchain install "$RUST_VERSION" --profile minimal
  rustup target add --toolchain "$RUST_VERSION" wasm32-unknown-unknown

  local installed_version=""
  if command -v wasm-pack >/dev/null 2>&1; then
    installed_version="$(wasm-pack --version | awk '{print $2}')"
  fi

  if [[ "$installed_version" != "$WASM_PACK_VERSION" ]]; then
    cargo "+$RUST_VERSION" install wasm-pack --locked --version "$WASM_PACK_VERSION" --force
  fi
}

build_compat_packages() {
  local dense_package="$RUST_PACKAGES_DIR/packages/dense-data-wasm"
  local text_package="$RUST_PACKAGES_DIR/packages/text-core-wasm"

  test -f "$dense_package/package.json"
  test -f "$text_package/package.json"

  bash "$dense_package/scripts/build-wasm.sh"
  bash "$text_package/scripts/build-wasm.sh"

  test -f "$dense_package/pkg/moenarch_dense_data_wasm.js"
  test -f "$dense_package/pkg/moenarch_dense_data_wasm_bg.wasm"
  test -f "$text_package/pkg/moenarch_text_core_wasm.js"
  test -f "$text_package/pkg/moenarch_text_core_wasm_bg.wasm"
}

ensure_compat_checkout
ensure_wasm_tooling
build_compat_packages

echo "Prepared compatibility WASM dependencies from rust-packages@$RUST_PACKAGES_REF."
