import B, { foo } from "./B";
import "./D";
import { foo as foos } from "./C";

console.log(foo, foos, B);
