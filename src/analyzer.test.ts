import { Project, ts } from "ts-morph";
import {
  getExported,
  getNodesOfKind,
  getPotentiallyUnused,
  importWildCards,
  trackWildcardUses,
  AnalysisResultTypeEnum,
} from "./analyzer";

const fooSrc = `
export const x = 'x';
export const y = 'y';
export const z = {a: 'a'};
export const w = 'w';
`;

const starImportSrc = `
import * as foo from './foo';
import {UseFoo} from './use-foo';

const x = foo.x;
// const {y} = foo;
// const {z: {a}} = foo;
// const w = foo['w'];
// const all = foo[Math.random()];

// UseFoo(foo);
`;

const useFooSrc = `
export function UseFoo(foo: string) {
  alert(foo);
}
`;

describe("analyzer", () => {
  const project = new Project();
  const foo = project.createSourceFile("/project/foo.ts", fooSrc);
  const useFoo = project.createSourceFile("/project/use-foo.ts", useFooSrc);
  const star = project.createSourceFile("/project/star.ts", starImportSrc);

  it("should track import wildcards", () => {
    expect(importWildCards(star)).toEqual([
      {
        file: "/project/foo.ts",
        symbols: [],
        type: AnalysisResultTypeEnum.DEFINITELY_USED,
      },
    ]);
  });

  it("should track named exports", () => {
    expect(getExported(foo)).toEqual([
      { name: "x", line: 2 },
      { name: "y", line: 3 },
      { name: "z", line: 4 },
      { name: "w", line: 5 },
    ]);

    expect(getExported(useFoo)).toEqual([{ name: "UseFoo", line: 2 }]);
  });

  it("should track named imports", () => {
    expect(getPotentiallyUnused(foo)).toEqual({
      file: "/project/foo.ts",
      symbols: [
        { line: 2, name: "x", usedInModule: false },
        { line: 3, name: "y", usedInModule: false },
        { line: 4, name: "z", usedInModule: false },
        { line: 5, name: "w", usedInModule: false },
      ],
      type: 0,
    });
  });

  it('should get nodes of a kind', () => {
    expect(getNodesOfKind(star, ts.SyntaxKind.PropertyAccessExpression).map(n => n.getText())).toEqual([
      "foo.x",
    ])
  });

  it.only("should track usage through star imports", () => {
    const importNode = star.getFirstDescendantByKindOrThrow(ts.SyntaxKind.ImportDeclaration);

    expect(trackWildcardUses(importNode)).toEqual(
      ['x']
    );
  });
});
