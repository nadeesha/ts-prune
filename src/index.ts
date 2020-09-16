#!/usr/bin/env node

import { getConfig } from "./configurator";
import { run } from "./runner";

run(getConfig());
