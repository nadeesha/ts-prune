#!/usr/bin/env node

import { getConfig } from "./configurator";
import { run } from "./runner";

const config = getConfig();
const resultCount = run(config);
if (resultCount && config.error){
    process.exit(1);
}
