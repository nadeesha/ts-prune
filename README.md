# ts-prune

[![CI](https://github.com/nadeesha/ts-prune/actions/workflows/test.yml/badge.svg?branch=codex%2Frelease-0.11.0)](https://github.com/nadeesha/ts-prune/actions/workflows/test.yml?query=branch%3Acodex%2Frelease-0.11.0) [![npm](https://img.shields.io/npm/v/ts-prune)](https://www.npmjs.com/package/ts-prune) [![npm](https://img.shields.io/npm/dm/ts-prune)](https://www.npmjs.com/package/ts-prune) [![GitHub issues](https://img.shields.io/github/issues/nadeesha/ts-prune)](https://github.com/nadeesha/ts-prune/issues)

**Find potentially unused exports in your TypeScript project with zero configuration.**

## Version 0.11

The 0.11 release updates ts-prune for current Node.js and TypeScript projects, reduces runtime dependencies, and fixes configuration precedence, locally used export filtering, and piped output truncation. The CLI options and CommonJS API remain compatible.

**Node.js 22.18 or newer is required.** Development uses Node 26, with CI covering Node 22, 24, and 26 on Linux and Node 26 on macOS and Windows. Projects using older Node versions should remain on the 0.10 release line.

The project has 256 automated tests and two direct runtime dependencies: ts-morph and cosmiconfig. See [release notes](RELEASE_NOTES.md) for the changes and [modernization results](MODERNIZATION.md) for the testing and dependency details.

## What is ts-prune?

ts-prune is a simple, fast tool that finds exported TypeScript/JavaScript code that isn't being used anywhere in your project. It helps you:

- 🧹 **Clean up dead code** - Remove exports that serve no purpose
- 📦 **Reduce bundle size** - Eliminate unused code from your builds  
- 🔍 **Improve code quality** - Keep your codebase lean and maintainable
- ⚡ **Zero configuration** - Works out of the box with any TypeScript project

## Quick Start

### Installation

```bash
# npm
npm install --save-dev ts-prune

# yarn  
yarn add --dev ts-prune

# pnpm
pnpm add --save-dev ts-prune
```

### Basic Usage

```bash
# Run in your project root
npx ts-prune
```

**Example output:**
```
src/components/Button.ts:15 - ButtonVariant
src/utils/helpers.ts:8 - formatCurrency  
src/types/user.ts:12 - UserRole
src/api/client.ts:45 - ApiResponse
```

Each line shows: `file:line - exportName`

## Examples

### Example 1: Finding Unused Exports

Given these files:

```typescript
// src/utils/math.ts
export const add = (a: number, b: number) => a + b;
export const subtract = (a: number, b: number) => a - b;  // unused
export const multiply = (a: number, b: number) => a * b;  // unused

// src/app.ts  
import { add } from './utils/math';
console.log(add(2, 3));
```

Running `ts-prune` outputs:
```
src/utils/math.ts:2 - subtract
src/utils/math.ts:3 - multiply
```

### Example 2: Ignoring Specific Exports

Use `// ts-prune-ignore-next` to ignore specific exports:

```typescript
// src/api/types.ts
export interface User {
  id: string;
  name: string;
}

// ts-prune-ignore-next
export interface AdminUser extends User {  // ignored by ts-prune
  permissions: string[];
}

export interface Customer {  // will be flagged if unused
  customerId: string;
}
```

### Example 3: Working with Different File Types

ts-prune works with various TypeScript patterns:

```typescript
// Default exports
export default class MyClass {}

// Named exports  
export const myFunction = () => {};
export type MyType = string;
export interface MyInterface {}

// Re-exports
export { SomethingElse } from './other-file';
export * from './barrel-file';
```

## Configuration

### CLI Options

```bash
ts-prune [options]
```

| Option | Description | Example |
|--------|-------------|---------|
| `-p, --project` | Path to tsconfig.json | `ts-prune -p tsconfig.build.json` |
| `-i, --ignore` | Ignore pattern (RegExp) | `ts-prune -i "test\|spec"` |
| `-s, --skip` | Skip files pattern | `ts-prune -s "\.test\.ts$"` |
| `-e, --error` | Exit with error code if unused exports found | `ts-prune -e` |
| `-u, --unusedInModule` | Skip exports marked as "used in module" | `ts-prune -u` |

### Configuration File

Create `.ts-prunerc` (JSON), `.ts-prunerc.js`, or add to `package.json`:

```json
{
  "ignore": "components/(Button|Input)",
  "skip": "\\.test\\.|test/",
  "project": "tsconfig.build.json"
}
```

Configuration precedence is defaults, then the discovered configuration file, then explicitly supplied CLI options. Boolean options accept `true` and `false`; for example, `"unusedInModule": false` keeps locally used exports in the output. Existing string values remain supported.

## Development

Use Node.js 26 for development (`nvm install && nvm use`). The package requires Node.js 22.18 or newer; CI tests Node 22, 24, and 26 on Linux and Node 26 on macOS and Windows.

```bash
npm ci
npm run check           # lint, strict type checks, build, all tests
npm run test:unit       # unit and configuration tests
npm run test:integration
npm run test:coverage   # Node's built-in coverage report
npm run test:package    # pack, install production dependencies, test CLI/API
npm run lint:fix        # explicit lint fixes
```

Tests use `node:test` and `node:assert/strict`. The test command compiles TypeScript into `.test-build/` and builds the CLI into `lib/`; neither directory is published as test code. Integration tests run in isolated temporary directories and require no global npm links. Coverage reports compiled source exercised by the test workers; CLI subprocess behavior is checked separately by integration tests. The package smoke test uses the npm registry to install runtime dependencies into a temporary consumer project.

The build uses TypeScript 6.0.3 because the current TypeScript ESLint parser supports versions below 6.1. Upgrade the compiler to TypeScript 7 when the parser supports it. The analyzer uses the TypeScript compiler bundled with ts-morph independently of the build compiler.

Runtime dependencies are limited to ts-morph for TypeScript analysis and cosmiconfig for configuration discovery and loading. CLI parsing, tsconfig reading, and tests use project code, the existing compiler, and Node built-ins. CI runs on pull requests, pushes to `master` and `codex/**` branches, and version tags. Tagged releases publish to npm only after the full test matrix passes. See [PUBLISHING.md](PUBLISHING.md) for the release process.

## Common Use Cases

### 1. CI/CD Integration

Add to your package.json:
```json
{
  "scripts": {
    "deadcode": "ts-prune",
    "deadcode:ci": "ts-prune --error"
  }
}
```

### 2. Pre-commit Hook

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "ts-prune --error"
    }
  }
}
```

### 3. Count Unused Exports

```bash
ts-prune | wc -l
```

### 4. Filter Results

```bash
# Ignore test files
ts-prune | grep -v "\.test\."

