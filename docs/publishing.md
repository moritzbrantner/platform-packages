# Publishing packages

## First publish

1. Commit and push this repository to `github.com/moritzbrantner/platform-packages`.
2. Confirm your package scope matches the GitHub Packages owner. GitHub Packages only accepts npm scopes owned by the publishing user or organization.
3. If you are not publishing from a `platform` GitHub owner, rename `@moritzbrantner/*` packages to your real GitHub scope before the first release.
4. Prepare or publish the full workspace package set.
5. Open a pull request and merge it into `main`.
6. Wait for the `Publish Private Packages` workflow to finish on `main`.

The current workflow validates and publishes every public package under `packages/*`.

## Later releases

1. Make your package changes.
2. Run `bun run changeset`.
3. Select the packages that changed and choose the appropriate version bump: use `minor` for significant changes and `patch` for minor adjustments.
4. Commit the generated changeset file with your code changes.
5. Merge to `main` and let the publish workflow publish packages whose current version is not already present in GitHub Packages.

The repo can keep publishing unrelated packages, but the maintained template family should treat the scaffold-critical set as the shared contract surface for `scaffold-v2`.

## Release-readiness categories

The README package inventory is the local source of truth for package status:

- `scaffold-critical`: must stay publishable and adoptable by the maintained scaffold family.
- `release-ready`: validated for the first non-scaffold standalone install wave.
- `generated task wrapper`: generated around `@moritzbrantner/huggingface-universal`; publish only after the universal task type map and generated package contract are validated.
- `experimental`: valid workspace packages that are not included in the first publish expansion.

Before publishing new package families:

1. Move each target package to `release-ready` in the README inventory.
2. Confirm package metadata satisfies the requirements below.
3. Confirm package tests cover empty inputs, representative data, and cross-package data flow when the package is an adapter.
4. Add a Changeset for every package being published.
5. Confirm `release:build`, `release:lint`, `release:typecheck`, and `release:test` cover the package.

`release:lint` runs the root lint command, including Oxfmt formatting checks, Oxlint diagnostics, package-level lint tasks, and repository-specific package/style/UI verifiers.

## Package requirements

Every publishable package under `packages/*` must have:

- a scoped lowercase package name owned by the GitHub Packages publisher
- `"private": false`
- a `repository` block pointing to `moritzbrantner/platform-packages`
- `publishConfig.registry` set to `https://npm.pkg.github.com`
- real publishable files referenced by `main`, `exports`, or package-specific config paths

## Installing from another repository

Consumers need an `.npmrc` entry for the package scope you publish under and a token that can read packages:

```ini
@moritzbrantner:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GH_PACKAGES_TOKEN}
```

For the maintained scaffold family, consumer repos should adopt these first:

- `@moritzbrantner/ui`
- `@moritzbrantner/storytelling`
- `@moritzbrantner/oxfmt-config`
- `@moritzbrantner/typescript-config`
