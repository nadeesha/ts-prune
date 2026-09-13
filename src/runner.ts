import path from "node:path";
import fs from "node:fs";
import { ts } from "ts-morph";

import { analyze } from "./analyzer";
import { initialize } from "./initializer";
import { State } from "./state";
import { present, USED_IN_MODULE } from "./presenter";
import { IConfigInterface } from "./configurator";

export const run = (config: IConfigInterface, output = console.log) => {
  const tsConfigPath = path.resolve(config.project ?? "tsconfig.json");
  const { project } = initialize(tsConfigPath);
  const configText = fs.readFileSync(tsConfigPath, "utf8");
  const parsed = ts.parseConfigFileTextToJson(tsConfigPath, configText);
  if (parsed.error) {
    throw new Error(ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n"));
  }
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, configText);
  if (scanner.scan() === ts.SyntaxKind.EndOfFileToken) {
    throw new SyntaxError("Unexpected end of tsconfig file");
  }
  // Only raw `files` entries are public entrypoints. Resolved source files and
  // inherited `files` would incorrectly hide unused exports from the report.
  const tsConfigJSON = parsed.config as { files?: string[] };

  const entrypoints: string[] =
    tsConfigJSON?.files?.map((file: string) =>
      path.resolve(path.dirname(tsConfigPath), file)
    ) || [];

  const state = new State();

  analyze(project, state.onResult, entrypoints, config.skip ? String(config.skip) : undefined);

  const presented = present(state);

  const filterUsedInModule = config.unusedInModule !== undefined && config.unusedInModule !== false
    ? presented.filter(file => !file.includes(USED_IN_MODULE))
    : presented;
  const filterIgnored = config.ignore !== undefined
    ? filterUsedInModule.filter(file => !file.match(String(config.ignore)))
    : filterUsedInModule;

  filterIgnored.forEach(value => {
    output(value);
  });
  return filterIgnored.length;
};
