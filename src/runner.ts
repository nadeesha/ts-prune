import path from "path";
import JSON5 from "json5";
import fs from "fs";

import { analyze } from "./analyzer";
import { initialize } from "./initializer";
import { State } from "./state";
import { present } from "./presenter";
import { IConfigInterface } from "./configurator";
import { fix } from './fixer';

export const run = (config: IConfigInterface, output = console.log) => {
  const tsConfigPath = config.project;
  const { project } = initialize(path.join(process.cwd(), tsConfigPath));
  const tsConfigJSON = JSON5.parse(fs.readFileSync(path.join(process.cwd(), tsConfigPath), "utf-8"));

  const entrypoints: string[] = tsConfigJSON?.files?.map((file: string) => path.join(process.cwd(), file)) || [];

  const state = new State();

  analyze(project, state.onResult, entrypoints);

  const presented = present(state);

  const filterIgnored = config.ignore !== undefined ? presented.filter(file => !file.match(config.ignore)) : presented;

  filterIgnored.forEach(value => {
    output(value);
  });

  if (config.fix) {
    fix(state);
  }
};
