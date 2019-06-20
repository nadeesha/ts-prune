import { Observable } from "rxjs";
import {
  ImportDeclaration,
  Node,
  Project,
  SourceFile,
  SourceFileReferencingNodes,
  ts,
  TypeGuards
} from "ts-morph";

const SymbolAnalysis = () => ({
  referenced: [] as string[],
  exported: [] as string[]
});

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

export const analyze = (project: Project) =>
  new Observable<{ file: string; unused: string[] }>(subscriber => {
    project.getSourceFiles().forEach(file => {
      const exported = getExported(file);
      // const referenced: string[] = [];

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

      subscriber.next({ file: file.getFilePath(), unused });
    });
  });
