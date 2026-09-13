import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";

describe("Integration Tests", () => {
  let testDir: string;
  const root = process.cwd();
  const cliPath = join(root, "lib/index.js");

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "ts-prune test-"));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  const createTestProject = (files: Record<string, string>) => {
    Object.entries(files).forEach(([filePath, content]) => {
      const fullPath = join(testDir, filePath);
      const dir = dirname(fullPath);
      mkdirSync(dir, { recursive: true });
      writeFileSync(fullPath, content);
    });
  };

  const invoke = (args: string[] = [], cwd = testDir) => {
    const result = spawnSync(process.execPath, [cliPath, ...args], {
      cwd, encoding: "utf8", timeout: 30000,
    });
    if (result.error) throw result.error;
    return result;
  };

  const runTsPrune = (args: string[] = [], cwd = testDir): string => {
    const result = invoke(args, cwd);
    assert.equal(result.stderr, "");
    assert.equal(result.status, 0);
    return result.stdout;
  };

  describe("compatibility contracts", () => {
    for (const [args, baseline] of [
      [[], "outfile.base"],
      [["--unusedInModule"], "outfile_unusedInModules.base"],
    ] as const) {
      it(`preserves the legacy fixture output with ${JSON.stringify(args)}`, () => {
        const output = runTsPrune(["--skip", "skip.me", ...args], join(root, "integration/testproject"));
        assert.equal(output.replace(/\\/g, "/"), readFileSync(join(root, "integration", baseline), "utf8"));
      });
    }

    it("uses files entries as public entrypoints, with comments and trailing commas", () => {
      createTestProject({
        "tsconfig.json": '{ // public API\n "files": ["src/api.ts",], "include": ["src/**/*.ts"], }',
        "src/api.ts": "export const publicApi = 1;",
        "src/other.ts": "export const unused = 1;",
      });
      const output = runTsPrune();
      assert.ok(output.includes("unused"));
      assert.ok(!output.includes("publicApi"));
    });

    for (const config of [
      "{ 'files': ['src/api.ts'] }",
      '{ files: ["src/api.ts"] }',
    ]) {
      it(`rejects JSON5 syntax rejected by TypeScript: ${config}`, () => {
        createTestProject({
          "tsconfig.json": config,
          "src/api.ts": "export const publicApi = 1;",
        });
        const result = invoke();
        assert.equal(result.status, 1);
        assert.ok(result.stderr.includes("double quotes expected"));
      });
    }

    it("does not turn inherited files entries into public entrypoints", () => {
      createTestProject({
        "tsconfig.json": '{ "extends": "./base.json" }',
        "base.json": '{ "files": ["src/api.ts"] }',
        "src/api.ts": "export const unused = 1;",
      });
      assert.ok(runTsPrune().includes("unused"));
    });

    it("loads a project path from .ts-prunerc when no CLI override is given", () => {
      createTestProject({
        ".ts-prunerc": JSON.stringify({ project: "config/custom.json" }),
        "config/custom.json": JSON.stringify({ include: ["../src/**/*.ts"] }),
        "src/api.ts": "export const unused = 1;",
      });
      assert.ok(runTsPrune().includes("unused"));
    });

    it("loads package.json configuration and respects false boolean flags", () => {
      createTestProject({
        "package.json": JSON.stringify({ "ts-prune": { unusedInModule: false, error: false } }),
        "tsconfig.json": JSON.stringify({ include: ["src/**/*.ts"] }),
        "src/api.ts": "export const local = 1; console.log(local);",
      });
      assert.ok(runTsPrune().includes("local (used in module)"));
    });

    it("prints help without requiring a project", () => {
      assert.ok(runTsPrune(["--help"]).includes("--unusedInModule"));
    });

    it("can be imported as a library without running the CLI", () => {
      const result = spawnSync(process.execPath, ["-e", `const api = require(${JSON.stringify(cliPath)}); console.log(typeof api.run, typeof api.runCli);`], {
        cwd: testDir, encoding: "utf8",
      });
      assert.equal(result.status, 0);
      assert.equal(result.stderr, "");
      assert.equal(result.stdout.trim(), "function function");
    });

    it("keeps the error exit code after output filters", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({ include: ["src/**/*.ts"] }),
        "src/api.ts": "export const unused = 1;",
      });
      assert.equal(runTsPrune(["--error", "--ignore", "unused"]), "");
    });

    it("rejects malformed tsconfig files", () => {
      createTestProject({ "tsconfig.json": "{invalid !!!" });
      assert.equal(invoke().status, 1);
    });
  });

  describe("Basic functionality", () => {
    it("should find unused exports in simple project", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/index.ts": `
          export const used = 'used';
          export const unused = 'unused';
        `,
        "src/main.ts": `
          import { used } from './index';
          console.log(used);
        `
      });

      const output = runTsPrune();
      assert.ok(output.includes("unused"));
      assert.doesNotMatch(output, /- used(\s|$)/m);
    });

    it("should handle projects with no unused exports", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/index.ts": `
          export const value = 'value';
        `,
        "src/main.ts": `
          import { value } from './index';
          console.log(value);
        `
      });

      const output = runTsPrune();
      assert.equal(output.trim(), "");
    });

    it("should detect unused types and interfaces", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/types.ts": `
          export interface UsedInterface {
            prop: string;
          }
          export interface UnusedInterface {
            prop: number;
          }
          export type UsedType = string;
          export type UnusedType = number;
        `,
        "src/main.ts": `
          import { UsedInterface, UsedType } from './types';

          const value: UsedInterface = { prop: 'test' };
          const type: UsedType = 'test';
        `
      });

      const output = runTsPrune();
      assert.ok(output.includes("UnusedInterface"));
      assert.ok(output.includes("UnusedType"));
      assert.ok(!output.includes("UsedInterface"));
      assert.ok(!output.includes("UsedType"));
    });
  });

  describe("CLI options", () => {
    it("should respect --skip option", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/utils.ts": `
          export const util = 'util';
        `,
        "src/utils.test.ts": `
          import { util } from './utils';
          console.log(util);
        `,
        "src/main.ts": `
          // main doesn't import util
        `
      });

      const outputWithoutSkip = runTsPrune();
      assert.ok(!outputWithoutSkip.includes("util"));

      const outputWithSkip = runTsPrune(["--skip", "\\.test\\."]);
      assert.ok(outputWithSkip.includes("util"));
    });

    it("should respect --ignore option", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/index.ts": `
          export const unused = 'unused';
        `,
        "src/test/test.ts": `
          export const testUnused = 'testUnused';
        `
      });

      const outputWithoutIgnore = runTsPrune();
      assert.ok(outputWithoutIgnore.includes("unused"));
      assert.ok(outputWithoutIgnore.includes("testUnused"));

      const outputWithIgnore = runTsPrune(["--ignore", "test"]);
      assert.ok(outputWithIgnore.includes("unused"));
      assert.ok(!outputWithIgnore.includes("testUnused"));
    });

    it("should exit with error code when --error flag is used and unused exports exist", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/index.ts": `
          export const unused = 'unused';
        `
      });

      assert.equal(invoke(["--error"]).status, 1);
    });

    it("should exit with success code when --error flag is used but no unused exports exist", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/index.ts": `
          export const used = 'used';
        `,
        "src/main.ts": `
          import { used } from './index';
          console.log(used);
        `
      });

      assert.equal(invoke(["--error"]).status, 0);
    });

    it("should handle custom tsconfig path", () => {
      createTestProject({
        "custom.tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/index.ts": `
          export const unused = 'unused';
        `
      });

      const output = runTsPrune(["--project", "custom.tsconfig.json"]);
      assert.ok(output.includes("unused"));
    });

    it("should handle --unusedInModule flag", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/index.ts": `
          export const locallyUsed = 'locallyUsed';
          export const totallyUnused = 'totallyUnused';

          // Use locallyUsed within the same module
          console.log(locallyUsed);
        `
      });

      const outputWithoutFlag = runTsPrune();
      assert.ok(outputWithoutFlag.includes("locallyUsed"));
      assert.ok(outputWithoutFlag.includes("totallyUnused"));

      const outputWithFlag = runTsPrune(["--unusedInModule"]);
      assert.ok(!outputWithFlag.includes("locallyUsed"));
      assert.ok(outputWithFlag.includes("totallyUnused"));
    });
  });

  describe("Complex project scenarios", () => {
    it("should handle re-exports correctly", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/utils.ts": `
          export const util1 = 'util1';
          export const util2 = 'util2';
        `,
        "src/index.ts": `
          export { util1 } from './utils';
          export const unused = 'unused';
        `,
        "src/main.ts": `
          import { util1 } from './index';
          console.log(util1);
        `
      });

      const output = runTsPrune();
      assert.ok(output.includes("util2"));
      assert.ok(output.includes("unused"));
      assert.ok(!output.includes("util1"));
    });

    it("should handle star exports correctly", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/utils.ts": `
          export const util1 = 'util1';
          export const util2 = 'util2';
        `,
        "src/index.ts": `
          export * from './utils';
          export const extra = 'extra';
        `,
        "src/main.ts": `
          import { util1 } from './index';
          console.log(util1);
        `
      });

      const output = runTsPrune();
      assert.ok(output.includes("extra"));
      assert.ok(!output.includes("util1"));
      // util2 is still reported as unused since no importer references it
      assert.ok(output.includes("util2"));
    });

    it("should handle namespace imports correctly", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/utils.ts": `
          export const used = 'used';
          export const unused = 'unused';
        `,
        "src/main.ts": `
          import * as utils from './utils';
          console.log(utils.used);
        `
      });

      const output = runTsPrune();
      // trackWildcardUses tracks specific property accesses, so only `used` is tracked
      assert.doesNotMatch(output, /- used(\s|$)/m);
      // `unused` is still reported because it's not accessed via utils.unused
      assert.ok(output.includes("unused"));
    });

    it("should handle side-effect imports correctly", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/polyfill.ts": `
          export const polyfillFunction = () => {};

          // Side effect code
          (global as any).polyfillApplied = true;
        `,
        "src/main.ts": `
          import './polyfill';
        `
      });

      const output = runTsPrune();
      assert.ok(!output.includes("polyfillFunction"));
    });

    it("should handle circular dependencies", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/a.ts": `
          import { bFunction } from './b';
          export const aFunction = () => bFunction();
          export const unusedA = 'unusedA';
        `,
        "src/b.ts": `
          import { aFunction } from './a';
          export const bFunction = () => console.log('b');
          export const unusedB = 'unusedB';
        `,
        "src/main.ts": `
          import { aFunction } from './a';
          aFunction();
        `
      });

      const output = runTsPrune();
      assert.ok(output.includes("unusedA"));
      assert.ok(output.includes("unusedB"));
      assert.ok(!output.includes("aFunction"));
      assert.ok(!output.includes("bFunction"));
    });
  });

  describe("Error conditions", () => {
    it("should handle invalid tsconfig path", () => {
      createTestProject({
        "src/index.ts": `export const value = 'value';`
      });

      const result = invoke(["--project", "nonexistent.json"]);
      assert.equal(result.status, 1);
      assert.ok(result.stderr.includes("nonexistent.json"));
    });

    it("should handle empty project", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        })
      });

      const output = runTsPrune();
      assert.equal(output.trim(), "");
    });

    it("should handle project with only type declarations", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        }),
        "src/types.d.ts": `
          declare global {
            interface Window {
              customProperty: string;
            }
          }

          export {};
        `
      });

      const output = runTsPrune();
      assert.equal(output.trim(), "");
    });
  });
});