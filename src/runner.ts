import { fix } from './fixer';
import minimist from "minimist";
import path from "path";
import JSON5 from "json5";
import fs from "fs";

import { analyze } from "./analyzer";
import { initialize } from "./initializer";
import { State } from "./state";
import { present } from "./presenter";

export const run = (argv = process.argv.slice(2), output = console.log) => {
  const config = minimist(argv);
  const tsConfigPath = config.p || "tsconfig.json";
  const { project } = initialize(path.join(process.cwd(), tsConfigPath));
  const tsConfigJSON = JSON5.parse(fs.readFileSync(path.join(process.cwd(), tsConfigPath), "utf-8"));

  const entrypoints: string[] = tsConfigJSON?.files?.map((file: string) => path.join(process.cwd(), file)) || [];

  const state = new State();

  analyze(project, state.onResult, entrypoints);

  const presented = present(state);

  presented.forEach(value => {
    output(value);
  });

  if (config.fix) {
    fix(state);
  }
};
