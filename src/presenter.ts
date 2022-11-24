import chalk from 'chalk';
import { State } from "./state";
import { IConfigInterface } from './configurator';

type JSONOutput = {
  filePath: string;
  line?: number;
  name: string;
  usedInModule: boolean;
};

const USED_IN_MODULE = ' (used in module)';

const presentText = (jsonResults: JSONOutput[]): string[] => jsonResults.map(({ filePath, line, name, usedInModule }) =>
  `${chalk.green(filePath)}:${chalk.yellow(line)} - ${chalk.cyan(name)}`
  + (usedInModule ? `${chalk.grey(USED_IN_MODULE)}` : '')
);

const presentJSON = (jsonResults: JSONOutput[]): string[] => [JSON.stringify(jsonResults)];

export const present = (state: State, { output, ignore }: Pick<IConfigInterface, 'output' | 'ignore'>): string[] => {
  const jsonResults = state.definitelyUnused()
    .flatMap(({ file, symbols }) => {
      const filePath = file.replace(process.cwd(), "").replace(new RegExp("^/"), "");

      if(typeof ignore !== 'undefined' && filePath.match(ignore)) {
        return [];
      }

      return symbols.map(({ name, line, usedInModule }): JSONOutput => ({
        filePath,
        line,
        name,
        usedInModule
      }));
    });

  switch(output) {
    case 'text': return presentText(jsonResults);
    case 'json': return presentJSON(jsonResults);
  }
};
