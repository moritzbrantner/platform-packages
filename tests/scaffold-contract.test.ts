import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "bun:test";

const repoRoot = path.resolve(import.meta.dir, "..");

test("readme marks the scaffold-critical package set explicitly", () => {
  const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");

  expect(readme).toContain("## Scaffold-critical package set");
  expect(readme).toContain("`@moritzbrantner/ui`");
  expect(readme).toContain("`@moritzbrantner/storytelling`");
  expect(readme).toContain("`@moritzbrantner/eslint-config`");
  expect(readme).toContain("`@moritzbrantner/typescript-config`");
  expect(readme).toContain("Everything else in this repository remains valid");
  expect(readme).toContain("Do not move `@repo/auth-contract` or `@repo/upload-playbook`");
});

test("publishing guide prioritizes the scaffold-critical packages for first release", () => {
  const publishingGuide = readFileSync(
    path.join(repoRoot, "docs/publishing.md"),
    "utf8",
  );

  expect(publishingGuide).toContain(
    "Prepare or publish `@moritzbrantner/ui`, `@moritzbrantner/storytelling`, `@moritzbrantner/eslint-config`, and `@moritzbrantner/typescript-config` first",
  );
  expect(publishingGuide).toContain("consumer repos should adopt these first");
});
