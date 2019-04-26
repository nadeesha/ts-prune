import {
  Project,
  TypeGuards,
  ts,
  Node,
  VariableStatement
} from "ts-simple-ast";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

function checkNode(node: Node<ts.Node>) {
  if (!TypeGuards.isReferenceFindableNode(node)) {
    return;
  }

  const file = node.getSourceFile();
  if (
    node.findReferencesAsNodes().filter(n => n.getSourceFile() !== file)
      .length === 0
  ) {
    return `${file.getFilePath()}:${node.getStartLineNumber()}: ${
      TypeGuards.hasName(node) ? node.getName() : node.getText()
    }`;
  }
}

function isExported(node: Node<ts.Node>) {
  return TypeGuards.isExportableNode(node) && node.isExported();
}

const isVariable = (node: Node<ts.Node>) =>
  TypeGuards.isVariableStatement(node);

export const getUnused = () => {
  let references: string[] = [];

  project.getSourceFiles().forEach(file => {
    file.forEachChild(child => {
      if (isVariable(child) && isExported(child)) {
        (child as VariableStatement).getDeclarations().forEach(checkNode);
      } else if (isExported(child)) {
        references.push(checkNode(child));
      }
    });
  });

  return references;
};
