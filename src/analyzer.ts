import { ignoreComment } from "./constants";
import {
  ExportDeclaration,
  ImportDeclaration,
  Project,
  SourceFile,
  SourceFileReferencingNodes,
  ts,
  Node,
  Symbol,
  SyntaxKind,
  PropertyAccessExpression,
  StringLiteral,
  ObjectBindingPattern,
} from "ts-morph";
import { containsWildcardImport, isDefinitelyUsedImport } from "./util/isDefinitelyUsedImport";
import { getModuleSourceFile } from "./util/getModuleSourceFile";
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

function handleImportDeclaration(node: ImportDeclaration) {
  return (
    [
      ...node.getNamedImports().map(n => n.getName()),
      ...(node.getDefaultImport() ? ['default'] : []),
      ...(node.getNamespaceImport() ? trackWildcardUses(node) : []),
    ]
  );
}

export function getNodesOfKind(node: SourceFile, kind: SyntaxKind): Node[] {
  const out: Node[] = [];
  node.forEachDescendant(node => {
    if (node.getKind() === kind) {
      out.push(node);
    }
  });
  return out;
}

/**
 * Given an `import * as foo from './foo'` import, figure out which symbols in foo are used.
 *
 * If there are uses which cannot be tracked, this returns ["*"].
 */
export const trackWildcardUses = (node: ImportDeclaration) => {
  const clause = node.getImportClause();
  clause.getText();  // "* as foo"
  clause.getFullText();  // " * as foo"
  clause.getDefaultImport();  // undefined

  const namespaceImport = clause.getFirstChildByKind(ts.SyntaxKind.NamespaceImport);
  const source = node.getSourceFile();

  const uses = getNodesOfKind(source, ts.SyntaxKind.Identifier)
    .filter(n => (n.getSymbol()?.getDeclarations() ?? []).includes(namespaceImport));

  const symbols: string[] = [];
  for (const use of uses) {
    if (use.getParentIfKind(SyntaxKind.NamespaceImport)) {
      continue;
    }

    const p = use.getParentIfKind(SyntaxKind.PropertyAccessExpression);
    if (p) {
      symbols.push(p.getName());
      continue;
    }

    const el = use.getParentIfKind(SyntaxKind.ElementAccessExpression);
    if (el) {
      const arg = el.getArgumentExpression();
      if (arg.getKind() === SyntaxKind.StringLiteral) {
        symbols.push((arg as StringLiteral).getLiteralText());
        continue;
      }
    }

    const varExp = use.getParentIfKind(SyntaxKind.VariableDeclaration);
    if (varExp) {
      const nameNode = varExp.getNameNode();
      if (nameNode.getKind() === SyntaxKind.ObjectBindingPattern) {
        const binder = (nameNode as ObjectBindingPattern);
        for (const bindEl of binder.getElements()) {
          const p = bindEl.getPropertyNameNode();
          if (p) {
            // e.g. const {z: {a}} = foo;
            symbols.push(p.getText());
          } else {
            // e.g. const {x} = foo;
            symbols.push(bindEl.getName());
          }
        }
        continue;
      }
    }

    const qualExp = use.getParentIfKind(SyntaxKind.QualifiedName);
    if (qualExp) {
      symbols.push(qualExp.getRight().getText());
      continue;
    }

    // If we don't understand a use, be conservative.
    return ['*'];
  }

  return symbols;
};

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

export const getExported = (file: SourceFile) =>
  file.getExportSymbols()
    .filter(symbol => !mustIgnore(symbol, file))
    .map(symbol => ({
      name: symbol.compilerSymbol.name,
      line: lineNumber(symbol)
    }));

/* Returns all the "import * as x from './y';" imports */
export const importWildCards = (file: SourceFile): IAnalysedResult[] =>
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

const exportWildCards = (file: SourceFile): IAnalysedResult[] =>
  file
    .getExportDeclarations()
    .filter(decl => decl.getText().includes("*"))
    .map((decl) => ({
      file: getModuleSourceFile(decl),
      symbols: [],
      type: AnalysisResultTypeEnum.DEFINITELY_USED
    }));

const getDefinitelyUsed = (file: SourceFile): IAnalysedResult[] => ([
    ...importWildCards(file),
    ...exportWildCards(file),
  ]);

export const getPotentiallyUnused = (file: SourceFile): IAnalysedResult => {
  const exported = getExported(file);

  const idsInFile = file.getDescendantsOfKind(ts.SyntaxKind.Identifier);
  const referenceCounts = countBy(x => x)((idsInFile || []).map(node => node.getText()));
  const referencedInFile = Object.entries(referenceCounts).flatMap(([name, count]) => count > 1 ? [name] : []);

  const referenced = file
    .getReferencingNodesInOtherSourceFiles()
    .flatMap((node: SourceFileReferencingNodes) => {
      const kind = node.getKind().toString();
      return nodeHandlers?.[kind]?.(node) ?? [];
    });

  const unused = referenced.includes("*") ? [] :
    exported.filter(exp => !referenced.includes(exp.name))
    .map(exp => ({...exp, usedInModule: referencedInFile.includes(exp.name)}))

  return {
    file: file.getFilePath(),
    symbols: unused,
    type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED
  };
};

const emitTsConfigEntrypoints = (entrypoints: string[], onResult: OnResultType) =>
  entrypoints.map(file => ({
    file,
    symbols: [],
    type: AnalysisResultTypeEnum.DEFINITELY_USED,
  })).forEach(emittable => onResult(emittable))

export const analyze = (project: Project, onResult: OnResultType, entrypoints: string[]) => {
  project.getSourceFiles().forEach(file => {
    [
      getPotentiallyUnused(file),
      ...getDefinitelyUsed(file),
    ].forEach(onResult);
  });

  emitTsConfigEntrypoints(entrypoints, onResult);
};
