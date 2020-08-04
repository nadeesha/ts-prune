import { SourceFile, SyntaxKind, Node } from "ts-morph";

export function getNodesOfKind(node: SourceFile, kind: SyntaxKind): Node[] {
  const out: Node[] = [];
  node.forEachDescendant(node => {
    if (node.getKind() === kind) {
      out.push(node);
    }
  });
  return out;
}
