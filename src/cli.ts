import type { IConfigInterface } from "./configurator";

type ValueOption = "project" | "ignore" | "skip";
type FlagOption = "error" | "unusedInModule";

const valueOptions = new Map<string, ValueOption>([
  ["-p", "project"], ["--project", "project"],
  ["-i", "ignore"], ["--ignore", "ignore"],
  ["-s", "skip"], ["--skip", "skip"],
]);
const flagOptions = new Map<string, FlagOption>([
  ["-e", "error"], ["--error", "error"],
  ["-u", "unusedInModule"], ["--unusedInModule", "unusedInModule"],
]);

const isOption = (argument: string) => argument.length > 1 && argument.startsWith("-");

/** Parse only explicit options, retaining the optional-value behavior of Commander 6. */
export function parseCli(arguments_: readonly string[]): { config: IConfigInterface; help: boolean } {
  const config: IConfigInterface = {};
  const argumentsQueue = [...arguments_];
  const unknown: string[] = [];
  let seenUnknown = false;

  const setValue = (name: ValueOption, value?: string) => {
    if (name === "project") {
      config.project = value ?? config.project ?? "tsconfig.json";
    } else {
      config[name] = value ?? config[name] ?? true;
    }
  };

  while (argumentsQueue.length > 0) {
    const argument = argumentsQueue.shift()!;
    if (argument === "--") {
      // Commander recognizes help after a terminator only when an unknown option came first.
      if (seenUnknown) unknown.push(...argumentsQueue);
      break;
    }

    const valueOption = valueOptions.get(argument);
    if (valueOption) {
      const next = argumentsQueue[0];
      setValue(valueOption, next !== undefined && !isOption(next) ? argumentsQueue.shift() : undefined);
      continue;
    }
    const flagOption = flagOptions.get(argument);
    if (flagOption) {
      config[flagOption] = true;
      continue;
    }

    if (argument.length > 2 && argument.startsWith("-") && !argument.startsWith("--")) {
      const short = argument.slice(0, 2);
      const valueName = valueOptions.get(short);
      if (valueName) {
        setValue(valueName, argument.slice(2));
        continue;
      }
      const flagName = flagOptions.get(short);
      if (flagName) {
        config[flagName] = true;
        argumentsQueue.unshift(`-${argument.slice(2)}`);
        continue;
      }
    }

    const equals = argument.indexOf("=");
    if (argument.startsWith("--") && equals > 2) {
      const name = valueOptions.get(argument.slice(0, equals));
      if (name) {
        setValue(name, argument.slice(equals + 1));
        continue;
      }
    }

    if (isOption(argument)) seenUnknown = true;
    if (seenUnknown) unknown.push(argument);
  }

  return { config, help: unknown.includes("-h") || unknown.includes("--help") };
}

export function formatHelp(name: string): string {
  return `Usage: ${name} [options]

Options:
  -p, --project [project]  TS project configuration file (tsconfig.json)
                           (default: "tsconfig.json")
  -i, --ignore [regexp]    Path ignore RegExp pattern
  -e, --error              Return error code if unused exports are found
  -s, --skip [regexp]      skip these files when determining whether code is
                           used
  -u, --unusedInModule     Skip files that are used in module (marked as \`used
                           in module\`)
  -h, --help               display help for command
`;
}
