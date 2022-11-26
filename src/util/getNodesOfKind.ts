import { SourceFile, SyntaxKind, Node } from "ts-morph";

export function getNodesOfKind(node: SourceFile, kind: SyntaxKind): Node[] {
  return node.getDescendants().filter((node) => node.getKind() === kind);
}
