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
  referenced: new Set<string>(),
  exported: new Set<string>()
});

function handleImportDeclaration(node: SourceFileReferencingNodes) {
  const referenced = new Set<string>();

  (node as ImportDeclaration)
    .getNamedImports()
    .map(n => referenced.add(n.getName()));

  const defaultImport = (node as ImportDeclaration).getDefaultImport();

  if (defaultImport) {
    referenced.add("default");
  }

  return referenced;
}

const nodeHandlers = {
  [ts.SyntaxKind.ImportDeclaration.toString()]: handleImportDeclaration
};

function getExported(file: SourceFile) {
  const exported = new Set<string>();

  file.getExportSymbols().map(symbol => {
    exported.add(symbol.compilerSymbol.name);
  });

  return exported;
}

export const analyze = (project: Project) =>
  new Observable<{ file: string; unused: string[] }>(subscriber => {
    project.getSourceFiles().forEach(file => {
      const exported = getExported(file);
      const referenced = new Set();

      file
        .getReferencingNodesInOtherSourceFiles()
        .map((node: SourceFileReferencingNodes) => {
          const handler =
            nodeHandlers[node.getKind().toString()] ||
            function noop() {
              return new Set();
            };

          return handler(node);
        });

      const unused = [...exported].filter(
        exported => !referenced.has(exported)
      );

      subscriber.next({ file: file.getFilePath(), unused });
    });
  });
