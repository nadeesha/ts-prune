import { getModuleSourceFile } from "./util/getModuleSourceFile";
import { State } from "./state";
import { IAnalysedResult } from "./analyzer";
import { Node, SourceFile } from "ts-morph";

export const fix = (state: State): void => {
  state.definitelyUnused().forEach((val) => {
    let sf: SourceFile;
    val.symbols.forEach(({ symbol, name }) => {
      const decls = symbol.getDeclarations();
      if (decls.length < 1) return;
      let decl = decls[0];
      sf = decl.getSourceFile();
      if (Node.isVariableDeclaration(decl)) {
        // e.g. `export const x = "foo";
        // we need to get the outer node which is a VariableStatement which is an ExportableNode
        decl = decl.getVariableStatement();
      }
      if (Node.isExportableNode(decl)) {
        decl.setIsExported(false);
        console.log("fixed ", val.file, name);
      } else if (Node.isExportSpecifier(decl)) {
        // e.g. export { default as Xyz } from "./src/...";'
        if (decl.getExportDeclaration().getNamedExports().length === 1) {
          // this is the only named export, remove the whole thing
          decl.getExportDeclaration().remove();
        } else {
          // remove only this named export from the statement
          decl.remove();
        }
      } else if (Node.isExportAssignment(decl)) {
        // export xyz = foo;
        decl.remove();
      } else {
        console.warn(
          "could not fix ",
          val.file,
          name,
          "unknown node type",
          decl.getKindName(),
          decl.getText()
        );
      }
    });
    if (sf) {
      sf.saveSync();
    }
  });
};
