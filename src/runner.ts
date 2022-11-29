import path from "path";
import JSON5 from "json5";
import fs from "fs";

import { analyze } from "./analyzer";
import { initialize } from "./initializer";
import { State } from "./state";
import { present } from "./presenter";
import { IConfigInterface } from "./configurator";

export const run = (config: IConfigInterface, output = console.log) => {
  const tsConfigPath = path.resolve(config.project);
  const { project } = initialize(tsConfigPath);
  const tsConfigJSON = JSON5.parse(fs.readFileSync(tsConfigPath, "utf-8"));

  const entryPoints: string[] =
    tsConfigJSON?.files?.map((file: string) =>
      path.resolve(path.dirname(tsConfigPath), file)
    ) || [];

  const state = new State();

  analyze(project, state.onResult, entryPoints, config);

  const presented = present(state);

  const filterIgnored =
    config.ignore !== undefined
      ? presented.filter((file) => !file.match(config.ignore))
      : presented;

  filterIgnored.forEach((value) => {
    output(value);
  });
  return filterIgnored.length;
};
