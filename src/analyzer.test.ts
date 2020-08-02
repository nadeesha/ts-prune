import {Project} from 'ts-morph';
import {importWildCards, AnalysisResultTypeEnum} from './analyzer';

const fooSrc = `
export const x = 'x';
export const y = 'y';
export const z = {a: 'a'};
export const w = 'w';
`;

const starImportSrc = `
import * as foo from './foo';
// import {UseFoo} from './use-foo';

const x = foo.x;
// const {y} = foo;
// const {z: {a}} = foo;
// const w = foo['w'];
// const all = foo[Math.random()];

// UseFoo(foo);
`;

describe('analyzer', () => {
  const project = new Project();
  const sourceFileFoo = project.createSourceFile("/project/foo.ts", fooSrc);
  const sourceFileStar = project.createSourceFile("/project/star.ts", starImportSrc);

  it('should track import wildcards', () => {
    expect(importWildCards(sourceFileStar)).toEqual([
      {
        file: '/project/foo.ts',
        symbols: [],
        type: AnalysisResultTypeEnum.DEFINITELY_USED,
      }
    ])
  });
});
