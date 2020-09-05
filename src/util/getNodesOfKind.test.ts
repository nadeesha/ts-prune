import { Project, ts } from "ts-morph";
import { getNodesOfKind } from "./getNodesOfKind";

const starImportSrc = `
import * as foo from './foo';
import {UseFoo} from './use-foo';

const x = foo.x;
const {y} = foo;
const {z: {a}} = foo;
const w = foo['w'];
type ABC = foo.ABC;

() => {
  () => {
    () => {
      alert(foo.y);
    }
  }
}
`;

test("should get nodes of a kind", () => {
  const project = new Project();
  const star = project.createSourceFile("/project/star.ts", starImportSrc);

  expect(
    getNodesOfKind(star, ts.SyntaxKind.PropertyAccessExpression).map((n) =>
      n.getText()
    )
  ).toEqual(["foo.x", "foo.y"]);
});
