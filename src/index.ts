#!/usr/bin/env node
import { cosmiconfigSync }  from "cosmiconfig";
import program  from "commander";

import { run } from "./runner";
import { ConfigInterface } from "./config.interface";

const cliConfig = program
    .option('-p, --project [project]', 'TS project configuration file (tsconfig.json)')
    .parse(process.argv)

const moduleName = 'ts-prune';
const explorerSync = cosmiconfigSync(moduleName);
const fileConfig = explorerSync.search();

const config: ConfigInterface = {
    project: 'tsconfig.json',
    ...cliConfig.project ? cliConfig : fileConfig
};

run(config);
