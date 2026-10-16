# Development

## Setup

1. Install Bun `1.4.2` (the Fast Validation version).
2. From an isolated checkout, run `node scripts/verify-prebuilt-dependencies.mjs && bun install --frozen-lockfile` without a sibling rust-packages repository or a Rust toolchain.
3. Check git status with `git status --short`.

This repository uses Bun workspaces and Turbo. The root lockfile is `bun.lock`. See `docs/prebuilt-dependencies.md` for the explicit upstream artifact refresh procedure.

## Daily Development

Run the playground app with:

```bash
bun dev
```

The app runs on `http://localhost:8703`. The root `dev` script delegates to `examples/playground`.

For package work, prefer focused commands while iterating:

```bash
bun run --filter @moritzbrantner/<package-name> test
bun run --filter @moritzbrantner/<package-name> check-types
bun run --filter @moritzbrantner/<package-name> build
```

## Verification

Fast meaningful tests:

```bash
bun run test
```

Formatting and lint checks:

```bash
bun run format:check
bun run lint
```

Full local confidence check:

```bash
bun run verify
```

`verify` runs the repo hygiene report, lint, typecheck, tests, and build. CI uses the same core commands through `.github/workflows/ci.yml`.

Use `bun run repo:hygiene` when you only need to inspect git cleanliness, upstream state, untracked files, generated directories, and local-only files.

## Formatting

Oxfmt is the formatter:

```bash
bun run format
```

Use `bun run format:check` before handoff when you do not want to mutate files.

## Release Notes

Publishing is documented in `docs/publishing.md`. In short:

1. Add a Changeset with `bun run changeset` for package changes that should be released.
2. Run `bun run verify`.
3. Merge to `main` and let `.github/workflows/publish-packages.yml` run the established GitHub Packages flow.

Do not run `release:publish` locally unless you intentionally want to publish and have configured `GH_PACKAGES_TOKEN`.

Consumers of these packages never need `GH_PACKAGES_TOKEN`: they pin standalone package repositories by git commit SHA, and `packages/*` subdirectories cannot be git-pinned by bun. See "Installing from another repository" in `docs/publishing.md`.

## Troubleshooting

- If `bun dev` is unavailable, install dependencies with `bun install` first.
- If the playground port is busy, stop the process using port `8703`; the repo standard URL is `http://localhost:8703`.
- If Turbo results look stale, remove ignored `.turbo` cache directories and rerun the focused command.
- If build outputs or reports appear in `git status --short`, run `bun run repo:hygiene` to see whether an ignore rule is missing.
