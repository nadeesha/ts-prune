#!/usr/bin/env node
export { IConfigInterface } from "./configurator";
export { run } from "./runner";
export { ResultSymbol } from "./analyzer";
export type { JSONOutput, JSONOutputItem } from './presenter';

import { getConfig } from "./configurator";
import { run } from "./runner";

const config = getConfig();
const resultCount = run(config);

if (resultCount > 0 && config.error){
    process.exit(1);
} else {
    process.exit(0);
}
