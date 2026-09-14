import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

describe("manual release validation", () => {
  const script = resolve("scripts/verify-release.cjs");
  let directory: string;
  const git = (...args: string[]) => execFileSync("git", [
    "-c", "user.name=Release test", "-c", "user.email=release@example.invalid",
    "-c", "commit.gpgsign=false", "-c", "tag.gpgsign=false",
    "-c", `core.hooksPath=${join(directory, "no-hooks")}`, ...args,
  ], { cwd: directory, encoding: "utf8" }).trim();
  const commitPackage = (name: string, version: string) => {
    writeFileSync(join(directory, "package.json"), JSON.stringify({ name, version }));
    git("add", "package.json");
    git("commit", "--quiet", "-m", "Package fixture");
    return git("rev-parse", "HEAD");
  };
  const verify = (tag: string, workflowCommit = git("rev-parse", "HEAD")) => spawnSync(process.execPath, [script], {
    cwd: directory,
    encoding: "utf8",
    env: { ...process.env, RELEASE_TAG: tag, RELEASE_WORKFLOW_COMMIT: workflowCommit, GITHUB_OUTPUT: join(directory, "outputs") },
  });

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "ts-prune release-"));
    git("init", "--quiet", "--initial-branch=main");
    commitPackage("ts-prune", "1.2.3");
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));

  it("resolves an annotated tag even when the working branch has a different version", () => {
    const taggedCommit = git("rev-parse", "HEAD");
    git("tag", "-a", "v1.2.3", "-m", "Release fixture");
    commitPackage("ts-prune", "1.3.0");
    const result = verify("v1.2.3", taggedCommit);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(directory, "outputs"), "utf8"), `commit=${taggedCommit}\n`);
  });

  it("accepts an existing lightweight version tag", () => {
    git("tag", "v1.2.3");
    assert.equal(verify("v1.2.3").status, 0);
  });

  it("rejects a workflow commit that would produce incorrect npm provenance", () => {
    git("tag", "v1.2.3");
    commitPackage("ts-prune", "1.3.0");
    const result = verify("v1.2.3");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /workflow must run from the tagged commit/);
  });

  it("rejects a branch with the right name when no matching tag exists", () => {
    git("branch", "v1.2.3");
    assert.notEqual(verify("v1.2.3").status, 0);
  });

  it("rejects a tag whose package version does not match", () => {
    git("tag", "v1.2.4");
    const result = verify("v1.2.4");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must match package.json version/);
  });

  it("rejects a tag for another package", () => {
    commitPackage("another-package", "1.2.3");
    git("tag", "v1.2.3");
    const result = verify("v1.2.3");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must be ts-prune/);
  });

  for (const tag of ["", "main", "v1.2.3-beta.1", "v01.2.3", "v1.2.3\ncommit=injected", "--help"]) {
    it(`rejects invalid stable-release input ${JSON.stringify(tag)}`, () => {
      const result = verify(tag);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /existing stable version tag/);
    });
  }
});
