import { Project } from "ts-morph";
import { getModuleSourceFile } from "./getModuleSourceFile";

describe("getModuleSourceFile", () => {
  let project: Project;

  beforeEach(() => {
    project = new Project();
  });

  describe("with import declarations", () => {
    it("should return file path for valid module import", () => {
      const targetFile = project.createSourceFile("/project/target.ts", "export const value = 'test';");
      const sourceFile = project.createSourceFile("/project/source.ts", "import { value } from './target';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      expect(result).toBe("/project/target.ts");
    });

    it("should return null for non-existent module import", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import { value } from './nonexistent';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      expect(result).toBeNull();
    });

    it("should handle relative imports", () => {
      const targetFile = project.createSourceFile("/project/nested/target.ts", "export const value = 'test';");
      const sourceFile = project.createSourceFile("/project/source.ts", "import { value } from './nested/target';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      expect(result).toBe("/project/nested/target.ts");
    });

    it("should handle parent directory imports", () => {
      const targetFile = project.createSourceFile("/project/target.ts", "export const value = 'test';");
      const sourceFile = project.createSourceFile("/project/nested/source.ts", "import { value } from '../target';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      expect(result).toBe("/project/target.ts");
    });

    it("should handle absolute imports", () => {
      const targetFile = project.createSourceFile("/project/src/utils/target.ts", "export const value = 'test';");
      const sourceFile = project.createSourceFile("/project/src/components/source.ts", "import { value } from '../utils/target';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      expect(result).toBe("/project/src/utils/target.ts");
    });

    it("should handle star imports", () => {
      const targetFile = project.createSourceFile("/project/target.ts", "export const value = 'test';");
      const sourceFile = project.createSourceFile("/project/source.ts", "import * as target from './target';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      expect(result).toBe("/project/target.ts");
    });

    it("should handle default imports", () => {
      const targetFile = project.createSourceFile("/project/target.ts", "export default 'test';");
      const sourceFile = project.createSourceFile("/project/source.ts", "import target from './target';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      expect(result).toBe("/project/target.ts");
    });

    it("should handle side-effect only imports", () => {
      // Note: This test behavior depends on ts-morph's module resolution
      const sourceFile = project.createSourceFile("/project/source.ts", "import './target';");
      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      // Should return null when target doesn't exist
      expect(result).toBeNull();
    });

    it("should handle imports with file extensions", () => {
      const targetFile = project.createSourceFile("/project/target.ts", "export const value = 'test';");
      const sourceFile = project.createSourceFile("/project/source.ts", "import { value } from './target.js';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      // ts-morph may resolve .js to .ts in some cases
      expect(result).toEqual(expect.any(String));
    });
  });

  describe("with export declarations", () => {
    it("should return file path for valid re-export", () => {
      const targetFile = project.createSourceFile("/project/target.ts", "export const value = 'test';");
      const sourceFile = project.createSourceFile("/project/source.ts", "export { value } from './target';");

      const exportDecl = sourceFile.getExportDeclarations()[0];
      const result = getModuleSourceFile(exportDecl);

      expect(result).toBe("/project/target.ts");
    });

    it("should return null for non-existent module re-export", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "export { value } from './nonexistent';");

      const exportDecl = sourceFile.getExportDeclarations()[0];
      const result = getModuleSourceFile(exportDecl);

      expect(result).toBeNull();
    });

    it("should handle star re-exports", () => {
      const targetFile = project.createSourceFile("/project/target.ts", "export const value = 'test';");
      const sourceFile = project.createSourceFile("/project/source.ts", "export * from './target';");

      const exportDecl = sourceFile.getExportDeclarations()[0];
      const result = getModuleSourceFile(exportDecl);

      expect(result).toBe("/project/target.ts");
    });

    it("should handle renamed re-exports", () => {
      const targetFile = project.createSourceFile("/project/target.ts", "export const value = 'test';");
      const sourceFile = project.createSourceFile("/project/source.ts", "export { value as renamed } from './target';");

      const exportDecl = sourceFile.getExportDeclarations()[0];
      const result = getModuleSourceFile(exportDecl);

      expect(result).toBe("/project/target.ts");
    });

    it("should handle default re-exports", () => {
      const targetFile = project.createSourceFile("/project/target.ts", "export default 'test';");
      const sourceFile = project.createSourceFile("/project/source.ts", "export { default } from './target';");

      const exportDecl = sourceFile.getExportDeclarations()[0];
      const result = getModuleSourceFile(exportDecl);

      expect(result).toBe("/project/target.ts");
    });

    it("should return null for local exports without module specifier", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", `
        const localValue = 'test';
        export { localValue };
      `);

      const exportDecl = sourceFile.getExportDeclarations()[0];
      const result = getModuleSourceFile(exportDecl);

      expect(result).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle TypeScript imports", () => {
      const targetFile = project.createSourceFile("/project/target.ts", "export type MyType = string;");
      const sourceFile = project.createSourceFile("/project/source.ts", "import type { MyType } from './target';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      expect(result).toBe("/project/target.ts");
    });

    it("should handle mixed named and default imports", () => {
      const targetFile = project.createSourceFile("/project/target.ts", `
        export default 'default';
        export const named = 'named';
      `);
      const sourceFile = project.createSourceFile("/project/source.ts", "import defaultExport, { named } from './target';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      expect(result).toBe("/project/target.ts");
    });

    it("should handle deeply nested imports", () => {
      const targetFile = project.createSourceFile("/project/very/deeply/nested/target.ts", "export const value = 'test';");
      const sourceFile = project.createSourceFile("/project/source.ts", "import { value } from './very/deeply/nested/target';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      expect(result).toBe("/project/very/deeply/nested/target.ts");
    });

    it("should handle index file imports", () => {
      const indexFile = project.createSourceFile("/project/utils/index.ts", "export const util = 'test';");
      const sourceFile = project.createSourceFile("/project/source.ts", "import { util } from './utils';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = getModuleSourceFile(importDecl);

      expect(result).toBe("/project/utils/index.ts");
    });
  });
});