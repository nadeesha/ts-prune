import { State } from "./state";
import { ResultSymbol } from "./analyzer";

export const USED_IN_MODULE = ' (used in module)';

const formatOutput = (file: string, result: ResultSymbol) => {
  const {name, line, usedInModule} = result;
  return `${file}:${line} - ${name}` + (usedInModule ? `${USED_IN_MODULE}` : '');
}

export const present = (state: State): string[] => {
  const unused2D = state
    .definitelyUnused()
    .map(result => ({
      file: result.file.replace(process.cwd(), "").replace(new RegExp("^/"), ""),
      symbols: result.symbols
    }))
    .map(
      ({file, symbols}) => symbols.map(sym => formatOutput(file, sym))
    );

  return [].concat.apply([], unused2D);
};
