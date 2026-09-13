import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { join, relative } from "node:path";
import { Project } from "ts-morph";
import { createProjectFixture } from "../test/project-fixture";
import { initialize } from "./initializer";

describe("initializer", () => {
  let fixture: ReturnType<typeof createProjectFixture>;
  beforeEach(() => {
    fixture = createProjectFixture({ "src/api.ts": "export const value = 1;" });
  });
  afterEach(() => fixture.cleanup());

  it("creates a real Project from the provided absolute tsconfig path", () => {
    const { project } = initialize(fixture.project);
    assert.ok(project instanceof Project);
    assert.deepEqual(project.getSourceFiles().map(file => file.getBaseName()), ["api.ts"]);
    assert.equal(project.getCompilerOptions().noLib, true);
  });

  it("handles relative tsconfig paths", () => {
    const { project } = initialize(relative(process.cwd(), fixture.project));
    assert.equal(project.getSourceFileOrThrow("api.ts").getExportSymbols()[0]?.getName(), "value");
  });

  it("handles custom tsconfig filenames", () => {
    fixture.write({ "tsconfig.build.json": '{ "include": ["src/**/*.ts"] }' });
    const { project } = initialize(join(fixture.directory, "tsconfig.build.json"));
    assert.equal(project.getSourceFiles().length, 1);
  });

  it("returns an object containing the project", () => {
    const result = initialize(fixture.project);
    assert.deepEqual(Object.keys(result), ["project"]);
    assert.ok(result.project instanceof Project);
  });

  it("propagates errors from missing project files", () => {
    assert.throws(() => initialize(join(fixture.directory, "missing.json")), /missing\.json/);
  });

  it("handles paths with spaces and special characters", () => {
    fixture.write({ "my-app #1/tsconfig.json": '{ "include": ["../src/**/*.ts"] }' });
    const { project } = initialize(join(fixture.directory, "my-app #1/tsconfig.json"));
    assert.equal(project.getSourceFiles().length, 1);
  });

  it("creates an independent project for each call", () => {
    const first = initialize(fixture.project).project;
    const second = initialize(fixture.project).project;
    assert.notEqual(first, second);
  });
});
