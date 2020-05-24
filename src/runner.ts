import minimist from "minimist";
import path from "path";

import { analyze } from "./analyzer";
import { initialize } from "./initializer";
import { State } from "./state";
import { present } from "./presenter";

export const run = (argv = process.argv.slice(2), output = console.log) => {
  const tsConfigPath = minimist(argv).p || "tsconfig.json";
  const { project } = initialize(path.join(process.cwd(), tsConfigPath));
  const entrypoints: string[] = require(path.join(process.cwd(), tsConfigPath))?.files?.map((file: string) => path.join(process.cwd(), file));

  const state = new State();

  analyze(project, state.onResult, entrypoints);

  const presented = present(state);

  presented.forEach(value => {
    output(value);
  });
};
