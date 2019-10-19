import { ImportDeclaration } from "ts-morph";
import { Maybe } from "true-myth";
import identity from "lodash/fp/identity";

const containsWildcardImport = (decl: ImportDeclaration) =>
  Maybe.of(decl.getImportClause())
    .mapOr("" as string, clause => clause.getText())
    .includes("*");

const containsUnnamedImport = (decl: ImportDeclaration) =>
  !decl.getImportClause();

export const isDefinitelyUsedImport = (decl: ImportDeclaration) =>
  [containsWildcardImport, containsUnnamedImport]
    .map(fn => fn(decl))
    .find(identity);
