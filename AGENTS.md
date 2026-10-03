# Agent Instructions

## Project Purpose

`platform-packages` is a Bun/Turbo TypeScript monorepo for shared `@moritzbrantner/*` runtime, UI-adjacent, domain, and tooling packages. It also includes a Vite playground used to exercise package behavior locally.

## Key Directories

- `packages/*`: publishable or incubating workspace packages. Keep package changes inside the relevant package unless a shared contract requires root changes.
- `examples/playground`: the main local app. `bun dev` starts this app on `http://localhost:8703`.
- `scripts`: repository automation, package scaffolding, publishing, and custom verification checks.
- `docs`: engineering, publishing, architecture, and package-specific development notes.
- `templates/package`: package scaffold template used by `bun run create:package`.
- `.github/workflows`: CI and GitHub Packages publishing workflows. Preserve workflow command behavior unless intentionally changing CI.

## Standard Commands

- Install dependencies: `bun install`
- Start the local app: `bun dev`
- Local app URL: `http://localhost:8703`
- Fast tests: `bun run test`
- Lint and static repository checks: `bun run lint`
- Typecheck all workspaces: `bun run typecheck`
- Format files: `bun run format`
- Check formatting without mutation: `bun run format:check`
- Build packages and playground: `bun run build`
- Full local verification: `bun run verify`
- Repo hygiene report: `bun run repo:hygiene`
- Scaffold a package: `bun run create:package <name>`

`bun run verify` runs the hygiene report, lint, typecheck, tests, and build. It is the best local equivalent of CI before handing off larger changes.

## Release Workflow

Publishing is established but should stay deliberate. Use `bun run changeset` for package changes that need a release. The GitHub workflow runs `release:lint`, `release:typecheck`, `release:build`, `release:test`, then `release:publish` after merge to `main` or manual dispatch.

Do not add new release automation unless it preserves the existing GitHub Packages flow documented in `docs/publishing.md`.

## Files Agents Should Not Edit Manually

- `node_modules`, `.turbo`, `dist`, `coverage`, `playwright-report`, `test-results`, `storybook-static`, and package tarballs.
- `bun.lock` unless dependencies actually change through `bun install`.
- Package `dist` output unless explicitly validating generated build output outside normal development.
- Generated package skeletons from `templates/package` should be changed at the template or source package level, not by patching generated copies after the fact.

## Generated, Vendored, And Expensive Work

- `dist/**` and package-level `dist` folders are build outputs and ignored.
- `.turbo/**` is local Turbo cache and ignored.
- `node_modules/**` is dependency output and ignored, including package-level installs.
- Playwright artifacts and coverage directories are ignored.
- `bun run build`, `bun run typecheck`, and full `bun run verify` fan out across many workspace packages and can be expensive. For focused work, run the relevant package script first, then run full verification before handoff when risk warrants it.

## Search And Orientation

- Prefer `rg --files` to list files and `rg "<term>"` for text search.
- Use `semble search` for semantic code orientation when naming is unclear, for example: `semble search "package publishing verification workflow"`.
- Useful structural commands:
  - `bun pm ls --all` for dependency graph inspection.
  - `find packages -maxdepth 2 -name package.json -print` for package inventory.
  - `git status --short` before and after edits.

## Repository Standards

- Follow Clean Code principles: clear names, small focused modules, single-purpose functions/components/modules, low duplication, explicit boundaries, and tests or docs for non-obvious behavior.
- Use existing package patterns and root scripts instead of introducing new task runners.
- Keep changes project-local and avoid unrelated refactors.
- Package-authored styling must follow the Tailwind rules in `README.md` and repository verifier scripts.
