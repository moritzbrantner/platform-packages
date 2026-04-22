# SCAFFOLD_ALIGNMENT.md

## Canonical source

The normative scaffold contract lives in `monorepo/SCAFFOLD_V2.md`.

## Repo role

`platform-packages` owns the shared package surface consumed across the maintained scaffold family.

## What is local vs shared

Local:

- package implementation details for the broader package catalog
- release scoping and publication mechanics for shared packages
- playground and package-level package validation

Shared:

- the scaffold-facing package contract used by `monorepo`, `next-template`, `expo-template`, and `electron-template`
- published runtime/tooling packages that maintained repos consume by version

## Update path

1. Land scaffold contract changes in `monorepo`.
2. Update the scaffold-facing package set here with explicit PRs.
3. Publish the affected package versions to GitHub Packages.
4. Adopt those versions from maintained repos through reviewable PRs.

## What must not drift

- scaffold-facing package names and ownership under `@moritzbrantner/*`
- the documented scaffold-critical package set
- published package metadata needed for standalone installs
- release workflow ownership in `.github/workflows/publish-packages.yml`

## Config references

- `docs/publishing.md`
- `.github/workflows/publish-packages.yml`
- `.platform-upgrader.json`: not applicable yet for this non-app repo
