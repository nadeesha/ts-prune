import path from "path";
import JSON5 from "json5";
import fs from "fs";

import { analyze } from "./analyzer";
import { initialize } from "./initializer";
import { State } from "./state";
import { present } from "./presenter";
import { IConfigInterface } from "./configurator";

const getIgnorePatterns = (configIgnore: IConfigInterface['ignore']): string[] => {
  switch(typeof configIgnore) {
    case 'undefined': return [];
    case 'string': return [configIgnore];
    case 'object': return configIgnore;
  }
};

export const run = (config: IConfigInterface, output = console.log) => {
  const tsConfigPath = path.resolve(config.project);
  const { project } = initialize(tsConfigPath);
  const tsConfigJSON = JSON5.parse(fs.readFileSync(tsConfigPath, "utf-8"));

  const entrypoints: string[] =
    tsConfigJSON?.files?.map((file: string) =>
      path.resolve(path.dirname(tsConfigPath), file)
    ) || [];

  const state = new State();

  analyze(project, state.onResult, entrypoints, config.skip);

  const presented = present(state);

  const ignorePatterns = getIgnorePatterns(config.ignore);

  const filterIgnored = ignorePatterns.length > 0
    ? presented.filter(file => !ignorePatterns.some(pattern => file.match(pattern)))
    : presented;

  filterIgnored.forEach(value => {
    output(value);
  });
  return filterIgnored.length;
};
