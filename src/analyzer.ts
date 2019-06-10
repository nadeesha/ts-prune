import {
  Node,
  Project,
  SourceFile,
  ts,
  TypeGuards,
  VariableStatement
} from "ts-morph";

const reportableNode = (
  file: SourceFile,
  node: Node<ts.Node>,
  unused: boolean
) => {
  return {
    unused,
    filePath: file.getFilePath(),
    lineNumber: node.getStartLineNumber(),
    identifier: TypeGuards.hasName(node) ? node.getName() : node.getText()
  };
};

const analyzeNode = (node: Node<ts.Node>) => {
  const file = node.getSourceFile();

  const used =
    !TypeGuards.isReferenceFindableNode(node) ||
    node.findReferencesAsNodes().some(n => n.getSourceFile() !== file);

  return reportableNode(file, node, !used);
};

const isExported = (node: Node<ts.Node>) => {
  return TypeGuards.isExportableNode(node) && node.isExported();
};

const isImported = (node: Node<ts.Node>) => {
  return TypeGuards.isImportDeclaration(node);
};

const isVariable = (node: Node<ts.Node>) =>
  TypeGuards.isVariableStatement(node);

const symbolMap = new Map();

const symbolId = (node: Node<ts.Node>, file: SourceFile) =>
  [file.getFilePath(), node.getSourceFile().getStartLineNumber()].join(".");

export const analyze = (
  project: Project,
  onUnusedExport: (node: ReturnType<typeof reportableNode>) => void
) => {
  project.getSourceFiles().forEach(file => {
    console.log(file.getChildCount());

    file.forEachChild(symbolInFile => {
      if (isExported(symbolInFile)) {
        const exportedSymbol = symbolInFile;

        const identifier = symbolId(exportedSymbol, file);
        symbolMap.set(identifier, symbolMap.get(identifier) || 0);
      }

      if (isImported(symbolInFile)) {
        const importedSymbol = symbolInFile;
        const file = importedSymbol.getSourceFile();

        const identifier = symbolId(importedSymbol, file);
        const useCount = (symbolMap.get(identifier) || 0) + 1;
        symbolMap.set(identifier, useCount);
      }
    });
  });

  symbolMap.forEach((value, key) => console.log(key));
};
