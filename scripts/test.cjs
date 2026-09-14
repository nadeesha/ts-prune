const { readdirSync, rmSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { join, resolve } = require("node:path");

const root = resolve(__dirname, "..");
const options = new Set(process.argv.slice(2));
for (const option of options) {
  if (!["--unit", "--integration", "--coverage"].includes(option)) {
    throw new Error(`Unknown test option: ${option}`);
  }
}

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function testFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? testFiles(file) : /\.(test|spec)\.js$/.test(file) ? [file] : [];
  }).sort();
}

run([join(__dirname, "build.cjs")]);
rmSync(join(root, ".test-build"), { recursive: true, force: true });
run([require.resolve("typescript/bin/tsc"), "-p", "tsconfig.test.json"]);
const files = [
  ...(!options.has("--integration") ? testFiles(join(root, ".test-build/src")) : []),
  ...(!options.has("--unit") ? testFiles(join(root, ".test-build/test")) : []),
];
if (!files.length) throw new Error("No tests selected");
run([
  "--test", "--test-concurrency=2",
  ...(options.has("--coverage") ? [
    "--experimental-test-coverage",
    "--test-coverage-include=**/.test-build/src/**/*.js",
    "--test-coverage-exclude=**/*.test.js",
    "--test-coverage-exclude=**/*.spec.js",
  ] : []),
  ...files,
]);
