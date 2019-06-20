import * as minimist from "minimist";
import * as path from "path";
import { filter, map, flatMap } from "rxjs/operators";

import { analyze } from "./analyzer";
import { initialize } from "./initializer";
import { writer as lineWriter } from "./io";

export const createExecPipeline = (tsconfigPath = "tsconfig.json") => {
  const { project } = initialize(path.join(process.cwd(), tsconfigPath));

  return analyze(project)
    .pipe(filter(val => val.unused.length > 0))
    .pipe(
      map(({ unused, file }) =>
        unused.map(symbol => [file, symbol].join(" ... "))
      )
    );
};

export const run = (
  argv = process.argv.slice(2),
  outputStream = process.stdout
) => {
  const writeLine = lineWriter(outputStream);
  const pipeline = createExecPipeline(minimist(argv).p);

  pipeline.subscribe(lines => lines.map(writeLine));
};
