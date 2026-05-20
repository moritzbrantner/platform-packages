# Development

## Setup

1. Install Bun `1.3.12`.
2. Install dependencies with `bun install`.
3. Check the worktree with `git status --short`.

The repository uses Bun workspaces and Turbo. The root lockfile is `bun.lock`.

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

## Troubleshooting

- If `bun dev` is unavailable, install dependencies with `bun install` first.
- If the playground port is busy, stop the process using port `8703`; the repo standard URL is `http://localhost:8703`.
- If Turbo results look stale, remove ignored `.turbo` cache directories and rerun the focused command.
- If build outputs or reports appear in `git status --short`, run `bun run repo:hygiene` to see whether an ignore rule is missing.
