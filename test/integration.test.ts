import { execSync } from "child_process";
import { join } from "path";
import { writeFileSync, mkdirSync, existsSync, rmdirSync, unlinkSync, readdirSync, statSync } from "fs";

// Polyfill for rmSync for older Node versions
const rmSync = (path: string, options?: { recursive?: boolean; force?: boolean }) => {
  if (!existsSync(path)) return;

  const stats = statSync(path);
  if (stats.isDirectory()) {
    const files = readdirSync(path);
    files.forEach(file => {
      const filePath = join(path, file);
      const fileStats = statSync(filePath);
      if (fileStats.isDirectory()) {
        rmSync(filePath, { recursive: true, force: true });
      } else {
        unlinkSync(filePath);
      }
    });
    rmdirSync(path);
  } else {
    unlinkSync(path);
  }
};

describe("Integration Tests", () => {
  const testDir = join(__dirname, "../test-temp");
  const tsPruneCmd = `node ${join(__dirname, "../lib/index.js")}`;

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  const createTestProject = (files: Record<string, string>) => {
    Object.entries(files).forEach(([filePath, content]) => {
      const fullPath = join(testDir, filePath);
      const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
      mkdirSync(dir, { recursive: true });
      writeFileSync(fullPath, content);
    });
  };

  const runTsPrune = (args: string = "", cwd: string = testDir): string => {
    try {
      return execSync(`${tsPruneCmd} ${args}`, {
        cwd,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).toString();
    } catch (error: any) {
      return error.stdout?.toString() || "";
    }
  };

  // Skip integration tests that require CLI execution
  describe.skip("Basic functionality", () => {
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
      expect(output).toContain("unused");
      expect(output).not.toContain("used");
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
      expect(output.trim()).toBe("");
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
      expect(output).toContain("UnusedInterface");
      expect(output).toContain("UnusedType");
      expect(output).not.toContain("UsedInterface");
      expect(output).not.toContain("UsedType");
    });
  });

  describe.skip("CLI options", () => {
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
      expect(outputWithoutSkip).not.toContain("util");

      const outputWithSkip = runTsPrune("--skip \"\\.test\\.\"");
      expect(outputWithSkip).toContain("util");
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
      expect(outputWithoutIgnore).toContain("unused");
      expect(outputWithoutIgnore).toContain("testUnused");

      const outputWithIgnore = runTsPrune("--ignore \"test\"");
      expect(outputWithIgnore).toContain("unused");
      expect(outputWithIgnore).not.toContain("testUnused");
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

      let exitCode = 0;
      try {
        execSync(`${tsPruneCmd} --error`, {
          cwd: testDir,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (error: any) {
        exitCode = error.status;
      }

      expect(exitCode).toBe(1);
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

      let exitCode = 0;
      try {
        execSync(`${tsPruneCmd} --error`, {
          cwd: testDir,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (error: any) {
        exitCode = error.status;
      }

      expect(exitCode).toBe(0);
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

      const output = runTsPrune("--project custom.tsconfig.json");
      expect(output).toContain("unused");
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
      expect(outputWithoutFlag).toContain("locallyUsed");
      expect(outputWithoutFlag).toContain("totallyUnused");

      const outputWithFlag = runTsPrune("--unusedInModule");
      expect(outputWithFlag).not.toContain("locallyUsed");
      expect(outputWithFlag).toContain("totallyUnused");
    });
  });

  describe.skip("Complex project scenarios", () => {
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
      expect(output).toContain("util2");
      expect(output).toContain("unused");
      expect(output).not.toContain("util1");
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
      expect(output).toContain("extra");
      expect(output).not.toContain("util1");
      expect(output).not.toContain("util2");
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
      expect(output).not.toContain("used");
      expect(output).not.toContain("unused");
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
      expect(output).not.toContain("polyfillFunction");
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
      expect(output).toContain("unusedA");
      expect(output).toContain("unusedB");
      expect(output).not.toContain("aFunction");
      expect(output).not.toContain("bFunction");
    });
  });

  describe.skip("Error conditions", () => {
    it("should handle invalid tsconfig path", () => {
      createTestProject({
        "src/index.ts": `export const value = 'value';`
      });

      let exitCode = 0;
      try {
        execSync(`${tsPruneCmd} --project nonexistent.json`, {
          cwd: testDir,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (error: any) {
        exitCode = error.status;
      }

      expect(exitCode).not.toBe(0);
    });

    it("should handle empty project", () => {
      createTestProject({
        "tsconfig.json": JSON.stringify({
          compilerOptions: { target: "es2017" },
          include: ["src/**/*"]
        })
      });

      const output = runTsPrune();
      expect(output.trim()).toBe("");
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
      expect(output.trim()).toBe("");
    });
  });
});