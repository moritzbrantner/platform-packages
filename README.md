# Private Platform Packages Scaffold

Copy this folder into a dedicated private repository when you are ready to publish shared packages for multiple app repositories.

## What this scaffold includes
- `pnpm` workspace root
- Turbo pipeline
- Changesets configuration
- private GitHub Packages npm publishing workflow
- starter package manifests for UI and config packages
- reusable package generator
- consumer `.npmrc` example

## First setup
1. Create a new private repository, for example `platform-packages`.
2. Copy this folder's contents to the new repository root.
3. If you publish from a different GitHub owner, replace every `moritzbrantner` scope/reference with your lowercase GitHub owner.
4. Install dependencies with `pnpm install`.
5. Add real package code under `packages/*`.
6. Commit a changeset for each released change.
7. Publish from GitHub Actions after merging to `main`.

## Create a new package
Run `pnpm create:package my-package` to scaffold a new publishable package under `packages/my-package`.

## Release flow
See `docs/publishing.md` for the exact first-publish and follow-up release steps.
