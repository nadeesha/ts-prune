#!/usr/bin/env node
export { IConfigInterface } from "./configurator";
export { run } from "./runner";
export { ResultSymbol } from "./analyzer";

import { getConfig } from "./configurator";
import { run } from "./runner";

// Only run CLI logic when this file is executed directly
if (require.main === module) {
    const config = getConfig();
    const resultCount = run(config);

    if (resultCount > 0 && config.error){
        process.exit(1);
    } else {
        process.exit(0);
    }
}
