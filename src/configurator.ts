import { cosmiconfigSync } from "cosmiconfig";
import program from "commander";
export interface IConfigInterface {
  project?: string;
  ignore?: string;
  error?: string;
  skip?: string;
  includeUsed?: boolean;
}

export const getConfig = () => {
  program
    // .allowUnknownOption() // required for tests passing in unknown options (ex: https://github.com/nadeesha/ts-prune/runs/1125728070)
    // @ts-expect-error
    .option(
      "-p, --project [project]",
      "TS project configuration file (tsconfig.json)",
      "tsconfig.json"
    )
    .option("-i, --ignore [regexp]", "Path ignore RegExp pattern")
    .option("-e, --error", "Return error code if unused exports are found")
    .option(
      "-u, --includeUsed",
      "Include used exports in output, if not provided only unused exports are included",
      false
    )
    .option(
      "-s, --skip [regexp]",
      "skip these files when determining whether code is used"
    )
    .parse(process.argv);
  // @ts-expect-error
  const cliConfig = program.opts();

  const defaultConfig = {
    project: "tsconfig.json",
    includeUsed: false,
  };

  const moduleName = "ts-prune";
  const explorerSync = cosmiconfigSync(moduleName);
  const fileConfig = explorerSync.search()?.config;

  const config: IConfigInterface = {
    ...defaultConfig,
    ...fileConfig,
    ...cliConfig,
  };

  return config;
};
