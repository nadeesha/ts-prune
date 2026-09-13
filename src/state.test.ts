import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { State } from "./state";
import { AnalysisResultTypeEnum } from "./analyzer";

describe("State", () => {
  describe("when given state with unused exports", () => {
    const state = new State();

    [
      {
        type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
        symbols: [{ name: "foo", line: 0, usedInModule: false }],
        file: "foo.ts"
      },
      {
        type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
        symbols: [{ name: "bar", line: 0, usedInModule: false }],
        file: "bar.ts"
      }
    ].forEach(result => state.onResult(result));

    it("should have definitelyUnused exports", () => {
      assert.equal(state.definitelyUnused().length, 2);
    });
  });

  describe("when given state with no unused exports", () => {
    const state = new State();

    [
      {
        type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
        symbols: [{ name: "foo", line: 0, usedInModule: false }],
        file: "foo.ts"
      },
      {
        type: AnalysisResultTypeEnum.DEFINITELY_USED,
        symbols: [{ name: "foo", line: 0, usedInModule: false }],
        file: "foo.ts"
      }
    ].forEach(result => state.onResult(result));

    it("should not have definitelyUnused exports", () => {
      assert.equal(state.definitelyUnused().length, 0);
    });
  });
});
