#!/usr/bin/env node
import { cosmiconfigSync } from "cosmiconfig";
import program from "commander";

import { run } from "./runner";

interface IConfigInterface {
    project?: string;
    ignore?: string;
}

const cliConfig = program
    .option('-p, --project [project]', 'TS project configuration file (tsconfig.json)', 'tsconfig.json')
    .option('-i, --ignore [regexp]', 'Path ignore RegExp pattern')
    .parse(process.argv)

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

run(config);
