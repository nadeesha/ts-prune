#!/usr/bin/env node

import { getConfig } from "./configurator";
import { run } from "./runner";

const config = getConfig();
const resultCount = run(config);

if (resultCount > 0 && config.error){
    process.exit(1);
} else {
    process.exit(0);
}
