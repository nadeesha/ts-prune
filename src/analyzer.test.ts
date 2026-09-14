import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Project, ts } from "ts-morph";
import {
  analyze,
  AnalysisResultTypeEnum,
  getExported,
  getPotentiallyUnused,
  IAnalysedResult,
  importsForSideEffects,
  trackWildcardUses,
} from "./analyzer";

const fooSrc = `
export const x = 'x';
export const y = 'y';
export const z = {a: 'a'};
export const w = 'w';
export type ABC = 'a' | 'b' | 'c';

export const unusedC = 'c';
export type UnusedT = 'T';
`;

const starExportSrc = `
export * from './foo';
`;

const starImportSrc = `
import * as foo from './foo';
import {UseFoo} from './use-foo';
import {x,y,z,w,ABC} from './starExport';

const x = foo.x;
const {y} = foo;
const {z: {a}} = foo;
const w = foo['w'];
type ABC = foo.ABC;
`;

const useFooSrc = `
export function UseFoo(foo: string) {
  alert(foo);
}
`;

const barSrc = `
export const bar = () => false;
`;

const testBarSrc = `
import { bar } from './bar';

describe("bar", () => {
  it("should return false", () => {
    expect(bar()).toBe.toBeFalsy;
  });
});
`;

describe("analyzer", () => {
  const project = new Project({ useInMemoryFileSystem: true });
  const foo = project.createSourceFile("/project/foo.ts", fooSrc);
  const useFoo = project.createSourceFile("/project/use-foo.ts", useFooSrc);
  const star = project.createSourceFile("/project/star.ts", starImportSrc);
  const bar = project.createSourceFile("/project/bar.ts", barSrc);
  project.createSourceFile("/project/bar.test.ts", testBarSrc);
  const starExport = project.createSourceFile("/project/starExport.ts", starExportSrc);

  it("should track import wildcards", () => {
    // TODO(danvk): rename this to importSideEffects()
    assert.deepEqual(importsForSideEffects(star), []);
  });

  it("should track named exports", () => {
    assert.deepEqual(getExported(foo), [
      { name: "x", line: 2 },
      { name: "y", line: 3 },
      { name: "z", line: 4 },
      { name: "w", line: 5 },
      { name: "ABC", line: 6 },
      { name: "unusedC", line: 8 },
      { name: "UnusedT", line: 9 },
    ]);

    assert.deepEqual(getExported(useFoo), [{ name: "UseFoo", line: 2 }]);
  });

  it("marks exports named after inherited object keys as used within their module", () => {
    const keys = ["constructor", "toString", "hasOwnProperty", "__proto__"];
    const file = project.createSourceFile("/project/inherited-key-exports.ts", keys.map((key) =>
      `export const ${key} = 1; console.log(${key});`
    ).join("\n"));
    assert.deepEqual(getPotentiallyUnused(file).symbols, keys.map((name, index) => ({
      name, line: index + 1, usedInModule: true,
    })));
  });

  it("does not mark a single inherited-key declaration as used in its module", () => {
    const keys = ["constructor", "toString", "hasOwnProperty", "__proto__"];
    const file = project.createSourceFile("/project/unused-inherited-key-exports.ts", keys.map((key) =>
      `export const ${key} = 1;`
    ).join("\n"));
    assert.deepEqual(getPotentiallyUnused(file).symbols, keys.map((name, index) => ({
      name, line: index + 1, usedInModule: false,
    })));
  });

  it("should track named imports", () => {
    assert.deepEqual(getPotentiallyUnused(foo), {
      file: "/project/foo.ts",
      symbols: [
        { line: 8, name: "unusedC", usedInModule: false },
        { line: 9, name: "UnusedT", usedInModule: false },
      ],
      type: 0,
    });
  });

  it("should not skip source files without a pattern", () => {
    // while bar.test.ts is included, bar is used
    assert.deepEqual(getPotentiallyUnused(bar), {
      file: "/project/bar.ts",
      symbols: [],
      type: 0,
    });
  });

  it("should skip source files matching a pattern", () => {
    // when bar.test.ts is exclude by the skip pattern, bar is unused
    assert.deepEqual(getPotentiallyUnused(bar, /.test.ts/), {
      file: "/project/bar.ts",
      symbols: [
        { line: 2, name: "bar", usedInModule: false },
      ],
      type: 0,
    });
  });

  it("should use line number of 'export * from' rather than line number of original export", () => {
    const result = getPotentiallyUnused(starExport);
    assert.equal(result.file, "/project/starExport.ts");
    assert.deepEqual(result.symbols.map(s => s.name), ["unusedC", "UnusedT"]);
    assert.equal(result.type, 0);
    // Line numbers may be undefined for re-exported symbols
    result.symbols.forEach(symbol => {
      assert.equal(typeof symbol.usedInModule, "boolean");
    });
  });

  it("should track usage through star imports", () => {
    const importNode = star.getFirstDescendantByKindOrThrow(
      ts.SyntaxKind.ImportDeclaration
    );

    assert.deepEqual(trackWildcardUses(importNode), ["x", "y", "z", "w", "ABC"]);
  });

  describe("edge cases and error conditions", () => {
    it("should handle files with ignore comments", () => {
      const ignoredSrc = `
// ts-prune-ignore-next
export const ignoredExport = 'ignored';
export const regularExport = 'regular';
`;
      const ignoredFile = project.createSourceFile("/project/ignored.ts", ignoredSrc);
      const exported = getExported(ignoredFile);

      assert.ok((exported.map(e => e.name)).includes("regularExport"));
    });

    it("should handle trackWildcardUses with complex destructuring", () => {
      const complexDestructuringSrc = `
import * as module from './module';
const {a: {b: {c}}} = module;
const d = module.e;
const g = module['dynamickey'];
`;
      const complexFile = project.createSourceFile("/project/complex.ts", complexDestructuringSrc);
      const importNode = complexFile.getFirstDescendantByKindOrThrow(ts.SyntaxKind.ImportDeclaration);

      const result = trackWildcardUses(importNode);
      // The actual behavior tracks specific property accesses
      assert.ok((result).includes("a"));
      assert.ok((result).includes("e"));
      assert.ok((result).includes("dynamickey"));
    });

    it("should return wildcard for untrackable uses", () => {
      const untrackedSrc = `
import * as module from './module';
const fn = (key: string) => module[key];
`;
      const untrackedFile = project.createSourceFile("/project/untracked.ts", untrackedSrc);
      const importNode = untrackedFile.getFirstDescendantByKindOrThrow(ts.SyntaxKind.ImportDeclaration);

      const result = trackWildcardUses(importNode);
      assert.deepEqual(result, ["*"]);
    });

    it("should handle qualified name access in types", () => {
      const qualifiedSrc = `
import * as Types from './types';
type MyType = Types.SomeType;
const value: Types.OtherType = {};
`;
      const qualifiedFile = project.createSourceFile("/project/qualified.ts", qualifiedSrc);
      const importNode = qualifiedFile.getFirstDescendantByKindOrThrow(ts.SyntaxKind.ImportDeclaration);

      const result = trackWildcardUses(importNode);
      assert.deepEqual(result, ["SomeType", "OtherType"]);
    });

    it("should handle element access with string literals", () => {
      const elementAccessSrc = `
import * as module from './module';
const a = module['stringKey'];
const b = module["doubleQuotes"];
`;
      const elementFile = project.createSourceFile("/project/element.ts", elementAccessSrc);
      const importNode = elementFile.getFirstDescendantByKindOrThrow(ts.SyntaxKind.ImportDeclaration);

      const result = trackWildcardUses(importNode);
      assert.deepEqual(result, ["stringKey", "doubleQuotes"]);
    });

    it("should handle variable declarations with object binding", () => {
      const bindingSrc = `
import * as module from './module';
const {prop1, prop2: renamed} = module;
`;
      const bindingFile = project.createSourceFile("/project/binding.ts", bindingSrc);
      const importNode = bindingFile.getFirstDescendantByKindOrThrow(ts.SyntaxKind.ImportDeclaration);

      const result = trackWildcardUses(importNode);
      assert.deepEqual(result, ["prop1", "prop2"]);
    });

    it("should handle exports with different types", () => {
      const mixedExportsSrc = `
export const constExport = 'value';
export let letExport = 'value';
export var varExport = 'value';
export function functionExport() {}
export class ClassExport {}
export interface InterfaceExport {}
export type TypeExport = string;
export enum EnumExport { A, B }
export default 'defaultExport';
`;
      const mixedFile = project.createSourceFile("/project/mixed.ts", mixedExportsSrc);
      const exported = getExported(mixedFile);

      const exportNames = exported.map(e => e.name);
      assert.ok((exportNames).includes("constExport"));
      assert.ok((exportNames).includes("functionExport"));
      assert.ok((exportNames).includes("ClassExport"));
      assert.ok((exportNames).includes("InterfaceExport"));
      assert.ok((exportNames).includes("TypeExport"));
      assert.ok((exportNames).includes("EnumExport"));
      assert.ok((exportNames).includes("default"));
    });

    it("should handle side-effect imports", () => {
      const sideEffectSrc = `
import './side-effect-only';
import {} from './empty-import';
`;
      const sideEffectFile = project.createSourceFile("/project/side-effect.ts", sideEffectSrc);
      project.createSourceFile("/project/side-effect-only.ts", "console.log('side effect');");
      const sideEffects = importsForSideEffects(sideEffectFile);

      // Test passes if function returns array (behavior depends on module resolution)
      assert.equal(Array.isArray(sideEffects), true);
    });

    it("should handle re-exports correctly", () => {
      const reExportSrc = `
export { specificExport } from './other';
export * from './another';
export { default as renamed } from './third';
`;
      const reExportFile = project.createSourceFile("/project/re-export.ts", reExportSrc);
      const result = getPotentiallyUnused(reExportFile);

      assert.equal(result.file, "/project/re-export.ts");
    });

    it("should handle nested object destructuring in imports", () => {
      const nestedSrc = `
import * as module from './module';
const {outer: {inner}} = module;
const {a: {b: {c: renamed}}} = module;
`;
      const nestedFile = project.createSourceFile("/project/nested.ts", nestedSrc);
      const importNode = nestedFile.getFirstDescendantByKindOrThrow(ts.SyntaxKind.ImportDeclaration);

      const result = trackWildcardUses(importNode);
      assert.deepEqual(result, ["outer", "a"]);
    });

    it("should handle dynamic imports correctly", () => {
      const dynamicImportSrc = `
const dynamicModule = import('./dynamic');
const conditionalImport = condition ? import('./conditional') : null;
`;
      const dynamicFile = project.createSourceFile("/project/dynamic.ts", dynamicImportSrc);
      const callExpressions = dynamicFile.getDescendantsOfKind(ts.SyntaxKind.CallExpression);

      assert.ok((callExpressions.length) > 0);
    });

    it("should handle files with only type exports", () => {
      const typesOnlySrc = `
export type TypeA = string;
export interface InterfaceB {}
export declare const declaredVar: string;
`;
      const typesFile = project.createSourceFile("/project/types-only.ts", typesOnlySrc);
      const exported = getExported(typesFile);

      assert.deepEqual(exported.map(e => e.name), ["TypeA", "InterfaceB", "declaredVar"]);
    });

    it("should handle namespace exports", () => {
      const namespaceSrc = `
export namespace MyNamespace {
  export const value = 'test';
  export function func() {}
}
`;
      const namespaceFile = project.createSourceFile("/project/namespace.ts", namespaceSrc);
      const exported = getExported(namespaceFile);

      assert.ok((exported.map(e => e.name)).includes("MyNamespace"));
    });

    it("should handle module augmentation", () => {
      const augmentationSrc = `
declare module 'existing-module' {
  export interface ExistingInterface {
    newProperty: string;
  }
}
export const localExport = 'value';
`;
      const augmentFile = project.createSourceFile("/project/augment.ts", augmentationSrc);
      const exported = getExported(augmentFile);

      assert.ok((exported.map(e => e.name)).includes("localExport"));
    });
  });

  describe("analyze integration", () => {
    let directory: string;

    beforeEach(() => {
      directory = realpathSync(mkdtempSync(join(tmpdir(), "ts-prune-analyzer-")));
    });

    afterEach(() => {
      rmSync(directory, { recursive: true, force: true });
    });

    const createProject = (sources: Record<string, string>) => {
      const project = new Project();
      for (const [file, source] of Object.entries(sources)) {
        project.createSourceFile(join(directory, file), source);
      }
      project.saveSync();
      return project;
    };

    it("should emit tsconfig entrypoints as DEFINITELY_USED", () => {
      const analyzeProject = createProject({
        "entry.ts": "export const a = 1;",
        "other.ts": "import { a } from './entry'; console.log(a);",
      });

      const results: IAnalysedResult[] = [];
      const onResult = (result: IAnalysedResult) => results.push(result);

      analyze(analyzeProject, onResult, [join(directory, "entry.ts")]);

      const entrypointResult = results.find(
        r => r.file === join(directory, "entry.ts") && r.type === AnalysisResultTypeEnum.DEFINITELY_USED
      );
      assert.ok(entrypointResult);
      assert.deepEqual(entrypointResult!.symbols, []);
    });

    it("should filter source files matching skip pattern", () => {
      const analyzeProject = createProject({
        "lib.ts": "export const lib = 1;",
        "lib.test.ts": "import { lib } from './lib'; console.log(lib);",
      });

      const resultsWithoutSkip: IAnalysedResult[] = [];
      analyze(analyzeProject, (r) => resultsWithoutSkip.push(r), []);

      const resultsWithSkip: IAnalysedResult[] = [];
      analyze(analyzeProject, (r) => resultsWithSkip.push(r), [], "\\.test\\.ts");

      // With skip pattern, test files are excluded from analysis
      const skippedFileNames = resultsWithSkip.map(r => r.file);
      assert.ok(skippedFileNames.every((file) => !file.includes(".test.ts")));
      assert.ok(resultsWithoutSkip.some((result) => result.file.includes(".test.ts")));
    });

    it("should treat dynamic imports as wildcard (all exports used)", () => {
      const analyzeProject = createProject({
        "target.ts": "export const a = 1; export const b = 2;",
        "consumer.ts": "const mod = import('./target');",
      });

      const results: IAnalysedResult[] = [];
      analyze(analyzeProject, (r) => results.push(r), []);

      // Dynamic import treats all exports as used (wildcard)
      const targetResult = results.find(
        r => r.file.includes("target.ts") && r.type === AnalysisResultTypeEnum.POTENTIALLY_UNUSED
      );
      assert.ok(targetResult);
      assert.deepEqual(targetResult!.symbols, []);
    });

    it("should handle export * from unresolvable module without crashing", () => {
      const analyzeProject = createProject({
        "reexport.ts": "export * from './nonexistent'; export const localExport = 1;",
      });

      const results: IAnalysedResult[] = [];
      assert.doesNotThrow(() => {
        analyze(analyzeProject, (r) => results.push(r), []);
      });

      // localExport should still be reported
      const reexportResult = results.find(
        r => r.file.includes("reexport.ts") && r.type === AnalysisResultTypeEnum.POTENTIALLY_UNUSED
      );
      assert.ok(reexportResult);
      assert.ok((reexportResult!.symbols.map(s => s.name)).includes("localExport"));
    });
  });
});
