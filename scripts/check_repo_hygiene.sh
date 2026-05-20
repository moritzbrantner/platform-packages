#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

echo "== Git status =="
status_output="$(git status --short)"
if [[ -z "$status_output" ]]; then
  echo "Working tree is clean."
else
  echo "$status_output"
fi

echo
echo "== Untracked files =="
untracked_output="$(git ls-files --others --exclude-standard)"
if [[ -z "$untracked_output" ]]; then
  echo "No untracked files outside ignore rules."
else
  echo "$untracked_output"
fi

echo
echo "== Upstream branch =="
current_branch="$(git branch --show-current)"
if [[ -z "$current_branch" ]]; then
  echo "Detached HEAD; no upstream branch applies."
elif upstream_ref="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null)"; then
  echo "$current_branch tracks $upstream_ref."
  ahead_behind="$(git rev-list --left-right --count "${upstream_ref}...HEAD")"
  behind_count="${ahead_behind%%$'\t'*}"
  ahead_count="${ahead_behind##*$'\t'}"
  echo "Behind: $behind_count"
  echo "Ahead: $ahead_count"
else
  echo "Missing upstream branch for $current_branch."
fi

echo
echo "== Generated or dependency directories tracked by git =="
tracked_generated="$(
  git ls-files |
    rg '(^|/)(node_modules|dist|\.turbo|coverage|playwright-report|test-results|storybook-static)(/|$)|\.tgz$|\.tsbuildinfo$' || true
)"
if [[ -z "$tracked_generated" ]]; then
  echo "No common generated directories or package artifacts are tracked."
else
  echo "$tracked_generated"
fi

echo
echo "== Generated or dependency directories present but not ignored =="
present_generated="$(
  find . -type d \
    \( -name .git -o -name node_modules -o -name dist -o -name .turbo -o -name coverage -o -name playwright-report -o -name test-results -o -name storybook-static \) \
    -prune -print
)"
unignored_generated=""
while IFS= read -r path; do
  [[ "$path" == "./.git" ]] && continue
  if ! git check-ignore -q "$path"; then
    unignored_generated+="${path}"$'\n'
  fi
done <<< "$present_generated"
if [[ -z "$unignored_generated" ]]; then
  echo "All present common generated directories are covered by ignore rules."
else
  printf "%s" "$unignored_generated"
fi

echo
echo "== Local-only files present but not ignored =="
local_only="$(
  find . \
    \( -path './.git' -o -name node_modules -o -name dist -o -name .turbo -o -name coverage -o -name playwright-report -o -name test-results -o -name storybook-static \) \
    -prune -o \
    -type f \
    \( -name '.env' -o -name '.env.*' -o -name '*.local' -o -name '*.log' -o -name '*.tsbuildinfo' \) \
    -print
)"
unignored_local=""
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  if ! git check-ignore -q "$path"; then
    unignored_local+="${path}"$'\n'
  fi
done <<< "$local_only"
if [[ -z "$unignored_local" ]]; then
  echo "No local-only files need ignore-rule attention."
else
  printf "%s" "$unignored_local"
fi
