# ts-vulture

Code path:

- index.ts
-> runner.ts:run
-> analyzer.ts:analyze
-> emitPotentiallyUnused
  -> getExported(file)
    -> file.getExportSymbols()
    - *add a patch here*
-> emitDefinitelyUsed

Questions:

- What's potentially unused vs. definitely used?

```ts
export type IAnalysedResult = {
  file: string;
  type: AnalysisResultTypeEnum;  // POTENTIALLY_UNUSED | DEFINITELY_USED
  symbols: Array<{
    name: string;
    line?: number
  }>;
}
```

This is handy: <https://ts-ast-viewer.com/#>
