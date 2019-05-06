# ts-prune

Remove unused exports in your Typescript project with zero configuration.

[![asciicast](https://asciinema.org/a/liQKNmkGkedCnyHuJzzgu7uDI.svg)](https://asciinema.org/a/liQKNmkGkedCnyHuJzzgu7uDI)

## Getting Started

`ts-prune` exposes a cli that reads your tsconfig file and prints out all the unused exports in your source files.

### Installing

Install ts-prune with yarn or npm

```sh
npm install ts-prune -g
```

### Usage

```sh
ts-prune
```

Or you can install it in your project and alias it to a npm script in package.json.

```json
  "scripts": {
    "find-deadcode": "ts-prune"
  }
```

If you want to run against different Typescript configuration than tsconfig.json:

```sh
ts-prune -p tsconfig.dev.json
```

### Acknowledgements

- The excellent [ts-morph](https://github.com/dsherret/ts-morph) library.

### Licence

MIT
