import B, { foo } from "./B";
import "./D";
import { foo as foos } from "./C";
import type { FooType } from "./B";

type BarType = FooType;

console.log(foo, foos, B);
