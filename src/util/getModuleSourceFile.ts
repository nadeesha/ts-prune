import { ImportDeclaration, ExportDeclaration } from "ts-morph";
import { Maybe } from "true-myth";

export const getModuleSourceFile = (decl: ImportDeclaration | ExportDeclaration) =>
  Maybe.fromNullable(decl.getModuleSpecifierSourceFile()).mapOr(
    null as string | null,
    file => file.getFilePath()
  );
