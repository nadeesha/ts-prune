import {Project} from 'ts-morph';
import {getExported, importWildCards, AnalysisResultTypeEnum} from './analyzer';

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

describe('analyzer', () => {
  const project = new Project();
  const foo = project.createSourceFile("/project/foo.ts", fooSrc);
  const useFoo = project.createSourceFile('/project/use-foo.ts', useFooSrc);
  const star = project.createSourceFile("/project/star.ts", starImportSrc);

  it('should track import wildcards', () => {
    expect(importWildCards(star)).toEqual([
      {
        file: '/project/foo.ts',
        symbols: [],
        type: AnalysisResultTypeEnum.DEFINITELY_USED,
      }
    ])
  });

  it('should track named exports', () => {
    expect(getExported(foo)).toEqual([
      { name: 'x', line: 2},
      { name: 'y', line: 3},
      { name: 'z', line: 4},
      { name: 'w', line: 5},
    ]);

    expect(getExported(useFoo)).toEqual([
      { name: 'UseFoo', line: 2 },
    ]);
  });
});
