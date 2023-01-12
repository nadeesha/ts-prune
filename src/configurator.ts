import { cosmiconfigSync } from "cosmiconfig";
import program from "commander";
import pick from "lodash/fp/pick";
import chalk from "chalk";

export interface IConfigInterface {
  project?: string;
  ignore?: string;
  error?: string;
  skip?: string;
  config?: string;
}

const defaultConfig: IConfigInterface = {
  project: "tsconfig.json",
  ignore: undefined,
  error: undefined,
  skip: undefined,
  config: undefined,
};

const onlyKnownConfigOptions = pick(Object.keys(defaultConfig));

export const getConfig = () => {
  const cliConfig = onlyKnownConfigOptions(
    program
      .allowUnknownOption() // required for tests passing in unknown options (ex: https://github.com/nadeesha/ts-prune/runs/1125728070)
      .option(
        "-p, --project [project]",
        "TS project configuration file (tsconfig.json)",
        "tsconfig.json"
      )
      .option("-i, --ignore [regexp]", "Path ignore RegExp pattern")
      .option("-e, --error", "Return error code if unused exports are found")
      .option(
        "-s, --skip [regexp]",
        "skip these files when determining whether code is used"
      )
      .option(
        "-c, --config [path]",
        "Path to config file (default: .ts-prunerc.json)"
      )
      .parse(process.argv)
  );

  const defaultConfig = {
    project: "tsconfig.json",
  };

  const moduleName = "ts-prune";
  const explorerSync = cosmiconfigSync(moduleName);
  let fileConfig;
  try {
    fileConfig = cliConfig.config
      ? explorerSync.load(cliConfig.config).config
      : explorerSync.search()?.config;
  } catch (error) {
    console.log(chalk.red(`Error loading config file\n${error.message}`));
    process.exit(1);
  }

  delete cliConfig.config;

  const config: IConfigInterface = {
    ...defaultConfig,
    ...fileConfig,
    ...cliConfig,
  };

  return config;
};
