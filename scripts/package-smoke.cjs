const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { dirname, join, resolve } = require("node:path");

const root = resolve(__dirname, "..");
const workspace = mkdtempSync(join(tmpdir(), "ts-prune package-"));
// npm sets this for npm scripts on every supported platform.
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this check with npm run test:package");

function runNode(args, cwd = workspace) {
  const result = spawnSync(process.execPath, args, {
    cwd, encoding: "utf8", timeout: 120000,
    env: { ...process.env, PATH: dirname(process.execPath) + require("node:path").delimiter + process.env.PATH },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

try {
  const packed = JSON.parse(runNode([npmCli, "pack", "--json", "--pack-destination", workspace], root))[0];
  const paths = packed.files.map(file => file.path);
  assert.ok(paths.includes("lib/index.js"));
  assert.ok(paths.includes("lib/index.d.ts"));
  assert.ok(paths.every(file => !/\.test\.|^src\/|^test\/|^\.test-build\//.test(file)), "Tarball includes tests or source files");
  writeFileSync(join(workspace, "package.json"), JSON.stringify({ name: "ts-prune-smoke", version: "1.0.0", private: true }));
  runNode([npmCli, "install", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund", join(workspace, packed.filename)]);
  const install = join(workspace, "node_modules/ts-prune");
  const cli = join(install, "lib/index.js");
  assert.ok(readFileSync(cli, "utf8").startsWith("#!/usr/bin/env node"));
  assert.match(runNode([cli, "--help"]), /--unusedInModule/);
  assert.equal(runNode(["-e", "const api = require('ts-prune'); console.log(typeof api.run, typeof api.runCli)"]).trim(), "function function");
  writeFileSync(join(workspace, "tsconfig.json"), JSON.stringify({ include: ["*.ts"] }));
  writeFileSync(join(workspace, "example.ts"), "export const unused = 1;\n");
  assert.equal(runNode([cli]).trim(), "example.ts:1 - unused");
  const error = spawnSync(process.execPath, [cli, "--error"], { cwd: workspace, encoding: "utf8" });
  assert.equal(error.status, 1);
  assert.equal(error.stdout.trim(), "example.ts:1 - unused");
  const manifest = JSON.parse(readFileSync(join(install, "package.json"), "utf8"));
  assert.deepEqual(Object.keys(manifest.dependencies).sort(), ["cosmiconfig", "ts-morph"]);
  writeFileSync(join(workspace, "consumer.ts"), `
    import { run, runCli, IConfigInterface, ResultSymbol } from "ts-prune";
    const config: IConfigInterface = { error: false, unusedInModule: "true" };
    const count: number = run(config, (_line: string) => {});
    const symbol: ResultSymbol = { name: "example", usedInModule: false };
    void [count, symbol, runCli];
  `);
  writeFileSync(join(workspace, "consumer.tsconfig.json"), JSON.stringify({
    compilerOptions: { strict: true, noEmit: true, module: "Node16", target: "ES2022", types: [] },
    files: ["consumer.ts"],
  }));
  runNode([require.resolve("typescript/bin/tsc"), "-p", "consumer.tsconfig.json"]);
  // Check the actual npm bin shim, including its Windows .cmd form.
  const bin = join(workspace, "node_modules/.bin", process.platform === "win32" ? "ts-prune.cmd" : "ts-prune");
  const result = spawnSync(process.platform === "win32" ? `"${bin}"` : bin, ["--help"], {
    cwd: workspace, encoding: "utf8", shell: process.platform === "win32",
    env: { ...process.env, PATH: dirname(process.execPath) + require("node:path").delimiter + process.env.PATH },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /--project/);
  console.log(`Package smoke test passed (${packed.files.length} files, ${packed.size} bytes, Node ${process.version}).`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
