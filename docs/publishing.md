# Publishing packages

## First publish
1. Commit and push this repository to `github.com/moritzbrantner/platform-packages`.
2. Confirm your package scope matches the GitHub Packages owner. GitHub Packages only accepts npm scopes owned by the publishing user or organization.
3. If you are not publishing from a `platform` GitHub owner, rename `@moritzbrantner/*` packages to your real GitHub scope before the first release.
4. Open a pull request and merge it into `main`.
5. Wait for the `Release Packages` workflow to finish on `main`.

If a package version has not been published before, the workflow's `changeset publish` step will publish that version directly to GitHub Packages.

## Later releases
1. Make your package changes.
2. Run `bun run changeset`.
3. Select the packages that changed and choose the appropriate version bump.
4. Commit the generated changeset file with your code changes.
5. Merge to `main`.
6. When the release pull request is created by Changesets, merge that pull request to publish.

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
