import { ImportDeclaration, ExportDeclaration } from "ts-morph";

export const getModuleSourceFile = (
  decl: ImportDeclaration | ExportDeclaration
) => decl.getModuleSpecifierSourceFile()?.getFilePath() ?? null;
