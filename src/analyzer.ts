import { ignoreComment } from "./constants";
import {
  ExportDeclaration,
  ImportDeclaration,
  Project,
  SourceFile,
  SourceFileReferencingNodes,
  ts,
  Symbol,
} from "ts-morph";
import { isDefinitelyUsedImport } from "./util/isDefinitelyUsedImport";
import { getModuleSourceFile } from "./util/getModuleSourceFile";
import { realpathSync } from "fs";
import countBy from "lodash/fp/countBy";

type OnResultType = (result: IAnalysedResult) => void;

export enum AnalysisResultTypeEnum {
  POTENTIALLY_UNUSED,
  DEFINITELY_USED
}

export type ResultSymbol = {
  name: string;
  line?: number;
  usedInModule: boolean;
};

export type IAnalysedResult = {
  file: string;
  type: AnalysisResultTypeEnum;
  symbols: ResultSymbol[];
}

function handleExportDeclaration(node: SourceFileReferencingNodes) {
  return (node as ExportDeclaration).getNamedExports().map(n => n.getName());
}

function handleImportDeclaration(node: SourceFileReferencingNodes) {
  const referenced = [] as string[];

  (node as ImportDeclaration)
    .getNamedImports()
    .map(n => referenced.push(n.getName()));

  const defaultImport = (node as ImportDeclaration).getDefaultImport();

  if (defaultImport) {
    referenced.push("default");
  }

  return referenced;
}

// like import("../xyz")
function handleDynamicImport(node: SourceFileReferencingNodes) {
  // a dynamic import always imports all elements, so we can't tell if only some are used
  return ["*"];
}

const nodeHandlers = {
  [ts.SyntaxKind.ExportDeclaration.toString()]: handleExportDeclaration,
  [ts.SyntaxKind.ImportDeclaration.toString()]: handleImportDeclaration,
  [ts.SyntaxKind.CallExpression.toString()]: handleDynamicImport,
};

const mustIgnore = (symbol: Symbol, file: SourceFile) => {
  const symbolLinePos = symbol.getDeclarations().map(decl => decl.getStartLinePos()).reduce((currentMin, current) => Math.min(currentMin, current), Infinity);
  const possibleIgnoreLinePos = symbolLinePos - ignoreComment.length;
  return file.getDescendantAtPos(possibleIgnoreLinePos)?.getText().includes(ignoreComment);
}

const lineNumber = (symbol: Symbol) =>
  symbol.getDeclarations().map(decl => decl.getStartLineNumber()).reduce((currentMin, current) => Math.min(currentMin, current), Infinity)

function getExported(file: SourceFile) {
  return file.getExportSymbols()
    .filter(symbol => !mustIgnore(symbol, file))
    .map(symbol => ({
      name: symbol.compilerSymbol.name,
      line: lineNumber(symbol)
    }));
}

const importWildCards = (file: SourceFile) =>
  file
    .getImportDeclarations()
    .map(decl => ({
      moduleSourceFile: getModuleSourceFile(decl),
      definitelyUsed: isDefinitelyUsedImport(decl)
    }))
    .filter(meta => meta.definitelyUsed && !!meta.moduleSourceFile)
    .map(({ moduleSourceFile }) => ({
      file: moduleSourceFile,
      symbols: [],
      type: AnalysisResultTypeEnum.DEFINITELY_USED
    }));


const exportWildCards = (file: SourceFile) =>
  file
    .getExportDeclarations()
    .filter(decl => decl.getText().includes("*"))
    .map((decl) => ({
      file: getModuleSourceFile(decl),
      symbols: [],
      type: AnalysisResultTypeEnum.DEFINITELY_USED
    }));

const emitDefinitelyUsed = (file: SourceFile, onResult: OnResultType) => {
  [
    ...importWildCards(file),
    ...exportWildCards(file),
  ].forEach(onResult);
};

const emitPotentiallyUnused = (file: SourceFile, onResult: OnResultType) => {
  const exported = getExported(file);

  const idsInFile = file.getDescendantsOfKind(ts.SyntaxKind.Identifier);
  const referenceCounts = countBy(x => x)((idsInFile || []).map(node => node.getText()));
  const referencedInFile = Object.entries(referenceCounts).flatMap(([name, count]) => count > 1 ? [name] : []);

  const referenced2D = file
    .getReferencingNodesInOtherSourceFiles()
    .map((node: SourceFileReferencingNodes) => {
      const handler =
        nodeHandlers[node.getKind().toString()] ||
        function noop() {
          return [] as string[];
        };

      return handler(node);
    });

  const referenced = ([] as string[]).concat(...referenced2D);

  const unused = referenced.includes("*") ? [] :
    exported.filter(exp => !referenced.includes(exp.name))
    .map(exp => ({...exp, usedInModule: referencedInFile.includes(exp.name)}))

  onResult({
    file: realpathSync(file.getFilePath()),
    symbols: unused,
    type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED
  });
};

const emitTsConfigEntrypoints = (entrypoints: string[], onResult: OnResultType) =>
  entrypoints.map(file => ({
    file,
    symbols: [],
    type: AnalysisResultTypeEnum.DEFINITELY_USED,
  })).forEach(emittable => onResult(emittable))

export const analyze = (project: Project, onResult: OnResultType, entrypoints: string[]) => {
  project.getSourceFiles().forEach(file => {
    emitPotentiallyUnused(file, onResult);
    emitDefinitelyUsed(file, onResult);
  });

  emitTsConfigEntrypoints(entrypoints, onResult);
};
