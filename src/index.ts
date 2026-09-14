#!/usr/bin/env node
export { IConfigInterface } from "./configurator";
export { run } from "./runner";
export { ResultSymbol } from "./analyzer";

import { getConfig } from "./configurator";
import { run } from "./runner";

export const runCli = () => {
  const config = getConfig();
  const resultCount = run(config);

  // Let Node flush stdout before exiting, including when output is piped.
  process.exitCode = resultCount > 0 && config.error ? 1 : 0;
};

if (require.main === module) {
  runCli();
}
