#!/usr/bin/env node
import { cosmiconfigSync }  from "cosmiconfig";
import program  from "commander";

import { run } from "./runner";
<<<<<<< HEAD
import { ConfigInterface } from "./config.interface";
=======
import {ConfigInterface} from "./config.interface";
>>>>>>> 84907e2... feat(configuration): added cosmiconfig for file config

const cliConfig = program
    .option('-p, --project [project]', 'TS project configuration file (tsconfig.json)')
    .parse(process.argv)

const moduleName = 'ts-prune';
const explorerSync = cosmiconfigSync(moduleName);
const fileConfig = explorerSync.search();

if (!fileConfig && !cliConfig) {
    throw new Error(`Config not found.
    You can read about the configuration options here:
    https://github.com/nadeesha/ts-prune#configuration
  `)
}

const config: ConfigInterface = {
    project: 'tsconfig.json',
    ...cliConfig.project ? cliConfig : fileConfig
};

run(config);
