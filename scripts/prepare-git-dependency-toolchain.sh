#!/usr/bin/env bash
# Toolchain needed while bun installs commit-pinned owner packages from git.
# @moritzbrantner/maps builds its WASM runtime in its `prepare` script, which
# requires its pinned Rust toolchain, the wasm32 target and a matching
# wasm-bindgen CLI. Keep these in sync with the pinned maps commit
# (maps rust-toolchain.toml and its wasm-bindgen version).
set -euo pipefail

MAPS_RUST_VERSION="${MAPS_RUST_VERSION:-1.99.0}"
WASM_BINDGEN_VERSION="${WASM_BINDGEN_VERSION:-0.2.129}"

rustup toolchain install "$MAPS_RUST_VERSION" --profile minimal
rustup target add --toolchain "$MAPS_RUST_VERSION" wasm32-unknown-unknown

installed=""
if command -v wasm-bindgen >/dev/null 2>&1; then
  installed="$(wasm-bindgen --version | awk '{print $2}')"
fi
if [[ "$installed" != "$WASM_BINDGEN_VERSION" ]]; then
  cargo "+$MAPS_RUST_VERSION" install wasm-bindgen-cli --locked --version "$WASM_BINDGEN_VERSION" --force
fi

echo "Prepared git dependency toolchain: Rust $MAPS_RUST_VERSION, wasm-bindgen $WASM_BINDGEN_VERSION."
