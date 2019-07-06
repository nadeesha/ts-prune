import { State } from "./state";
import { IAnalysedResult } from "./analyzer";

export const present = (state: State) => {
  const unused2D = state
    .definitelyUnused()
    .filter(result => result.symbols.length > 0)
    .map(result => ({
      file: result.file.replace(process.cwd(), ""),
      symbols: result.symbols
    }))
    .map(result => {
      return result.symbols.map(symbol => [symbol, result.file].join(" @ "));
    });

  return [].concat.apply([], unused2D) as Array<IAnalysedResult>;
};
