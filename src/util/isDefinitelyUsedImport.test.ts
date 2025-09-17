import { Project } from "ts-morph";
import { isDefinitelyUsedImport } from "./isDefinitelyUsedImport";

describe("isDefinitelyUsedImport", () => {
  let project: Project;

  beforeEach(() => {
    project = new Project();
  });

  describe("side-effect imports (definitely used)", () => {
    it("should return true for side-effect only imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import './side-effect';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(true);
    });

    it("should return true for imports without import clause", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import 'polyfill';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(true);
    });

    it("should return true for CSS/style imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import './styles.css';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(true);
    });

    it("should return true for multiple side-effect imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", `
        import './polyfills';
        import './global-styles';
        import 'some-global-package';
      `);

      const importDecls = sourceFile.getImportDeclarations();

      importDecls.forEach(importDecl => {
        expect(isDefinitelyUsedImport(importDecl)).toBe(true);
      });
    });
  });

  describe("named imports (not definitely used)", () => {
    it("should return false for named imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import { value } from './module';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(false);
    });

    it("should return false for multiple named imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import { a, b, c } from './module';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(false);
    });

    it("should return false for renamed imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import { value as renamed } from './module';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(false);
    });
  });

  describe("default imports (not definitely used)", () => {
    it("should return false for default imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import defaultExport from './module';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(false);
    });

    it("should return false for mixed default and named imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import defaultExport, { named } from './module';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(false);
    });
  });

  describe("namespace imports (not definitely used)", () => {
    it("should return false for namespace imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import * as module from './module';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(false);
    });

    it("should return false for renamed namespace imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import * as renamed from './module';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(false);
    });
  });

  describe("type imports (not definitely used)", () => {
    it("should return false for type-only imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import type { MyType } from './types';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(false);
    });

    it("should return false for type-only default imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import type DefaultType from './types';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(false);
    });

    it("should return false for type-only namespace imports", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import type * as Types from './types';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(false);
    });
  });

  describe("empty imports (not definitely used)", () => {
    it("should return false for empty import clause", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "import {} from './module';");

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(false);
    });
  });

  describe("dynamic imports", () => {
    it("should handle files with dynamic imports (no import declarations)", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", "const module = import('./dynamic');");

      const importDecls = sourceFile.getImportDeclarations();
      expect(importDecls).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should handle mixed import types in same file", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", `
        import './side-effect';
        import { named } from './named';
        import defaultExport from './default';
        import * as namespace from './namespace';
        import type { TypeImport } from './types';
      `);

      const importDecls = sourceFile.getImportDeclarations();

      expect(isDefinitelyUsedImport(importDecls[0])).toBe(true);  // side-effect
      expect(isDefinitelyUsedImport(importDecls[1])).toBe(false); // named
      expect(isDefinitelyUsedImport(importDecls[2])).toBe(false); // default
      expect(isDefinitelyUsedImport(importDecls[3])).toBe(false); // namespace
      expect(isDefinitelyUsedImport(importDecls[4])).toBe(false); // type-only
    });

    it("should handle imports with complex module specifiers", () => {
      const sourceFile = project.createSourceFile("/project/source.ts", `
        import '@babel/polyfill';
        import 'core-js/stable';
        import './styles/global.css';
      `);

      const importDecls = sourceFile.getImportDeclarations();

      importDecls.forEach(importDecl => {
        expect(isDefinitelyUsedImport(importDecl)).toBe(true);
      });
    });

    it("should handle imports with very long module paths", () => {
      const sourceFile = project.createSourceFile("/project/source.ts",
        "import './very/deeply/nested/path/to/some/side/effect/module';"
      );

      const importDecl = sourceFile.getImportDeclarations()[0];
      const result = isDefinitelyUsedImport(importDecl);

      expect(result).toBe(true);
    });
  });
});