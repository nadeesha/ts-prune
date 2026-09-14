# ts-prune

[![CI](https://github.com/nadeesha/ts-prune/actions/workflows/test.yml/badge.svg)](https://github.com/nadeesha/ts-prune/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/ts-prune)](https://www.npmjs.com/package/ts-prune)
[![Monthly downloads](https://img.shields.io/npm/dm/ts-prune)](https://www.npmjs.com/package/ts-prune)
[![Node.js requirement](https://img.shields.io/badge/node-%3E%3D22.18.0-339933)](#requirements)
[![License: MIT](https://img.shields.io/npm/l/ts-prune)](package.json)

Find potentially unused exports in your TypeScript project. ts-prune reads your `tsconfig.json` and reports exports with no detected use elsewhere in the project. It reports findings without changing your files.

## Requirements

Node.js 22.18 or newer and a TypeScript project with a `tsconfig.json`. JavaScript files are supported when `allowJs` is enabled in that configuration.

## Quick start

Install with your package manager:

```sh
npm install --save-dev ts-prune
# or
yarn add --dev ts-prune
# or
pnpm add --save-dev ts-prune
```

Run from your project root:

```sh
npx ts-prune
```

For a different TypeScript configuration:

```sh
npx ts-prune --project tsconfig.build.json
```

## Example

Given `src/math.ts`:

```typescript
export const add = (a: number, b: number) => a + b;
export const subtract = (a: number, b: number) => a - b;
export const multiply = (a: number, b: number) => a * b;
```

And `src/app.ts`:

```typescript
import { add } from './math';
console.log(add(2, 3));
```

ts-prune reports:

```text
src/math.ts:2 - subtract
src/math.ts:3 - multiply
```

Each line is `file:line - exportName`. Exports referenced within their own file are marked `(used in module)`; use `--unusedInModule` to hide them. Re-exports may show `undefined` as the line number when the declaration is in another file.

## CLI options

| Option | Description | Example |
| --- | --- | --- |
| `-p, --project [path]` | TypeScript configuration; defaults to `tsconfig.json` | `ts-prune -p tsconfig.build.json` |
| `-i, --ignore [regexp]` | Hide matching output lines | `ts-prune -i 'test\|spec'` |
| `-s, --skip [regexp]` | Exclude matching files from analysis and from references counted as uses | `ts-prune -s '\.test\.ts$'` |
| `-e, --error` | Exit with status 1 if any findings remain after filtering | `ts-prune -e` |
| `-u, --unusedInModule` | Hide exports marked `(used in module)` | `ts-prune -u` |
| `-h, --help` | Show help | `ts-prune -h` |

`--ignore` filters the report; `--skip` changes the analysis. For example, skipping tests allows exports used only by tests to appear as unused. Patterns are JavaScript regular expressions, not globs.

Without `--error`, findings do not cause a nonzero exit status. Configuration and execution errors still fail the command.

## Configuration

Create `.ts-prunerc.json`:

```json
{
  "project": "tsconfig.build.json",
  "ignore": "components/(Button|Input)",
  "skip": "\\.test\\.|test/",
  "unusedInModule": false
}
```

Or use the `ts-prune` property in `package.json`:

```json
{
  "ts-prune": {
    "project": "tsconfig.build.json",
    "error": true
  }
}
```

Configuration discovery also supports `.ts-prunerc` (JSON or YAML), `.ts-prunerc.yaml`, `.ts-prunerc.yml`, and JS, CJS, or TS configuration files such as `.ts-prunerc.cjs`:

```javascript
module.exports = {
  project: 'tsconfig.build.json',
  unusedInModule: true,
};
```

Use `export default` in TypeScript configuration files. Discovery starts in the working directory and searches parent directories until it reaches the home directory or filesystem root. Within a directory, the `ts-prune` property in `package.json` takes precedence over the standard configuration files. Project paths are resolved from the working directory.

Options are applied in this order: defaults, discovered configuration, explicitly supplied CLI options. In configuration files, use booleans for `error` and `unusedInModule`; `false` disables them. Legacy string values remain accepted, but the string `"false"` does not disable a flag.

## Ignoring an export

Place `// ts-prune-ignore-next` immediately before its declaration:

```typescript
// ts-prune-ignore-next
export interface PublicApi {
  name: string;
}
```

Files explicitly listed in the selected tsconfig's `files` array are treated as public entrypoints: their exports are excluded from the report. Files selected through `include` are analyzed normally.

## Using ts-prune in CI

Add a script to `package.json`:

```json
{
  "scripts": {
    "deadcode": "ts-prune --error"
  }
}
```

Run `npm run deadcode` in CI to fail when findings remain. Add `--unusedInModule` if you only want exports without detected local uses.

## Limitations

Review findings before deleting code:

- Frameworks and build tools may consume exports through conventions or reflection that ts-prune cannot detect.
- Imports with computed paths cannot reliably be resolved. Resolved literal dynamic imports, such as `import('./module')`, conservatively mark all exports in that module as used.
- Namespace uses that cannot be tracked, side-effect imports, and wildcard re-exports can keep unused exports out of the report.
- Uses outside the configured project are not visible. Mark public entrypoints or ignore exports consumed elsewhere.

## Development

Use the Node version in `.nvmrc`:

```sh
nvm install
nvm use
npm ci
npm run check           # lint, strict type checks, build, all tests
npm run test:unit
npm run test:integration
npm run test:coverage   # Node's built-in coverage report
npm run test:package    # install a tarball and check its CLI and API
npm run lint:fix        # apply lint fixes
```

Tests use `node:test` and `node:assert/strict`. Test compilation goes into `.test-build/`; the published CLI and CommonJS library are built into `lib/`. Integration tests run in temporary directories without global npm links. Coverage measures compiled source in test workers; CLI subprocess behavior is checked separately. The package smoke test installs production dependencies from npm into a temporary consumer project.

Development uses Node 26. CI tests Node 22, 24, and 26 on Linux and Node 26 on macOS and Windows. It runs on pull requests, pushes to `master` and `codex/**`, and version tags. Publishing is manual: choose **Actions → Release → Run workflow** and enter an existing version tag. The release reruns the full matrix before publishing; pushes and tags alone do not publish. See [PUBLISHING.md](PUBLISHING.md) for setup and release steps.

The build uses TypeScript 6.0.3 while the TypeScript ESLint parser requires a compiler version below 6.1. TypeScript 7 is deferred until the parser supports it. The analyzer uses the compiler bundled with ts-morph independently. Runtime dependencies are ts-morph and cosmiconfig. See [MODERNIZATION.md](MODERNIZATION.md) for dependency counts and verification results.

## Acknowledgements

Built with [ts-morph](https://github.com/dsherret/ts-morph) and inspired by [@dsherret's approach](https://gist.github.com/dsherret/0bae87310ce24866ae22425af80a9864).

### Contributors

<table>
<tr>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/nadeesha>
            <img src=https://avatars.githubusercontent.com/u/2942312?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Nadeesha Cabral/>
            <br />
            <sub style="font-size:14px"><b>Nadeesha Cabral</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/snyk-bot>
            <img src=https://avatars.githubusercontent.com/u/19733683?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Snyk bot/>
            <br />
            <sub style="font-size:14px"><b>Snyk bot</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/danvk>
            <img src=https://avatars.githubusercontent.com/u/98301?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Dan Vanderkam/>
            <br />
            <sub style="font-size:14px"><b>Dan Vanderkam</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/JoshuaKGoldberg>
            <img src=https://avatars.githubusercontent.com/u/3335181?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Josh Goldberg ✨/>
            <br />
            <sub style="font-size:14px"><b>Josh Goldberg ✨</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/vitalyiegorov>
            <img src=https://avatars.githubusercontent.com/u/586558?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Vitaly Iegorov/>
            <br />
            <sub style="font-size:14px"><b>Vitaly Iegorov</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/SimonJang>
            <img src=https://avatars.githubusercontent.com/u/10977475?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Simon Jang/>
            <br />
            <sub style="font-size:14px"><b>Simon Jang</b></sub>
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/gitter-badger>
            <img src=https://avatars.githubusercontent.com/u/8518239?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=The Gitter Badger/>
            <br />
            <sub style="font-size:14px"><b>The Gitter Badger</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/timbodeit>
            <img src=https://avatars.githubusercontent.com/u/4222754?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Tim Bodeit/>
            <br />
            <sub style="font-size:14px"><b>Tim Bodeit</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/sauntimo>
            <img src=https://avatars.githubusercontent.com/u/2720466?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Tim Saunders/>
            <br />
            <sub style="font-size:14px"><b>Tim Saunders</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/torkelrogstad>
            <img src=https://avatars.githubusercontent.com/u/16610775?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Torkel Rogstad/>
            <br />
            <sub style="font-size:14px"><b>Torkel Rogstad</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/felladrin>
            <img src=https://avatars.githubusercontent.com/u/418083?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Victor Nogueira/>
            <br />
            <sub style="font-size:14px"><b>Victor Nogueira</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/wcandillon>
            <img src=https://avatars.githubusercontent.com/u/306134?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=William Candillon/>
            <br />
            <sub style="font-size:14px"><b>William Candillon</b></sub>
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/curtvict>
            <img src=https://avatars.githubusercontent.com/u/96080054?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=curtvict/>
            <br />
            <sub style="font-size:14px"><b>curtvict</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/phiresky>
            <img src=https://avatars.githubusercontent.com/u/2303841?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=phiresky/>
            <br />
            <sub style="font-size:14px"><b>phiresky</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/rubengmurray>
            <img src=https://avatars.githubusercontent.com/u/31162373?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Reece Daniels/>
            <br />
            <sub style="font-size:14px"><b>Reece Daniels</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/mqqza>
            <img src=https://avatars.githubusercontent.com/u/9381249?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Mikhail Belyaev/>
            <br />
            <sub style="font-size:14px"><b>Mikhail Belyaev</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/jtbandes>
            <img src=https://avatars.githubusercontent.com/u/14237?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Jacob Bandes-Storch/>
            <br />
            <sub style="font-size:14px"><b>Jacob Bandes-Storch</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/ivosh>
            <img src=https://avatars.githubusercontent.com/u/1327828?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Ivo Raisr/>
            <br />
            <sub style="font-size:14px"><b>Ivo Raisr</b></sub>
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/hduprat>
            <img src=https://avatars.githubusercontent.com/u/3397791?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Hugo Duprat/>
            <br />
            <sub style="font-size:14px"><b>Hugo Duprat</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/daviseford>
            <img src=https://avatars.githubusercontent.com/u/9663863?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Davis Ford/>
            <br />
            <sub style="font-size:14px"><b>Davis Ford</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/dgraham>
            <img src=https://avatars.githubusercontent.com/u/122102?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=David Graham/>
            <br />
            <sub style="font-size:14px"><b>David Graham</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/calebpeterson>
            <img src=https://avatars.githubusercontent.com/u/18555288?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Caleb Peterson/>
            <br />
            <sub style="font-size:14px"><b>Caleb Peterson</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/ashokdelphia>
            <img src=https://avatars.githubusercontent.com/u/48444234?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Ashok Argent-Katwala/>
            <br />
            <sub style="font-size:14px"><b>Ashok Argent-Katwala</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/amir-arad>
            <img src=https://avatars.githubusercontent.com/u/6019373?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Amir Arad/>
            <br />
            <sub style="font-size:14px"><b>Amir Arad</b></sub>
        </a>
    </td>
</tr>
</table>

## Project status

This project has been resurrected after a long hiatus. Many projects still depend on ts-prune, and by now it seems to be encoded in AI model weights too. It needs to keep working.
