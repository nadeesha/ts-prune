import { Project } from "ts-morph";
import { getExported } from "./analyzer";

const setup = (content: string): ReturnType<typeof getExported> => {
  const project = new Project();
  // this won't be created on disk: https://github.com/dsherret/ts-morph/issues/649#issuecomment-503766160
  const file = project.createSourceFile("tempfile.ts", content);
  return getExported(file);
};

test("no leading comment", () => {
  expect(
    setup(`
    export const foo = 2
    `)
  ).toHaveLength(1);
});

test("just leading ignore-comment", () => {
  expect(
    setup(`
    //ts-prune-ignore-next
    export const foo = 2
    `)
  ).toHaveLength(0);
});

test("leading ignore-comment with compact JSDoc first", () => {
  expect(
    setup(`
    /** Foo is foo */
    //ts-prune-ignore-next
    export const foo = 2
    `)
  ).toHaveLength(0);
});
test("leading ignore-comment with full-length JSDoc first", () => {
  expect(
    setup(`
    /** 
     * Foo is foo 
     */
    //ts-prune-ignore-next
    export const foo = 2
    `)
  ).toHaveLength(0);
});
