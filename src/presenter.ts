import { State } from "./state";
import { IAnalysedResult } from "./analyzer";

export const present = (state: State): string[] => {
  const unused2D = state
    .definitelyUnused()
    .map(result => ({
      file: result.file.replace(process.cwd(), "").replace(new RegExp("^/"), ""),
      symbols: result.symbols
    }))
    .map(result => {
      return result.symbols.map(symbol => [[result.file, symbol.line].join(":"), symbol.name].join(" - "));
    });

  return [].concat.apply([], unused2D);
};
