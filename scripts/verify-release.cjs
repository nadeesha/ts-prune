const { execFileSync } = require("node:child_process");
const { appendFileSync } = require("node:fs");

const tag = process.env.RELEASE_TAG ?? "";
if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) {
  throw new Error("Enter an existing stable version tag, such as v1.2.3");
}

const commit = execFileSync("git", [
  "rev-parse", "--verify", `refs/tags/${tag}^{commit}`,
], { encoding: "utf8" }).trim();
const pkg = JSON.parse(execFileSync("git", ["show", `${commit}:package.json`], { encoding: "utf8" }));
if (pkg.name !== "ts-prune") throw new Error("Release package must be ts-prune");
if (tag !== `v${pkg.version}`) throw new Error("Release tag must match package.json version");
if (process.env.RELEASE_WORKFLOW_COMMIT !== commit) {
  throw new Error(`Release workflow must run from the tagged commit for npm provenance; select a matching branch or use --ref ${tag}`);
}

appendFileSync(process.env.GITHUB_OUTPUT, `commit=${commit}\n`);
console.log(`Validated ${tag} at ${commit}`);
