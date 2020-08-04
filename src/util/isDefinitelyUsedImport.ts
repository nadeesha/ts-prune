import { ImportDeclaration } from "ts-morph";

const containsUnnamedImport = (decl: ImportDeclaration) =>
  !decl.getImportClause();

export const isDefinitelyUsedImport = (decl: ImportDeclaration) =>
  containsUnnamedImport(decl);
