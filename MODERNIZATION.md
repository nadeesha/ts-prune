# Modernization results

The existing CommonJS API and CLI output are retained. Development now uses Node 26.8.2; the minimum supported runtime is Node 22.18. Existing uncommitted CLI and test changes were preserved and migrated.

## Dependencies

| Measure | Before | After |
| --- | ---: | ---: |
| Direct runtime dependencies | 4 | 2 |
| Direct development dependencies | 15 | 6 |
| All lockfile package entries, excluding the root | 1,313 | 572 |
| Production lockfile package entries | 54 | 14 |

Removed Commander, JSON5 and its types, Jest and its types, Babel and its test transformer, ts-node, and unused Prettier tooling. The runtime retains cosmiconfig 10 and ts-morph 28. ESLint 10 uses flat configuration; semantic-release 25 preserves the local release workflow.

The build remains on TypeScript 6.0.3 because the current TypeScript ESLint parser requires a compiler version below 6.1. The analyzer uses the compiler bundled with ts-morph. The lockfile includes the patched transitive picomatch version; a clean install and full npm audit reported zero vulnerabilities.

## Compatibility and fixes

- Captured 45 Commander argument scenarios and original cosmiconfig format/search expectations before replacing or upgrading dependencies. Permanent fixtures let these tests run without the old packages.
- Kept config formats, ancestor discovery, TypeScript configuration compilation/options, and legacy meta configuration precedence.
- Fixed file configuration being overwritten by an implicit CLI project default, and prevented parsed CLI state from leaking between calls.
- Boolean `unusedInModule: false` now disables filtering; existing string values, including the empty string, retain their previous behavior. Public option types accept booleans alongside strings.
- Preserved raw tsconfig `files` entrypoints, accepted comments/trailing commas, and errors for malformed or empty config documents using the existing TypeScript parser.
- Added failing regressions before fixing inherited-key export counting, Windows path formatting, and truncation of large piped CLI output. The CLI now sets `process.exitCode` so output can finish flushing.
- Corrected two stale line-number expectations in the legacy output fixture to match the original implementation's measured output.

## Validation

After a clean `npm ci`, `npm run check` passed on macOS with Node 22.23.2, 24.21.0, and 26.8.2. Each run includes read-only lint, strict production/test type checks, a clean build, and all 256 tests: zero failures, skips, cancellations, or todos.

`npm run test:coverage` also passed all 256 tests on Node 26, reporting 98.84% line, 92.37% branch, and 98.81% function coverage for compiled source exercised by test workers. CLI subprocess behavior is verified by integration tests separately.

CI is configured for Node 22/24/26 on Linux and Node 26 on macOS and Windows. Linux and Windows jobs have not been executed locally. Node runtimes used for local verification were checksum-verified official binaries in a temporary directory; the machine-wide Node installation was unchanged.

The npm package smoke test builds a tarball, installs only its production dependencies into a temporary consumer, and verifies the executable shim, help, output, error exit code, CommonJS API, and published TypeScript declarations. Packaging excludes tests and source files. The test and packaging commands never globally link the package or delete its lockfile.

See the development commands in README.md and the updated local release process in PUBLISHING.md. Release status is tracked by version tags and the Test GitHub Actions workflow.
