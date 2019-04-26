import { getUnused } from "./getUnused";
import { baz } from "./unused";

console.log(getUnused().join("\n"));
