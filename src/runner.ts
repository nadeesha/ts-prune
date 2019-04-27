import * as minimist from "minimist";
import * as path from "path";

import { analyze } from "./analyzer";
import { initialize } from "./initializer";

export const run = (
  argv = process.argv.slice(2),
  outputStream = process.stdout
) => {
  const tsconfigPath = minimist(argv).p || "tsconfig.json";

  const { project, writer } = initialize(
    path.join(process.cwd(), tsconfigPath),
    outputStream
  );

  analyze(project, node =>
    writer(`${node.identifier} @ ${node.filePath}:${node.lineNumber}\n`)
  );
};
