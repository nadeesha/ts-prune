import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { join, relative } from "node:path";
import { run } from "./runner";
import { IConfigInterface } from "./configurator";
import { createProjectFixture } from "../test/project-fixture";

describe("runner", () => {
  let fixture: ReturnType<typeof createProjectFixture>;
  let output: string[];
  const originalCwd = process.cwd();

  beforeEach(() => {
    fixture = createProjectFixture();
    process.chdir(fixture.directory);
    output = [];
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fixture.cleanup();
  });

  const invoke = (config: IConfigInterface = {}) => run(
    { project: fixture.project, ...config },
    line => output.push(line.replaceAll("\\", "/"))
  );

  it("runs with a minimal config and returns the number of results", () => {
    fixture.write({ "src/api.ts": "export const unused = 1;" });
    assert.equal(invoke(), 1);
    assert.deepEqual(output, ["src/api.ts:1 - unused"]);
  });

  it("defaults an omitted project to tsconfig.json", () => {
    fixture.write({ "src/api.ts": "export const unused = 1;" });
    assert.equal(run({}, line => output.push(line.replaceAll("\\", "/"))), 1);
    assert.deepEqual(output, ["src/api.ts:1 - unused"]);
  });

  it("uses only explicit files entries as public entrypoints", () => {
    fixture.write({
      "tsconfig.json": '{ "files": ["src/api.ts", "src/utils.ts"], "include": ["src/**/*.ts"] }',
      "src/api.ts": "export const publicApi = 1;",
      "src/utils.ts": "export const publicUtility = 1;",
      "src/other.ts": "export const unused = 1;",
    });
    assert.equal(invoke(), 1);
    assert.deepEqual(output, ["src/other.ts:1 - unused"]);
  });

  it("reports exports from files included without explicit entrypoints", () => {
    fixture.write({
      "src/api.ts": "export const first = 1;",
      "src/other.ts": "export const second = 1;",
    });
    assert.equal(invoke(), 2);
    assert.deepEqual(output, ["src/api.ts:1 - first", "src/other.ts:1 - second"]);
  });

  it("does not use inherited files entries as public entrypoints", () => {
    fixture.write({
      "tsconfig.json": '{ "extends": "./base.json" }',
      "base.json": '{ "files": ["src/api.ts"] }',
      "src/api.ts": "export const unused = 1;",
    });
    assert.equal(invoke(), 1);
    assert.deepEqual(output, ["src/api.ts:1 - unused"]);
  });

  for (const value of [true, "true", "false", ""] as const) {
    it(`filters locally used exports for the enabled option ${JSON.stringify(value)}`, () => {
      fixture.write({ "src/api.ts": "export const unused = 1;\nexport const local = 2; console.log(local);\nexport const other = 3;" });
      assert.equal(invoke({ unusedInModule: value }), 2);
      assert.deepEqual(output, ["src/api.ts:1 - unused", "src/api.ts:3 - other"]);
    });
  }

  for (const value of [undefined, false] as const) {
    it(`keeps locally used exports for ${JSON.stringify(value)}`, () => {
      fixture.write({ "src/api.ts": "export const local = 1; console.log(local);" });
      assert.equal(invoke({ unusedInModule: value }), 1);
      assert.deepEqual(output, ["src/api.ts:1 - local (used in module)"]);
    });
  }

  it("filters full output lines with the ignore regular expression", () => {
    fixture.write({
      "src/api.ts": "export const first = 1;\nexport const namedIgnore = 2;\nexport const last = 3;",
      "src/test.ts": "export const testing = 1;",
    });
    assert.equal(invoke({ ignore: "test|namedIgnore" }), 2);
    assert.deepEqual(output, ["src/api.ts:1 - first", "src/api.ts:3 - last"]);
  });

  it("applies local-use and ignore filters without changing output order", () => {
    fixture.write({
      "src/api.ts": "export const first = 1;\nexport const local = 2; console.log(local);\nexport const last = 3;",
      "src/test.ts": "export const testing = 1;",
    });
    assert.equal(invoke({ unusedInModule: true, ignore: "test" }), 2);
    assert.deepEqual(output, ["src/api.ts:1 - first", "src/api.ts:3 - last"]);
  });

  it("removes locally used output before evaluating the ignore expression", () => {
    fixture.write({ "src/api.ts": "export const local = 1; console.log(local);" });
    assert.equal(invoke({ unusedInModule: true, ignore: "[" }), 0);
    assert.deepEqual(output, []);
  });

  it("excludes matching importers from reference tracking using skip", () => {
    fixture.write({
      "src/api.ts": "export const util = 1;",
      "src/api.test.ts": 'import { util } from "./api"; console.log(util);',
    });
    assert.equal(invoke(), 0);
    assert.equal(invoke({ skip: "\\.test\\." }), 1);
    assert.deepEqual(output, ["src/api.ts:1 - util"]);
  });

  it("returns three results for three unused exports", () => {
    fixture.write({
      "src/a.ts": "export const a = 1;",
      "src/b.ts": "export const b = 1;",
      "src/c.ts": "export const c = 1;",
    });
    assert.equal(invoke(), 3);
    assert.equal(output.length, 3);
  });

  it("returns zero without writing output for an empty project", () => {
    assert.equal(invoke(), 0);
    assert.deepEqual(output, []);
  });

  it("resolves relative custom project paths", () => {
    fixture.write({
      "custom/tsconfig.json": '{ "include": ["../src/**/*.ts"] }',
      "src/api.ts": "export const unused = 1;",
    });
    assert.equal(invoke({ project: relative(process.cwd(), join(fixture.directory, "custom/tsconfig.json")) }), 1);
    assert.deepEqual(output, ["src/api.ts:1 - unused"]);
  });

  it("throws for malformed tsconfig JSON", () => {
    fixture.write({ "tsconfig.json": "{invalid json content!!!" });
    assert.throws(() => invoke());
  });

  for (const content of ["", " \n\t", "// comment only", "/* comment only */"]) {
    it(`rejects an empty tsconfig document: ${JSON.stringify(content)}`, () => {
      fixture.write({ "tsconfig.json": content });
      assert.throws(() => invoke(), /empty|end/i);
    });
  }

  it("propagates an error naming a missing tsconfig", () => {
    assert.throws(() => invoke({ project: join(fixture.directory, "nonexistent.json") }), /nonexistent\.json/);
  });

  it("accepts TypeScript comments and trailing commas", () => {
    fixture.write({
      "tsconfig.json": '{ // public API\n "files": ["src/api.ts",], "include": ["src/**/*.ts",], "compilerOptions": { "strict": true, }, }',
      "src/api.ts": "export const publicApi = 1;",
      "src/other.ts": "export const unused = 1;",
    });
    assert.equal(invoke(), 1);
    assert.deepEqual(output, ["src/other.ts:1 - unused"]);
  });

  for (const config of ["{ 'files': ['src/api.ts'] }", '{ files: ["src/api.ts"] }']) {
    it(`preserves TypeScript rejection of unsupported JSON5 syntax: ${config}`, () => {
      fixture.write({ "tsconfig.json": config, "src/api.ts": "export const publicApi = 1;" });
      assert.throws(() => invoke(), /double quotes expected/);
    });
  }

  it("preserves invalid ignore regular expression errors", () => {
    fixture.write({ "src/api.ts": "export const unused = 1;" });
    assert.throws(() => invoke({ ignore: "[" }), SyntaxError);
  });

  it("propagates errors from the output callback", () => {
    fixture.write({ "src/api.ts": "export const unused = 1;" });
    const error = new Error("output failed");
    assert.throws(() => run({ project: fixture.project }, () => { throw error; }), error);
  });
});
