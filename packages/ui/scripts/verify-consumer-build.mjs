import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const consumerRoot = path.join(packageRoot, "examples", "consumer");

run("bun", ["run", "check-types"], consumerRoot);
run("bun", ["run", "build"], consumerRoot);

console.log("@moritzbrantner/ui consumer example verified");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    shell: false,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
