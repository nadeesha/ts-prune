import {
  Node,
  Project,
  SourceFile,
  ts,
  TypeGuards,
  VariableStatement
} from "ts-simple-ast";

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
  const used =
    !TypeGuards.isReferenceFindableNode(node) ||
    node.findReferencesAsNodes().filter(n => n.getSourceFile() !== file)
      .length > 0;

  const file = node.getSourceFile();

  return reportableNode(file, node, !used);
};

const isExported = (node: Node<ts.Node>) => {
  return TypeGuards.isExportableNode(node) && node.isExported();
};

const isVariable = (node: Node<ts.Node>) =>
  TypeGuards.isVariableStatement(node);

export const analyze = (
  project: Project,
  onUnusedExport: (node: ReturnType<typeof reportableNode>) => void
) => {
  project.getSourceFiles().forEach(file => {
    file.forEachChild(child => {
      if (isVariable(child) && isExported(child)) {
        (child as VariableStatement)
          .getDeclarations()
          .map(analyzeNode)
          .filter(node => node.unused)
          .forEach(onUnusedExport);
      } else if (isExported(child)) {
        const analyzedNode = analyzeNode(child);

        if (analyzedNode.unused) {
          return onUnusedExport(analyzeNode(child));
        }
      }
    });
  });
};
