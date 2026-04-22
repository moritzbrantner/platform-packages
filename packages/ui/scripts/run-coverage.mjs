import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (process.versions.bun) {
  const result = spawnSync("bun", ["run", "test:unit"], {
    cwd: packageRoot,
    shell: false,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const coverageDir = path.join(packageRoot, "coverage");
  mkdirSync(coverageDir, { recursive: true });
  writeFileSync(
    path.join(coverageDir, "BUN_COVERAGE_UNAVAILABLE.md"),
    [
      "# Coverage unavailable under Bun",
      "",
      "Vitest V8 coverage requires Node inspector coverage APIs.",
      "The Bun-provided `node` shim in this workspace does not expose those APIs, so this",
      "script runs the UI unit suite as the local fallback. In Node-based CI, it runs",
      "`vitest --coverage` with `vitest.coverage.config.ts`.",
      "",
    ].join("\n"),
  );
  console.warn("@moritzbrantner/ui coverage fallback: Bun does not expose V8 coverage APIs.");
  process.exit(0);
}

const result = spawnSync(
  "vitest",
  ["run", "--config", "vitest.coverage.config.ts", "--coverage"],
  {
    cwd: packageRoot,
    shell: true,
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
