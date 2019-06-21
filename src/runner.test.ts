import { run, createExecPipeline } from "./runner";
import { map } from "rxjs/operators";

export function unusedFooFunction() {
  return "bar";
}

export function unusedBarFunction() {
  return "bar";
}

describe("runner", () => {
  it("should find the unused unusedFooFunction and unusedBarFunction exports", () => {
    const pipeline = createExecPipeline();

    const assertOutputContainsUnusedFunctions = (output = "") =>
      [unusedFooFunction.name, unusedBarFunction.name].forEach(
        unusedFunctionName => {
          JSON.stringify(output).includes(unusedFunctionName);
        }
      );

    pipeline
      .pipe(map(output => JSON.stringify(output)))
      .subscribe(assertOutputContainsUnusedFunctions);
  });
});
