import { State } from "./state";
import { AnalysisResultTypeEnum } from "./analyzer";
import { present } from "./presenter";

describe("present", () => {
  describe("when given state with unused exports", () => {
    const state = new State();

    [
      {
        type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
        symbols: ["foo"],
        file: "foo.ts"
      },
      {
        type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
        symbols: ["bar"],
        file: "bar.ts"
      }
    ].forEach(result => state.onResult(result));

    it("should produce a presentable output", () => {
      expect(JSON.stringify(present(state))).toBe(
        JSON.stringify(["foo @ foo.ts", "bar @ bar.ts"])
      );
    });
  });

  describe("when given state with no unused exports", () => {
    const state = new State();

    [
      {
        type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
        symbols: ["foo"],
        file: "foo.ts"
      },
      {
        type: AnalysisResultTypeEnum.DEFINITELY_USED,
        symbols: ["foo"],
        file: "foo.ts"
      }
    ].forEach(result => state.onResult(result));

    it("should produce an empty output", () => {
      expect(JSON.stringify(present(state))).toBe(JSON.stringify([]));
    });
  });
});
