import { cosmiconfigSync } from "cosmiconfig";
import program from "commander";
import pick from "lodash/fp/pick";

export interface IConfigInterface {
  project?: string;
  ignore?: string;
  error?: string;
  skip?: string;
  internalDependencies?: string[];
}

const defaultConfig: IConfigInterface = {
  project: "tsconfig.json",
  ignore: undefined,
  error: undefined,
  skip: undefined,
  internalDependencies: undefined,
}

const onlyKnownConfigOptions = pick(Object.keys(defaultConfig));


export const getConfig = () => {
  const cliConfig = onlyKnownConfigOptions(program
    .allowUnknownOption() // required for tests passing in unknown options (ex: https://github.com/nadeesha/ts-prune/runs/1125728070)
    .option('-p, --project [project]', 'TS project configuration file (tsconfig.json)')
    .option('-i, --ignore [regexp]', 'Path ignore RegExp pattern')
    .option('-e, --error', 'Return error code if unused exports are found')
    .option('-s, --skip [regexp]', 'skip these files when determining whether code is used')
    .option('-d, --internal-dependencies [[module]]', 'Internal dependencies that should be resolved to src/ instead of dist/')
    .parse(process.argv))

  const defaultConfig = {
    project: "tsconfig.json"
  }

  const moduleName = 'ts-prune';
  const explorerSync = cosmiconfigSync(moduleName);
  const fileConfig = explorerSync.search()?.config;

  const config: IConfigInterface = {
    ...defaultConfig,
    ...fileConfig,
    ...cliConfig
  };

  return config;
}
