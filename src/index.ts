#!/usr/bin/env node
export { IConfigInterface } from "./configurator";
export {run} from "./runner";

import { getConfig } from "./configurator";
import { run } from "./runner";

run(getConfig());
