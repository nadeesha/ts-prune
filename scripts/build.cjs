const { rmSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");

rmSync(resolve(__dirname, "../lib"), { recursive: true, force: true });
const result = spawnSync(process.execPath, [require.resolve("typescript/bin/tsc")], {
  cwd: resolve(__dirname, ".."),
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
