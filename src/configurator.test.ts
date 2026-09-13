import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { getConfig, IConfigInterface } from "./configurator";
import { formatHelp, parseCli } from "./cli";

const fixtureRoot = join(process.cwd(), "test/fixtures");
const cliFixture = JSON.parse(readFileSync(join(fixtureRoot, "cli-commander6.json"), "utf8")) as {
  scenarios: { args: string[]; config: IConfigInterface; stdout: string; stderr: string; exitCode: number | null }[];
};
const configFixture = JSON.parse(readFileSync(join(fixtureRoot, "cli-cosmiconfig8.json"), "utf8")) as {
  scenarios: { filename: string; contents: string; config: IConfigInterface }[];
};
const metaFixture = JSON.parse(readFileSync(join(fixtureRoot, "cli-cosmiconfig8-meta.json"), "utf8")) as {
  scenarios: { files: Record<string, string>; config: IConfigInterface | null }[];
};

function withConfigDirectory(run: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), "ts-prune-config-"));
  const originalCwd = process.cwd();
  const originalArgv = process.argv;
  try {
    process.chdir(directory);
    process.argv = [process.execPath, "ts-prune"];
    run(directory);
  } finally {
    process.chdir(originalCwd);
    process.argv = originalArgv;
    rmSync(directory, { recursive: true, force: true });
  }
}

function writeConfig(directory: string, filename: string, contents: string) {
  const filepath = join(directory, filename);
  mkdirSync(dirname(filepath), { recursive: true });
  writeFileSync(filepath, contents);
}

describe("CLI compatibility captured from Commander 6", () => {
  for (const scenario of cliFixture.scenarios) {
    it(`preserves ${JSON.stringify(scenario.args)}`, () => {
      const parsed = parseCli(scenario.args);
      assert.deepEqual({ project: "tsconfig.json", ...parsed.config }, scenario.config);
      assert.equal(parsed.help ? formatHelp("ts-prune") : "", scenario.stdout);
      assert.equal(parsed.help ? 0 : null, scenario.exitCode);
      assert.equal(scenario.stderr, "");
    });
  }

  it("does not insert defaults into explicitly supplied options", () => {
    assert.deepEqual(parseCli([]).config, {});
    assert.deepEqual(parseCli(["-e"]).config, { error: true });
    assert.deepEqual(parseCli(["-p"]).config, { project: "tsconfig.json" });
  });

  it("formats help using the executable name", () => {
    assert.match(formatHelp("custom-name"), /^Usage: custom-name \[options\]/);
  });

  for (const flag of ["-h", "--help"]) {
    it(`prints ${flag} and exits before loading invalid configuration`, () => {
      withConfigDirectory((directory) => {
        writeConfig(directory, ".ts-prunerc.json", "{invalid");
        const result = spawnSync(process.execPath, ["-e", `process.argv = [process.execPath, '/bin/ts-prune', ${JSON.stringify(flag)}]; require(${JSON.stringify(join(__dirname, "configurator.js"))}).getConfig(); process.exit(99);`], {
          cwd: directory,
          encoding: "utf8",
        });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stdout, formatHelp("ts-prune"));
        assert.equal(result.stderr, "");
      });
    });
  }
});

