import minimist from "minimist";
import path from "path";

import { analyze } from "./analyzer";
import { initialize } from "./initializer";
import { State } from "./state";
import { present } from "./presenter";

export const run = (argv = process.argv.slice(2), output = console.log) => {
  const tsConfigPath = minimist(argv).p || "tsconfig.json";
  const { project } = initialize(path.join(process.cwd(), tsConfigPath));

  const state = new State();

  analyze(project, state.onResult);

  present(state).map(value => {
    console.log(value);
    output(value);
  });
};
