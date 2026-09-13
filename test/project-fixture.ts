import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export const createProjectFixture = (files: Record<string, string> = {}) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "ts-prune fixture-")));
  const write = (entries: Record<string, string>) => {
    for (const [relativePath, content] of Object.entries(entries)) {
      const filePath = join(directory, relativePath);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, content);
    }
  };
  write({
    "tsconfig.json": JSON.stringify({
      compilerOptions: { noLib: true },
      include: ["src/**/*.ts"],
    }),
    ...files,
  });
  return {
    directory,
    project: join(directory, "tsconfig.json"),
    write,
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
};