describe("configuration files and precedence", () => {
  for (const [index, scenario] of metaFixture.scenarios.entries()) {
    it(`preserves legacy meta configuration scenario ${index + 1}`, () => {
      withConfigDirectory((directory) => {
        for (const [filename, contents] of Object.entries(scenario.files)) writeConfig(directory, filename, contents);
        assert.deepEqual(getConfig(), { project: "tsconfig.json", ...scenario.config });
      });
    });
  }

  it("rejects loaders in legacy meta configuration", () => {
    withConfigDirectory((directory) => {
      writeConfig(directory, ".config.json", '{"cosmiconfig":{"loaders":{}}}');
      assert.throws(() => getConfig(), /Can not specify loaders in meta config file/);
    });
  });

  it("returns defaults when no configuration exists", () => {
    withConfigDirectory(() => assert.deepEqual(getConfig(), { project: "tsconfig.json" }));
  });

  for (const scenario of configFixture.scenarios) {
    it(`loads ${scenario.filename} as cosmiconfig 8 did`, () => {
      withConfigDirectory((directory) => {
        writeConfig(directory, scenario.filename, scenario.contents);
        assert.deepEqual(getConfig(), { project: "tsconfig.json", ...scenario.config });
      });
    });
  }

  it("supports TypeScript enums, type annotations, and relative CommonJS imports", () => {
    withConfigDirectory((directory) => {
      writeConfig(directory, "pattern.cjs", 'module.exports = "generated";');
      writeConfig(directory, ".ts-prunerc.ts", `
        import pattern = require("./pattern.cjs");
        enum Project { Main = "custom.json" }
        const error: boolean = false;
        export default { project: Project.Main, ignore: pattern, error };
      `);
      assert.deepEqual(getConfig(), { project: "custom.json", ignore: "generated", error: false });
    });
  });

  for (const esModuleInterop of [true, false]) {
    it(`honors esModuleInterop=${esModuleInterop} for TypeScript config imports`, () => {
      withConfigDirectory((directory) => {
        writeConfig(directory, "tsconfig.json", JSON.stringify({ compilerOptions: { esModuleInterop } }));
        writeConfig(directory, "pattern.cjs", esModuleInterop ? 'module.exports = "generated";' : 'exports.default = "generated";');
        writeConfig(directory, ".ts-prunerc.ts", 'import pattern from "./pattern.cjs"; export default {ignore: pattern};');
        assert.equal(getConfig().ignore, "generated");
      });
    });
  }

  it("does not overwrite sibling files when loading TypeScript configuration", () => {
    withConfigDirectory((directory) => {
      const sibling = 'module.exports = { ignore: "sibling" };';
      writeConfig(directory, ".ts-prunerc.ts", 'export default {ignore: "typescript"};');
      writeConfig(directory, ".ts-prunerc.cjs", sibling);
      assert.equal(getConfig().ignore, "typescript");
      assert.equal(readFileSync(join(directory, ".ts-prunerc.cjs"), "utf8"), sibling);
    });
  });

  it("reports a malformed tsconfig when loading TypeScript configuration", () => {
    withConfigDirectory((directory) => {
      writeConfig(directory, "tsconfig.json", "{invalid");
      writeConfig(directory, ".ts-prunerc.ts", "export default {};");
      assert.throws(() => getConfig(), /Error in .*tsconfig\.json/);
    });
  });

  it("preserves a project from file configuration when no CLI override is supplied", () => {
    withConfigDirectory((directory) => {
      writeConfig(directory, ".ts-prunerc.json", JSON.stringify({ project: "file.json", ignore: "file", error: false, unusedInModule: false }));
      assert.deepEqual(getConfig(), { project: "file.json", ignore: "file", error: false, unusedInModule: false });
    });
  });

  it("merges defaults, file configuration, then only explicit CLI options", () => {
    withConfigDirectory((directory) => {
      writeConfig(directory, ".ts-prunerc.json", JSON.stringify({ project: "file.json", ignore: "file-ignore", skip: "file-skip", error: false, unusedInModule: false }));
      process.argv.push("-p", "cli.json", "-e", "-u");
      assert.deepEqual(getConfig(), { project: "cli.json", ignore: "file-ignore", skip: "file-skip", error: true, unusedInModule: true });
    });
  });

  it("allows an explicitly requested default project to override file configuration", () => {
    withConfigDirectory((directory) => {
      writeConfig(directory, ".ts-prunerc.json", '{"project":"file.json"}');
      process.argv.push("-p");
      assert.equal(getConfig().project, "tsconfig.json");
    });
  });

  it("does not retain CLI values between calls", () => {
    withConfigDirectory(() => {
      process.argv.push("--project", "first.json", "--error");
      assert.deepEqual(getConfig(), { project: "first.json", error: true });
      process.argv = [process.execPath, "ts-prune", "--ignore", "second"];
      assert.deepEqual(getConfig(), { project: "tsconfig.json", ignore: "second" });
    });
  });

  for (const filename of [".ts-prunerc.json", ".ts-prunerc.cjs", ".ts-prunerc.ts"]) {
    it(`reloads changed ${filename} configuration between calls`, () => {
      withConfigDirectory((directory) => {
        const contents = (ignore: string) => filename.endsWith(".json") ? JSON.stringify({ ignore }) : filename.endsWith(".ts") ? `export default { ignore: "${ignore}" };` : `module.exports = { ignore: "${ignore}" };`;
        writeConfig(directory, filename, contents("first"));
        assert.equal(getConfig().ignore, "first");
        writeConfig(directory, filename, contents("second"));
        assert.equal(getConfig().ignore, "second");
      });
    });
  }

  it("searches ancestors even across a nested package.json boundary", () => {
    withConfigDirectory((directory) => {
      writeConfig(directory, ".ts-prunerc.json", '{"ignore":"parent"}');
      writeConfig(directory, "child/package.json", '{"name":"nested-package"}');
      process.chdir(join(directory, "child"));
      assert.equal(getConfig().ignore, "parent");
      writeConfig(directory, "child/.ts-prunerc.json", '{"ignore":"nearest"}');
      assert.equal(getConfig().ignore, "nearest");
    });
  });

  it("prioritizes package configuration, then rc files, then .config, then named configs", () => {
    withConfigDirectory((directory) => {
      const configurations = [
        ["package.json", '{"ts-prune":{"ignore":"package"}}', "package"],
        [".ts-prunerc", "ignore: rc", "rc"],
        [".ts-prunerc.json", '{"ignore":"json"}', "json"],
        [".config/ts-prunerc.json", '{"ignore":"config-directory"}', "config-directory"],
        ["ts-prune.config.cjs", 'module.exports = {ignore:"named"};', "named"],
      ];
      for (const [filename, contents] of configurations) writeConfig(directory, filename, contents);
      for (const [filename, , expected] of configurations) {
        assert.equal(getConfig().ignore, expected);
        rmSync(join(directory, filename));
      }
    });
  });

  it("skips empty files but treats an empty object as configuration", () => {
    withConfigDirectory((directory) => {
      writeConfig(directory, ".ts-prunerc", "");
      writeConfig(directory, ".ts-prunerc.json", '{"ignore":"json"}');
      assert.equal(getConfig().ignore, "json");
      writeConfig(directory, ".ts-prunerc", "{}");
      assert.deepEqual(getConfig(), { project: "tsconfig.json" });
    });
  });

  it("ignores unknown CLI options while recognizing later supported options", () => {
    withConfigDirectory(() => {
      process.argv.push("--unknown", "value", "--ignore", "known", "--version");
      assert.deepEqual(getConfig(), { project: "tsconfig.json", ignore: "known" });
    });
  });

  for (const [filename, contents] of [[".ts-prunerc.json", "{invalid"], [".ts-prunerc.yaml", "ignore: ["], [".ts-prunerc.cjs", 'throw new Error("broken config")'], [".ts-prunerc.ts", 'throw new Error("broken config"); export default {}']]) {
    it(`propagates malformed ${filename} errors`, () => {
      withConfigDirectory((directory) => {
        writeConfig(directory, filename, contents);
        assert.throws(() => getConfig());
      });
    });
  }
});
