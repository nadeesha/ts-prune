import { Observable, Subscriber } from "rxjs";
import {
  ImportDeclaration,
  Project,
  SourceFile,
  SourceFileReferencingNodes,
  ts
} from "ts-morph";

type OnResultType = (result: IAnalysedResult) => void;

export enum AnalysisResultTypeEnum {
  POTENTIALLY_UNUSED,
  DEFINITELY_USED
}

export interface IAnalysedResult {
  file: string;
  type: AnalysisResultTypeEnum;
  symbols: Array<string>;
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

const nodeHandlers = {
  [ts.SyntaxKind.ImportDeclaration.toString()]: handleImportDeclaration
};

function getExported(file: SourceFile) {
  const exported: string[] = [];

  file.getExportSymbols().map(symbol => {
    exported.push(symbol.compilerSymbol.name);
  });

  return exported;
}

const emitDefinitelyUsed = (file: SourceFile, onResult: OnResultType) => {
  const text = file.getText();

  file.getImportDeclarations().forEach(decl => {
    const containsWildcardImport = decl
      .getImportClause()
      .getText()
      .includes("*");

    if (containsWildcardImport) {
      onResult({
        file: decl.getModuleSpecifierSourceFile().getFilePath(),
        symbols: [],
        type: AnalysisResultTypeEnum.DEFINITELY_USED
      });
    }
  });
};

const emitPotentiallyUnused = (file: SourceFile, onResult: OnResultType) => {
  const exported = getExported(file);

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

  const unused = exported.filter(exp => !referenced.includes(exp));

  onResult({
    file: file.getFilePath(),
    symbols: unused,
    type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED
  });
};

export const analyze = (project: Project, onResult: OnResultType) => {
  project.getSourceFiles().forEach(file => {
    emitPotentiallyUnused(file, onResult);
    emitDefinitelyUsed(file, onResult);
  });
};
