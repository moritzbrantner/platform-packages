# Publishing packages

## First publish

1. Commit and push this repository to `github.com/moritzbrantner/platform-packages`.
2. Confirm your package scope matches the GitHub Packages owner. GitHub Packages only accepts npm scopes owned by the publishing user or organization.
3. If you are not publishing from a `platform` GitHub owner, rename `@moritzbrantner/*` packages to your real GitHub scope before the first release.
4. Prepare or publish the full workspace package set.
5. Open a pull request and merge it into `main`.
6. Wait for the `Publish Private Packages` workflow to finish on `main`.

The current workflow validates every public package under `packages/*`, but the GitHub Packages publish step only releases packages marked `scaffold-critical` or `release-ready` in the README inventory. Experimental packages stay in the normal lint, typecheck, test, and build gates without being published accidentally. `@moritzbrantner/ui` is published from the standalone `moritzbrantner/ui` repository and is consumed here as an external package.

## Later releases

1. Make your package changes.
2. Run `bun run changeset`.
3. Select the packages that changed and choose the appropriate version bump: use `minor` for significant changes and `patch` for minor adjustments.
4. Commit the generated changeset file with your code changes.
5. Merge to `main` and let the publish workflow publish eligible packages whose current version is not already present in GitHub Packages.

The repo can keep publishing unrelated packages, but the maintained template family should treat the scaffold-critical set as the shared contract surface for `scaffold-v2`. `@moritzbrantner/ui` is part of that contract, but its release workflow lives in the standalone UI repository.

## Public npm packages

GitHub Packages remains the default private package workflow for this repository. Public npm packages must opt into npmjs with package-local metadata:

- `publishConfig.registry` set to `https://registry.npmjs.org`
- `publishConfig.access` set to `public`
- an npmjs `NPM_TOKEN`, not `GH_PACKAGES_TOKEN`
- npm publish commands that override the repository `.npmrc`, because the repo-level scope config points `@moritzbrantner/*` at GitHub Packages

`@moritzbrantner/data-density` is the first local package candidate for public npm. Publish it with:

```sh
bun run publish:npm:data-density
```

That script publishes from `packages/data-density` using a temporary npmjs-only user config and the public npm registry. Before publishing, confirm the target version is still absent from npm:

```sh
curl -s -o /dev/null -w "%{http_code}\n" \
  https://registry.npmjs.org/@moritzbrantner%2fdata-density
```

## Release-readiness categories

The README package inventory is the local source of truth for package status:

- `scaffold-critical`: must stay publishable and adoptable by the maintained scaffold family.
- `release-ready`: validated for the first non-scaffold standalone install wave.
- `experimental`: valid workspace packages that are not included in the first publish expansion.

Thin Hugging Face task wrappers are not published from this repository. Use
official Hugging Face JavaScript packages directly for raw model invocation:
`@huggingface/inference` for hosted/provider-backed inference and
`@huggingface/transformers` for browser or local JavaScript inference.

Before publishing new package families:

1. Move each target package to `release-ready` in the README inventory.
2. Confirm package metadata satisfies the requirements below.
3. Confirm package tests cover empty inputs, representative data, and cross-package data flow when the package is an adapter.
4. Add a Changeset for every package being published.
5. Confirm `release:build`, `release:lint`, `release:typecheck`, and `release:test` cover the package.

`release:lint` runs the root lint command, including Oxfmt formatting checks, Oxlint diagnostics, package-level lint tasks, and repository-specific package/style/UI verifiers.

## Package requirements

Every publishable package under `packages/*` must have:

- a scoped lowercase package name owned by the target registry publisher
- `"private": false`
- a `repository` block pointing to `moritzbrantner/platform-packages`
- `publishConfig.registry` set to the package's target registry
- `publishConfig.access` matching the package's target visibility
- real publishable files referenced by `main`, `exports`, or package-specific config paths

## Installing from another repository

Consumers do not install from GitHub Packages and need no registry token, `.npmrc` scope entry or `GH_PACKAGES_TOKEN` (owner decision 2026-10-03). Owner packages are consumed as git source pins on a full commit SHA of the package's standalone repository:

```json
{
  "dependencies": {
    "@moritzbrantner/ui": "git+https://github.com/moritzbrantner/ui.git#<full-40-char-sha>"
  },
  "trustedDependencies": ["@moritzbrantner/ui"]
}
```

`trustedDependencies` lets bun run the package's `prepare` script, which builds it after install. Defining `trustedDependencies` replaces bun's built-in default allowlist, so add the pinned package to the consumer's existing list and keep every other package whose lifecycle scripts it still needs (for example `esbuild` or `sharp`). The producer repository needs a committed `bun.lock` and a `prepare` script of the form `bun install --frozen-lockfile --ignore-scripts && bun run build`.

Packages that live under `platform-packages/packages/*` cannot be pinned this way: bun cannot install a subdirectory of a git repository. A consumer that needs one of them must move to that package's standalone repository (for example `moritzbrantner/ui` instead of the legacy `packages/ui` 0.x line), or the package must first be extracted into its own repository. The GitHub Packages publishing described above remains for existing releases, but no consumer may depend on it.

For the maintained scaffold family, consumer repos should adopt these first:

- `@moritzbrantner/ui` from the standalone `moritzbrantner/ui` repository
- `@moritzbrantner/storytelling` from the standalone `moritzbrantner/storytelling` repository

`@moritzbrantner/oxfmt-config` and `@moritzbrantner/typescript-config` still live only under `packages/*`, so they have no supported consumer install path until each is extracted into its own repository. Consumers keep local copies of that config until then.
