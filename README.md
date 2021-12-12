![Build](https://img.shields.io/github/workflow/status/nadeesha/ts-prune/Run%20CI%20Pipeline) ![npm](https://img.shields.io/npm/dm/ts-prune) ![GitHub issues](https://img.shields.io/github/issues-raw/nadeesha/ts-prune)

# ts-prune

Find potentially unused exports in your Typescript project with zero configuration.

[![asciicast](https://asciinema.org/a/liQKNmkGkedCnyHuJzzgu7uDI.svg)](https://asciinema.org/a/liQKNmkGkedCnyHuJzzgu7uDI) [![Join the chat at https://gitter.im/ts-prune/community](https://badges.gitter.im/ts-prune/community.svg)](https://gitter.im/ts-prune/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Getting Started

`ts-prune` exposes a cli that reads your tsconfig file and prints out all the unused exports in your source files.

### Installing

Install ts-prune with yarn or npm

```sh
# npm
npm install ts-prune --save-dev
# yarn
yarn add -D ts-prune
```

### Usage

You can install it in your project and alias it to a npm script in package.json.

```json
{
  "scripts": {
    "find-deadcode": "ts-prune"
  }
}
```

If you want to run against different Typescript configuration than tsconfig.json:

```sh
ts-prune -p tsconfig.dev.json
```

### Examples

- [gatsby-material-starter](https://github.com/Vagr9K/gatsby-material-starter/blob/bdeba4160319c1977c83ee90e035c7fe1bd1854c/themes/material/package.json#L147)
- [DestinyItemManager](https://github.com/DestinyItemManager/DIM/blob/aeb43dd848b5137656e6f47812189a2beb970089/package.json#L26)

### Configuration
ts-prune supports CLI and file configuration via [cosmiconfig](https://github.com/davidtheclark/cosmiconfig#usage) (all file formats are supported).

#### Configuration options
- `-p, --project` - __tsconfig.json__ path(`tsconfig.json` by default)
- `-i, --ignore` - errors ignore RegExp pattern
- `-e, --error` - return error code if unused exports are found
- `-s, --skip` - skip these files when determining whether code is used. (For example, `.test.ts?` will stop ts-prune from considering an export in test file usages)

CLI configuration options:
```bash 
ts-prune -p my-tsconfig.json -i my-component-ignore-patterns?
```
Configuration file example `ts-prunerc`: 
```json
{
  "ignore": "my-component-ignore-patterns?"
}
```
 
### FAQ

#### How do I get the count of unused exports?

```sh
ts-prune | wc -l
```

#### How do I ignore a specific path?

```sh
ts-prune | grep -v src/ignore-this-path
```

#### How do I ignore a specific identifier?

You can either, 

##### 1. Prefix the export with `// ts-prune-ignore-next`

```ts
// ts-prune-ignore-next
export const thisNeedsIgnoring = foo;
```

##### 2. Use `grep -v` to ignore a more widely used export name

```sh
ts-prune | grep -v ignoreThisThroughoutMyCodebase
```

### Acknowledgements

- The excellent [ts-morph](https://github.com/dsherret/ts-morph) library. And [this gist](https://gist.github.com/dsherret/0bae87310ce24866ae22425af80a9864) by [@dsherret](https://github.com/dsherret).

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
        <a href=https://github.com/vitalyiegorov>
            <img src=https://avatars.githubusercontent.com/u/586558?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Vitaly Iegorov/>
            <br />
            <sub style="font-size:14px"><b>Vitaly Iegorov</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/amir-arad>
            <img src=https://avatars.githubusercontent.com/u/6019373?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Amir Arad/>
            <br />
            <sub style="font-size:14px"><b>Amir Arad</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/dgraham>
            <img src=https://avatars.githubusercontent.com/u/122102?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=David Graham/>
            <br />
            <sub style="font-size:14px"><b>David Graham</b></sub>
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/daviseford>
            <img src=https://avatars.githubusercontent.com/u/9663863?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Davis Ford/>
            <br />
            <sub style="font-size:14px"><b>Davis Ford</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/ivosh>
            <img src=https://avatars.githubusercontent.com/u/1327828?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Ivo Raisr/>
            <br />
            <sub style="font-size:14px"><b>Ivo Raisr</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/JoshuaKGoldberg>
            <img src=https://avatars.githubusercontent.com/u/3335181?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Josh Goldberg/>
            <br />
            <sub style="font-size:14px"><b>Josh Goldberg</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/koddsson>
            <img src=https://avatars.githubusercontent.com/u/318208?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Kristján Oddsson/>
            <br />
            <sub style="font-size:14px"><b>Kristján Oddsson</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/SimonJang>
            <img src=https://avatars.githubusercontent.com/u/10977475?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=Simon Jang/>
            <br />
            <sub style="font-size:14px"><b>Simon Jang</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/gitter-badger>
            <img src=https://avatars.githubusercontent.com/u/8518239?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=The Gitter Badger/>
            <br />
            <sub style="font-size:14px"><b>The Gitter Badger</b></sub>
        </a>
    </td>
</tr>
<tr>
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
        <a href=https://github.com/wcandillon>
            <img src=https://avatars.githubusercontent.com/u/306134?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=William Candillon/>
            <br />
            <sub style="font-size:14px"><b>William Candillon</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 150.0; height: 150.0">
        <a href=https://github.com/phiresky>
            <img src=https://avatars.githubusercontent.com/u/2303841?v=4 width="100;"  style="border-radius:50%;align-items:center;justify-content:center;overflow:hidden;padding-top:10px" alt=phiresky/>
            <br />
            <sub style="font-size:14px"><b>phiresky</b></sub>
        </a>
    </td>
</tr>
</table>
