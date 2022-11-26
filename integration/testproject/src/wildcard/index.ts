import * as foo from "./foo";
import * as b from "./b";

const x = foo.x;
const { y } = foo;
const {
  z: { a },
} = foo;
const w = foo["w"];

console.log(x, y, a, w);
console.log(b[Math.random() < 0.5 ? "a" : "b"]);

function f(x: foo.UsedInIndex) {
  console.log(x);
}

f("x");
