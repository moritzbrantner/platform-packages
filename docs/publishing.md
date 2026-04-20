# Publishing packages

## First publish
1. Commit and push this repository to `github.com/moritzbrantner/platform-packages`.
2. Confirm your package scope matches the GitHub Packages owner. GitHub Packages only accepts npm scopes owned by the publishing user or organization.
3. If you are not publishing from a `platform` GitHub owner, rename `@moritzbrantner/*` packages to your real GitHub scope before the first release.
4. Prepare or publish `@moritzbrantner/ui`, `@moritzbrantner/storytelling`, `@moritzbrantner/eslint-config`, and `@moritzbrantner/typescript-config` first because they are the scaffold-critical package set.
5. For the first standalone install wave, also publish `@moritzbrantner/data-density` and `@moritzbrantner/maps` because `electron-template` currently consumes maps from the shared package repository and maps depends on data-density.
6. Open a pull request and merge it into `main`.
7. Wait for the `Publish Private Packages` workflow to finish on `main`.

The current workflow validates and publishes only the first scaffold release set:
- `@moritzbrantner/ui`
- `@moritzbrantner/storytelling`
- `@moritzbrantner/eslint-config`
- `@moritzbrantner/typescript-config`
- `@moritzbrantner/data-density`
- `@moritzbrantner/maps`

It skips unrelated packages until the rest of the repository is release-ready.

## Later releases
1. Make your package changes.
2. Run `bun run changeset`.
3. Select the packages that changed and choose the appropriate version bump.
4. Commit the generated changeset file with your code changes.
5. Merge to `main`.
6. Expand the publish workflow from the scaffold release set to the broader package graph before relying on Changesets-driven automation for the whole repository.

The repo can keep publishing unrelated packages, but the maintained template family should treat the scaffold-critical set as the shared contract surface for `scaffold-v2`.

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
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

For the maintained scaffold family, consumer repos should adopt these first:

- `@moritzbrantner/ui`
- `@moritzbrantner/storytelling`
- `@moritzbrantner/eslint-config`
- `@moritzbrantner/typescript-config`
