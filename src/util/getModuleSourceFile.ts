import { ImportDeclaration } from "ts-morph";
import { Maybe } from "true-myth";

export const getModuleSourceFile = (decl: ImportDeclaration) =>
  Maybe.fromNullable(decl.getModuleSpecifierSourceFile()).mapOr(
    null as string | null,
    file => file.getFilePath()
  );
