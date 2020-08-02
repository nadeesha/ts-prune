import { ImportDeclaration } from "ts-morph";
import { Maybe } from "true-myth";

export const containsWildcardImport = (decl: ImportDeclaration) =>
  Maybe.of(decl.getImportClause())
    .mapOr("", clause => clause.getText())
    .includes("*");


const containsUnnamedImport = (decl: ImportDeclaration) =>
  !decl.getImportClause();

export const isDefinitelyUsedImport = (decl: ImportDeclaration) =>
  containsWildcardImport(decl) || containsUnnamedImport(decl);
