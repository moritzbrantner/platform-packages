#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: pnpm create:package <package-name>" >&2
  exit 1
fi

package_name="$1"

if [[ ! "$package_name" =~ ^[a-z0-9-]+$ ]]; then
  echo "Package name must use lowercase letters, numbers, and hyphens only." >&2
  exit 1
fi

package_dir="packages/$package_name"

if [[ -e "$package_dir" ]]; then
  echo "Package directory already exists: $package_dir" >&2
  exit 1
fi

remote_url="$(git config --get remote.origin.url || true)"

if [[ "$remote_url" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
  owner="${BASH_REMATCH[1],,}"
  repo="${BASH_REMATCH[2]}"
else
  echo "Could not infer GitHub owner/repository from git remote.origin.url." >&2
  echo "Set the remote first, then run the generator again." >&2
  exit 1
fi

mkdir -p "$package_dir/src" "$package_dir/tests"

sed \
  -e "s/__SCOPE__/$owner/g" \
  -e "s/__PACKAGE_NAME__/$package_name/g" \
  -e "s|__REPOSITORY_URL__|git+https://github.com/$owner/$repo.git|g" \
  -e "s|__PACKAGE_DIRECTORY__|$package_dir|g" \
  templates/package/package.json.template > "$package_dir/package.json"

cp templates/package/src/index.ts "$package_dir/src/index.ts"
cp templates/package/tests/smoke.test.js "$package_dir/tests/smoke.test.js"
cp templates/package/tsconfig.json "$package_dir/tsconfig.json"

echo "Created $package_dir"
