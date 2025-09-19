import { IAnalysedResult, AnalysisResultTypeEnum } from "./analyzer";
import { differenceBy } from "./utils/common";

export class State {
  private results: Array<IAnalysedResult> = [];

  private resultsOfType = (type: AnalysisResultTypeEnum) =>
    this.results.filter((r) => r.type === type);

  onResult = (result: IAnalysedResult) => {
    this.results.push(result);
  };

  definitelyUnused = () =>
    differenceBy(
      (result) => result.file,
      this.resultsOfType(AnalysisResultTypeEnum.POTENTIALLY_UNUSED),
      this.resultsOfType(AnalysisResultTypeEnum.DEFINITELY_USED)
    ).filter((result) => result.symbols.length > 0);
}
