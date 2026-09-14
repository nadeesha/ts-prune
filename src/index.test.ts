import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { afterEach, describe, it, mock } from "node:test";
import * as configurator from "./configurator";
import * as runner from "./runner";
import * as api from "./index";

describe("index", () => {
  const originalExitCode = process.exitCode;
  afterEach(() => {
    mock.restoreAll();
    process.exitCode = originalExitCode;
  });

  it("exports the expected library functions", () => {
    assert.equal(api.run, runner.run);
    assert.equal(typeof api.runCli, "function");
  });

  for (const [resultCount, error, expectedStatus] of [
    [3, true, 1],
    [0, true, 0],
    [5, undefined, 0],
    [5, false, 0],
    [5, "false", 1],
  ] as const) {
    it(`sets exit status ${expectedStatus} for ${resultCount} results and error=${JSON.stringify(error)}`, () => {
      const config = { project: "tsconfig.json", error };
      const getConfig = mock.method(configurator, "getConfig", () => config);
      const run = mock.method(runner, "run", () => resultCount);
      api.runCli();
      assert.equal(process.exitCode, expectedStatus);
      assert.equal(getConfig.mock.callCount(), 1);
      assert.equal(run.mock.callCount(), 1);
      assert.deepEqual(run.mock.calls[0]?.arguments, [config]);
    });
  }

  it("can be imported without running the CLI or modifying process state", () => {
    const result = spawnSync(process.execPath, ["-e", `
      const before = process.exitCode;
      const api = require(${JSON.stringify(join(process.cwd(), "lib/index.js"))});
      if (process.exitCode !== before) throw new Error("library import changed exit status");
      console.log(typeof api.run, typeof api.runCli);
    `], { encoding: "utf8" });
    assert.ifError(result.error);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(result.stdout, "function function\n");
  });

  it("flushes all output before returning an error status", () => {
    const root = process.cwd();
    const expected = "x".repeat(1024 * 1024) + "\n";
    const result = spawnSync(process.execPath, ["-e", `
      require(${JSON.stringify(join(root, "lib/configurator.js"))}).getConfig = () => ({ error: true });
      require(${JSON.stringify(join(root, "lib/runner.js"))}).run = () => { console.log("x".repeat(1024 * 1024)); return 1; };
      require(${JSON.stringify(join(root, "lib/index.js"))}).runCli();
    `], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.equal(result.stderr, "");
    assert.equal(result.stdout.length, expected.length);
    assert.equal(result.stdout, expected);
  });
});
