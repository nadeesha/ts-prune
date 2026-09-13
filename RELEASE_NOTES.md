# ts-prune 0.11.0

This minor release modernizes ts-prune while retaining its CLI options, CommonJS API, and unused-export output format.

## Runtime requirement

Node.js **22.18 or newer** is required. Development uses Node 26; CI covers Node 22/24/26 on Linux and Node 26 on macOS and Windows. Users on older Node versions should remain on 0.10.x.

## Changes

- Upgrade to ts-morph 28 and cosmiconfig 10, preserving configuration formats, ancestor discovery, and TypeScript configuration support.
- Reduce direct runtime dependencies from four to two and the production dependency tree from 54 packages to 14. Replace Commander and JSON5 with tested project code and the existing TypeScript parser.
- Replace Jest and Babel with Node's test runner and strict TypeScript compilation. The suite contains 256 tests; local source coverage is 98.84% of lines.
- Fix configuration-file project settings being overwritten by implicit CLI defaults and prevent CLI option state leaking between calls.
- Respect `unusedInModule: false` while retaining existing string option behavior.
- Correct local-use counting for exports named `constructor`, `toString`, `hasOwnProperty`, and `__proto__`.
- Preserve large piped CLI output by allowing stdout to flush before exit, and normalize output paths on Windows.
- Validate the packed CLI, CommonJS API, executable shim, and TypeScript declarations in a fresh consumer project.

TypeScript 6.0.3 remains the build compiler until the TypeScript ESLint parser supports TypeScript 7. The analyzer uses the compiler bundled with ts-morph.
