import { cosmiconfigSync, defaultLoadersSync, getDefaultSearchPlacesSync, LoadersSync, OptionsSync } from "cosmiconfig";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { compileFunction } from "node:vm";
import { ts } from "ts-morph";
import { formatHelp, parseCli } from "./cli";

export interface IConfigInterface {
  project?: string;
  ignore?: boolean | string;
  error?: boolean | string;
  skip?: boolean | string;
  unusedInModule?: boolean | string;
}

/** Keep TypeScript config support without requiring a second compiler at runtime. */
function loadTypeScriptConfig(filepath: string, content: string): unknown {
  let compilerOptions: ts.CompilerOptions = {};
  const tsconfigPath = ts.findConfigFile(dirname(filepath), ts.sys.fileExists);
  if (tsconfigPath) {
    const { config, error } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    if (error) throw new Error(`Error in ${tsconfigPath}: ${ts.flattenDiagnosticMessageText(error.messageText, "\n")}`);
    compilerOptions = ts.convertCompilerOptionsFromJson(config.compilerOptions ?? {}, dirname(tsconfigPath)).options;
  }
  const { outputText } = ts.transpileModule(content, {
    fileName: filepath,
    compilerOptions: { ...compilerOptions, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, noEmit: false },
  });
  const configModule = { exports: {} as { default?: unknown } };
  const evaluate = compileFunction(outputText, ["require", "module", "exports", "__filename", "__dirname"], { filename: filepath });
  evaluate(createRequire(filepath), configModule, configModule.exports, filepath, dirname(filepath));
  return configModule.exports.default;
}

function getProperty(value: unknown, property: string | string[]): unknown {
  if (typeof property === "string" && value !== null && typeof value === "object" && Object.hasOwn(value, property)) {
    return (value as Record<string, unknown>)[property];
  }
  const parts = typeof property === "string" ? property.split(".") : property;
  return parts.reduce<unknown>((current, part) => current !== null && typeof current === "object"
    ? (current as Record<string, unknown>)[part] : undefined, value);
}

/** v8 used these meta configuration names; v10 moved them into .config/. */
function getLegacyMetaConfig(): { options: Partial<OptionsSync>; config: unknown } | undefined {
  for (const filename of ["package.json", ".config.json", ".config.yaml", ".config.yml", ".config.js", ".config.ts", ".config.cjs", ".config.mjs"]) {
    const filepath = join(process.cwd(), filename);
    let contents: string;
    try {
      contents = readFileSync(filepath, "utf8");
    } catch (error) {
      if (["ENOENT", "EISDIR", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) continue;
      throw error;
    }
    const extension = extname(filename);
    const loader = extension === ".ts" ? loadTypeScriptConfig : (defaultLoadersSync as LoadersSync)[extension] ?? defaultLoadersSync[".js"];
    const loaded: unknown = contents.trim() ? loader(filepath, contents) : undefined;
    if (filename === "package.json") {
      // Package meta configuration takes precedence; cosmiconfig handles that format itself.
      const packageMeta = getProperty(loaded, "cosmiconfig");
      if (loaded === undefined || (packageMeta !== undefined && packageMeta !== null)) return undefined;
      continue;
    }
    const options = (getProperty(loaded, "cosmiconfig") ?? {}) as Partial<OptionsSync>;
    if (options.loaders) throw new Error("Can not specify loaders in meta config file");
    return { options, config: getProperty(loaded, options.packageProp ?? "ts-prune") };
  }
  return undefined;
}

function getFileConfig(): IConfigInterface | undefined {
  const meta = getLegacyMetaConfig();
  if (meta?.config !== undefined && meta.config !== null) return meta.config as IConfigInterface;
  const { stopDir = homedir(), searchPlaces = getDefaultSearchPlacesSync("ts-prune"), ...options } = meta?.options ?? {};
  const explorer = cosmiconfigSync("ts-prune", {
    ...options,
    // v10 defaults to one directory, while its global strategy adds an XDG fallback.
    // Search each ancestor explicitly to retain v8's home/root stopping behavior.
    searchStrategy: "none",
    searchPlaces: searchPlaces.map((place) => place.replace("{name}", "ts-prune")),
    loaders: { ".ts": loadTypeScriptConfig },
  });
  let directory = process.cwd();
  const home = resolve(stopDir);
  while (true) {
    const result = explorer.search(directory);
    if (result) return result.config as IConfigInterface;
    const parent = dirname(directory);
    if (directory === home || parent === directory) return undefined;
    directory = parent;
  }
}

export const getConfig = (): IConfigInterface => {
  const { config: cliConfig, help } = parseCli(process.argv.slice(2));
  if (help) {
    process.stdout.write(formatHelp(basename(process.argv[1] ?? "ts-prune", ".js")));
    process.exit(0);
  }
  return {
    project: "tsconfig.json",
    ...getFileConfig(),
    ...cliConfig,
  };
};
