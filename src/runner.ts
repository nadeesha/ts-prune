import * as minimist from "minimist";
import * as path from "path";
import { filter } from "rxjs/operators";

import { analyze } from "./analyzer";
import { initialize } from "./initializer";

export const run = (
  argv = process.argv.slice(2),
  outputStream = process.stdout
) => {
  const tsconfigPath = minimist(argv).p || "tsconfig.json";

  const { project, writer } = initialize(
    path.join(process.cwd(), tsconfigPath),
    outputStream
  );

  analyze(project)
    .pipe(filter(val => val.unused.length > 0))
    .subscribe(value => console.log(value));
};