# Only show specific directories  
ts-prune | grep "src/components"

# Ignore multiple patterns
ts-prune | grep -v -E "(test|spec|stories)"
```

## Understanding the Output

ts-prune categorizes exports into different types:

- **Regular unused export**: `src/file.ts:10 - exportName`
- **Used in module**: `src/file.ts:5 - localHelper (used in module)` 
  - Export is only used within the same file
  - Use `-u` flag to ignore these

## Limitations

- **Dynamic imports**: `import('./dynamic-file')` usage might not be detected
- **String-based imports**: `require('module-name')` patterns
- **Framework magic**: Some frameworks use exports through reflection
- **Configuration files**: Exports in config files might appear unused

For these cases, use `// ts-prune-ignore-next` or configure ignore patterns.

## FAQ

### How accurate is ts-prune?

ts-prune is conservative and may show false positives for:
- Dynamically imported modules
- Framework-specific patterns (Angular services, React lazy loading)
- Build tool configurations

### Can I use this with JavaScript?

Yes! ts-prune works with `.js` files in TypeScript projects. Ensure your `tsconfig.json` includes JavaScript files:

```json
{
  "compilerOptions": {
    "allowJs": true
  }
}
```

## Acknowledgements

Built with the excellent [ts-morph](https://github.com/dsherret/ts-morph) library and inspired by [this approach](https://gist.github.com/dsherret/0bae87310ce24866ae22425af80a9864) by [@dsherret](https://github.com/dsherret).

## Contributors

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